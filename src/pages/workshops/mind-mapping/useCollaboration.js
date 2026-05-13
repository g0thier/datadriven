import { useCallback, useMemo } from "react";
import {
  addConcept as addConceptService,
  addComment as addCommentService,
  createNote,
  removeConcept as removeConceptService,
  removeComment as removeCommentService,
  removeNote as removeNoteService,
  setReformulation as setMindMappingReformulation,
  setDescription as setDescriptionService,
  subscribeSession,
  toggleConceptVote as toggleConceptVoteService,
  updateConcept,
  updateComment,
  updateNote,
  upsertParticipant,
} from "../../../firebase/workshops/mind-mapping.service";
import {
  asObject,
  buildVotesByItem,
  countVotes,
  EMPTY_OBJECT,
  normalizeVotesByParticipant,
  sortByCreatedAt,
  toById,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
import { useWorkshopParticipants } from "../useWorkshopParticipants.js";
const MAX_STICKERS = 3;

export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "mind-mapping";

  const {
    sessionGuests,
    participant,
    participantReady,
    syncError,
    syncErrorSessionId,
    setSessionError,
    activeState,
    lastSnapshotSessionId,
  } = useWorkshopCollaborationCore({
    sessionId,
    session,
    isEnabled,
    subscribeSession: subscribeSession,
    upsertParticipant: upsertParticipant,
    syncErrorMessage: "Impossible de se synchroniser avec le serveur.",
    participantErrorMessage: "Impossible d'enregistrer le participant.",
  });
  const rawDescription = String(activeState?.step1?.description || "");

  const rawNotes = asObject(activeState?.notes);

  const notes = useMemo(() => {
    return Object.entries(rawNotes)
      .map(([noteId, data]) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .sort(sortByCreatedAt);
  }, [rawNotes]);

  const notesById = useMemo(() => toById(notes), [notes]);

  const rawCommentsByNote = asObject(activeState?.commentsByNote);

  const commentsByNote = useMemo(() => {
    const normalizedComments = {};

    Object.entries(rawCommentsByNote).forEach(([noteId, comments]) => {
      if (!comments || typeof comments !== "object") return;

      normalizedComments[noteId] = Object.entries(comments)
        .map(([commentId, data]) => ({
          id: String(data?.id || commentId),
          authorId: String(data?.authorId || ""),
          text: data?.text ?? "",
          createdAt: data?.createdAt || "",
          updatedAt: data?.updatedAt || "",
        }))
        .sort(sortByCreatedAt);
    });

    return normalizedComments;
  }, [rawCommentsByNote]);

  const rawConcepts = asObject(activeState?.concepts);

  const concepts = useMemo(() => {
    return Object.entries(rawConcepts)
      .map(([conceptId, data]) => ({
        id: String(data?.id || conceptId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        from: {
          noteId: String(data?.from?.noteId || ""),
          ideaId: String(data?.from?.ideaId || ""),
        },
        to: {
          noteId: String(data?.to?.noteId || ""),
          ideaId: String(data?.to?.ideaId || ""),
        },
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .filter(
        (concept) =>
          concept.from.noteId &&
          concept.from.ideaId &&
          concept.to.noteId &&
          concept.to.ideaId
      )
      .sort(sortByCreatedAt);
  }, [rawConcepts]);

  const conceptsById = useMemo(() => toById(concepts), [concepts]);
  const conceptIdsSet = useMemo(() => new Set(concepts.map((concept) => concept.id)), [concepts]);

  const ideaKeySet = useMemo(() => {
    const keys = new Set();

    Object.entries(commentsByNote).forEach(([noteId, comments]) => {
      if (!Array.isArray(comments)) return;

      comments.forEach((comment) => {
        const commentId = String(comment?.id || "");
        if (!commentId) return;
        keys.add(`${noteId}::${commentId}`);
      });
    });

    return keys;
  }, [commentsByNote]);

  const remoteParticipants = asObject(activeState?.participants);

  const authoredParticipantIds = useMemo(
    () => notes.map((note) => note.authorId),
    [notes]
  );
  const { participants, getParticipantLabel } = useWorkshopParticipants({
    sessionGuests,
    remoteParticipants,
    currentParticipant: participant,
    authoredParticipantIds,
    variant: "default",
    mergeOrder: ["guests", "remote", "authored", "current"],
  });

  const currentParticipantId = participant?.id || "";
  const description = rawDescription;
  const rawVotesByParticipant = asObject(activeState?.votesByParticipant);
  const votesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawVotesByParticipant, { validIdsSet: conceptIdsSet }),
    [conceptIdsSet, rawVotesByParticipant]
  );

  const votesByConcept = useMemo(
    () => buildVotesByItem(votesByParticipant, { validIdsSet: conceptIdsSet, seedIds: conceptIdsSet }),
    [conceptIdsSet, votesByParticipant]
  );
  const rawReformulationsByConcept = asObject(activeState?.reformulationsByConcept);

  const reformulationsByConcept = useMemo(() => {
    return concepts.reduce((accumulator, concept) => {
      accumulator[concept.id] = {
        text: String(rawReformulationsByConcept?.[concept.id]?.text || ""),
        updatedAt: String(rawReformulationsByConcept?.[concept.id]?.updatedAt || ""),
        updatedBy: String(rawReformulationsByConcept?.[concept.id]?.updatedBy || ""),
      };
      return accumulator;
    }, {});
  }, [concepts, rawReformulationsByConcept]);

  const myVotes = currentParticipantId ? votesByParticipant[currentParticipantId] || EMPTY_OBJECT : EMPTY_OBJECT;
  const myVoteCount = useMemo(() => countVotes(myVotes, conceptIdsSet), [conceptIdsSet, myVotes]);

  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

  const setDescription = useCallback(
    async (description, previousDescription = description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setDescriptionService(sessionId, currentParticipantId, description, {
          expectedPreviousDescription: previousDescription,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour le sujet:", error);
        setSessionError("Le sujet n'a pas pu être enregistré.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError
    ]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const text = options?.text ?? "";

      try {
        return await createNote(sessionId, {
          authorId: currentParticipantId,
          text,
        });
      } catch (error) {
        console.error("Impossible d'ajouter la note:", error);
        setSessionError("La note n'a pas pu être ajoutée.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      if (!notesById[noteId]) return;

      try {
        await updateNote(sessionId, noteId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour la note:", error);
        setSessionError("La note n'a pas pu être mise à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      notesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      if (!notesById[noteId]) return;

      try {
        await removeNoteService(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer la note:", error);
        setSessionError("La note n'a pas pu être supprimée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      notesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const addComment = useCallback(
    async (noteId, text = "") => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return null;
      }

      if (!notesById[noteId]) return null;

      try {
        return await addCommentService(sessionId, noteId, {
          authorId: currentParticipantId,
          text,
        });
      } catch (error) {
        console.error("Impossible d'ajouter la sous-note:", error);
        setSessionError("La sous-note n'a pas pu être ajoutée.");
        return null;
      }
    },
    [
      currentParticipantId,
      isEnabled,
      notesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const updateCommentText = useCallback(
    async (noteId, commentId, text) => {
      if (
        !isEnabled ||
        !sessionId ||
        !participantReady ||
        !noteId ||
        !commentId ||
        !currentParticipantId
      ) {
        return;
      }

      if (!notesById[noteId]) return;

      try {
        await updateComment(sessionId, noteId, commentId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour la sous-note:", error);
        setSessionError("La sous-note n'a pas pu être mise à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      notesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeComment = useCallback(
    async (noteId, commentId) => {
      if (
        !isEnabled ||
        !sessionId ||
        !participantReady ||
        !noteId ||
        !commentId ||
        !currentParticipantId
      ) {
        return;
      }

      if (!notesById[noteId]) return;

      try {
        await removeCommentService(sessionId, noteId, commentId);
      } catch (error) {
        console.error("Impossible de supprimer la sous-note:", error);
        setSessionError("La sous-note n'a pas pu être supprimée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      notesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const addConcept = useCallback(
    async (payload = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) {
        return null;
      }

      const fromNoteId = String(payload?.fromNoteId || "").trim();
      const fromIdeaId = String(payload?.fromIdeaId || "").trim();
      const toNoteId = String(payload?.toNoteId || "").trim();
      const toIdeaId = String(payload?.toIdeaId || "").trim();

      if (!fromNoteId || !fromIdeaId || !toNoteId || !toIdeaId) return null;

      const fromKey = `${fromNoteId}::${fromIdeaId}`;
      const toKey = `${toNoteId}::${toIdeaId}`;
      if (!ideaKeySet.has(fromKey) || !ideaKeySet.has(toKey)) return null;

      try {
        return await addConceptService(sessionId, {
          authorId: currentParticipantId,
          text: payload?.text ?? "",
          from: { noteId: fromNoteId, ideaId: fromIdeaId },
          to: { noteId: toNoteId, ideaId: toIdeaId },
        });
      } catch (error) {
        console.error("Impossible d'ajouter le concept:", error);
        setSessionError("Le concept n'a pas pu être ajouté.");
        return null;
      }
    },
    [
      currentParticipantId,
      ideaKeySet,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const updateConceptText = useCallback(
    async (conceptId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !conceptId || !currentParticipantId) {
        return;
      }

      if (!conceptsById[conceptId]) return;

      try {
        await updateConcept(sessionId, conceptId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour le concept:", error);
        setSessionError("Le concept n'a pas pu être mis à jour.");
      }
    },
    [
      conceptsById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeConcept = useCallback(
    async (conceptId) => {
      if (!isEnabled || !sessionId || !participantReady || !conceptId || !currentParticipantId) {
        return;
      }

      if (!conceptsById[conceptId]) return;

      try {
        await removeConceptService(sessionId, conceptId);
      } catch (error) {
        console.error("Impossible de supprimer le concept:", error);
        setSessionError("Le concept n'a pas pu être supprimé.");
      }
    },
    [
      conceptsById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const toggleConceptVote = useCallback(
    async (conceptId) => {
      if (!isEnabled || !sessionId || !participantReady || !conceptId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      if (!conceptIdsSet.has(conceptId)) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleConceptVoteService(sessionId, currentParticipantId, conceptId, {
          maxVotes: MAX_STICKERS,
          validConceptIds: conceptIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier le vote concept:", error);
        setSessionError("Le vote concept n'a pas pu être enregistré.");
        return { committed: false, votes: {} };
      }
    },
    [
      conceptIdsSet,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const setReformulation = useCallback(
    async (conceptId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !conceptId || !currentParticipantId) {
        return;
      }

      if (!conceptsById[conceptId]) return;

      try {
        await setMindMappingReformulation(sessionId, currentParticipantId, conceptId, text);
      } catch (error) {
        console.error("Impossible de mettre à jour la reformulation:", error);
        setSessionError("La reformulation n'a pas pu être enregistrée.");
      }
    },
    [
      conceptsById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const actions = useMemo(
    () => ({
      setDescription,
      addNote,
      updateNoteText,
      removeNote,
      addComment,
      updateCommentText,
      removeComment,
      addConcept,
      updateConceptText,
      removeConcept,
      toggleConceptVote,
      setReformulation,
    }),
    [
      addConcept,
      addComment,
      addNote,
      removeConcept,
      removeComment,
      removeNote,
      setDescription,
      setReformulation,
      toggleConceptVote,
      updateConceptText,
      updateCommentText,
      updateNoteText,
    ]
  );

  const effectiveSyncError = isEnabled && syncErrorSessionId === sessionId ? syncError : "";
  const effectiveIsLoading =
    isEnabled && (!participantReady || (lastSnapshotSessionId !== sessionId && !effectiveSyncError));

  return {
    isEnabled,
    participantReady,
    isLoading: effectiveIsLoading,
    syncError: effectiveSyncError,
    participant,
    participants,
    getParticipantLabel,
    description,
    notes,
    commentsByNote,
    concepts,
    votesByParticipant,
    votesByConcept,
    reformulationsByConcept,
    myVoteCount,
    remainingVotes,
    maxStickers: MAX_STICKERS,
    actions,
  };
}

export default useCollaboration;
