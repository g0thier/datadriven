/**
 * @module workshops/paper-brain/usePaperBrainCollaboration
 * @description Collaboration hook managing realtime Paper Brain workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addComment as addCommentService,
  createNote,
  removeComment as removeCommentService,
  removeNote as removeNoteService,
  setNotePosition as setNotePositionService,
  setStep1Description as setStep1DescriptionService,
  subscribeSession,
  toggleVote as toggleVoteService,
  updateComment,
  updateNote,
  upsertParticipant,
} from "../../../firebase/workshops/paper-brain.service";
import {
  buildGridPosition,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  makeParticipantFallbackLabel,
  normalizePosition,
  resolveGuestName,
  sortByCreatedAt,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";

const MAX_STICKERS = 3;
const GRID_POSITION_CONFIG = Object.freeze({
  columns: 5,
  startX: 40,
  startY: 40,
  gapX: 290,
  gapY: 220,
});

/**
 * Provides realtime collaboration state and actions for Paper Brain sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Paper Brain behavior.
 * @returns {Object} Collaboration state (notes, comments, votes, participant, errors) and write actions.
 *
 * @example
 * import { usePaperBrainCollaboration } from "./paper-brain/useCollaboration.js";
 *
 * // Real usage reference: src/pages/workshops/WorkshopRunner.jsx
 * const collaboration = usePaperBrainCollaboration({
 *   sessionId,
 *   session,
 *   workshopId: resolvedWorkshopId,
 * });
 */
export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "paper-brain";

  const [lastNonEmptyStep1Description, setLastNonEmptyStep1Description] = useState("");
  const step1RestoreInFlightRef = useRef(false);

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
  const rawStep1Description = String(activeState?.step1?.description || "");

  useEffect(() => {
    setLastNonEmptyStep1Description("");
    step1RestoreInFlightRef.current = false;
  }, [isEnabled, sessionId]);

  useEffect(() => {
    if (!rawStep1Description) return;

    setLastNonEmptyStep1Description((currentValue) =>
      currentValue === rawStep1Description ? currentValue : rawStep1Description
    );
  }, [rawStep1Description]);

  const rawNotes =
    activeState?.notes && typeof activeState.notes === "object"
      ? activeState.notes
      : EMPTY_OBJECT;

  const notes = useMemo(() => {
    return Object.entries(rawNotes)
      .map(([noteId, data], index) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        position: normalizePosition(
          data?.position,
          buildGridPosition(index, GRID_POSITION_CONFIG)
        ),
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .sort(sortByCreatedAt);
  }, [rawNotes]);

  const notesById = useMemo(
    () =>
      notes.reduce((accumulator, note) => {
        accumulator[note.id] = note;
        return accumulator;
      }, {}),
    [notes]
  );

  const rawCommentsByNote =
    activeState?.commentsByNote &&
    typeof activeState.commentsByNote === "object"
      ? activeState.commentsByNote
      : EMPTY_OBJECT;

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

  const rawVotesByParticipant =
    activeState?.votesByParticipant &&
    typeof activeState.votesByParticipant === "object"
      ? activeState.votesByParticipant
      : EMPTY_OBJECT;

  const votesByParticipant = useMemo(() => {
    const normalizedVotes = {};

    Object.entries(rawVotesByParticipant).forEach(([participantId, votes]) => {
      if (!votes || typeof votes !== "object") return;

      const cleanedVotes = Object.entries(votes).reduce((accumulator, [noteId, enabled]) => {
        if (!enabled) return accumulator;
        accumulator[noteId] = true;
        return accumulator;
      }, {});

      if (Object.keys(cleanedVotes).length > 0) {
        normalizedVotes[participantId] = cleanedVotes;
      }
    });

    return normalizedVotes;
  }, [rawVotesByParticipant]);

  const noteIdsSet = useMemo(() => new Set(notes.map((note) => note.id)), [notes]);

  const votesByNote = useMemo(() => {
    const byNote = {};

    Object.entries(votesByParticipant).forEach(([participantId, votes]) => {
      Object.keys(votes).forEach((noteId) => {
        if (!noteIdsSet.has(noteId)) return;

        if (!byNote[noteId]) {
          byNote[noteId] = new Set();
        }

        byNote[noteId].add(participantId);
      });
    });

    return byNote;
  }, [noteIdsSet, votesByParticipant]);

  const remoteParticipants =
    activeState?.participants &&
    typeof activeState.participants === "object"
      ? activeState.participants
      : EMPTY_OBJECT;

  const participants = useMemo(() => {
    const participantMap = new Map();

    const addParticipant = (id, data = {}) => {
      const participantId = String(id || "").trim();
      if (!participantId) return;

      const current = participantMap.get(participantId) || {
        id: participantId,
        name: "",
        email: "",
        isAuthenticated: false,
      };

      const resolvedName = String(data?.name || "").trim();
      const resolvedEmail = String(data?.email || "").trim();

      participantMap.set(participantId, {
        id: participantId,
        name: resolvedName || current.name || makeParticipantFallbackLabel(participantId),
        email: resolvedEmail || current.email,
        isAuthenticated: Boolean(data?.isAuthenticated ?? current.isAuthenticated),
      });
    };

    sessionGuests.forEach((guest) => {
      const guestId = String(guest?.id || guest?.email || "").trim();
      if (!guestId) return;

      addParticipant(guestId, {
        name: resolveGuestName(guest),
        email: guest?.email || "",
      });
    });

    Object.entries(remoteParticipants).forEach(([participantId, data]) => {
      addParticipant(participantId, {
        name: data?.name || "",
        email: data?.email || "",
        isAuthenticated: Boolean(data?.isAuthenticated),
      });
    });

    notes.forEach((note) => {
      addParticipant(note.authorId);
    });

    if (participant?.id) {
      addParticipant(participant.id, participant);
    }

    return Array.from(participantMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr")
    );
  }, [notes, participant, remoteParticipants, sessionGuests]);

  const participantById = useMemo(() => {
    return participants.reduce((accumulator, currentParticipant) => {
      accumulator[currentParticipant.id] = currentParticipant;
      return accumulator;
    }, {});
  }, [participants]);

  const getParticipantLabel = useCallback(
    (participantId) => {
      if (!participantId) return "Participant";

      return (
        participantById[participantId]?.name ||
        makeParticipantFallbackLabel(participantId)
      );
    },
    [participantById]
  );

  const currentParticipantId = participant?.id || "";
  const step1Description = rawStep1Description || lastNonEmptyStep1Description;

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
    if (rawStep1Description || !lastNonEmptyStep1Description) return;
    if (step1RestoreInFlightRef.current) return;

    let cancelled = false;
    step1RestoreInFlightRef.current = true;

    const restoreStep1Description = async () => {
      try {
        await setStep1DescriptionService(
          sessionId,
          currentParticipantId,
          lastNonEmptyStep1Description,
          { expectedPreviousDescription: "" }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer la description:", error);
      } finally {
        if (!cancelled) {
          step1RestoreInFlightRef.current = false;
        }
      }
    };

    restoreStep1Description();

    return () => {
      cancelled = true;
    };
  }, [
    currentParticipantId,
    isEnabled,
    lastNonEmptyStep1Description,
    participantReady,
    rawStep1Description,
    sessionId,
  ]);

  const myNotes = useMemo(
    () => notes.filter((note) => note.authorId === currentParticipantId),
    [currentParticipantId, notes]
  );

  const myVotes =
    currentParticipantId && votesByParticipant[currentParticipantId]
      ? votesByParticipant[currentParticipantId]
      : EMPTY_OBJECT;

  const myVoteCount = useMemo(() => {
    return Object.keys(myVotes).reduce((count, noteId) => {
      if (!noteIdsSet.has(noteId)) return count;
      return count + 1;
    }, 0);
  }, [myVotes, noteIdsSet]);

  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

  const setStep1Description = useCallback(
    async (description, previousDescription = step1Description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setStep1DescriptionService(sessionId, currentParticipantId, description, {
          expectedPreviousDescription: previousDescription,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour la description:", error);
        setSessionError("La description n'a pas pu être enregistrée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      step1Description,
    ]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const fallbackPosition = buildGridPosition(notes.length, GRID_POSITION_CONFIG);
      const position = normalizePosition(options?.position, fallbackPosition);
      const text = options?.text ?? "";

      try {
        return await createNote(sessionId, {
          authorId: currentParticipantId,
          text,
          position,
        });
      } catch (error) {
        console.error("Impossible d'ajouter la note:", error);
        setSessionError("La note n'a pas pu être ajoutée.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, notes.length, participantReady, sessionId, setSessionError]
  );

  const updateNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = notesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await updateNote(sessionId, noteId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour la note:", error);
        setSessionError("La note n'a pas pu être mise à jour.");
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
  );

  const removeNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = notesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await removeNoteService(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer la note:", error);
        setSessionError("La note n'a pas pu être supprimée.");
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
  );

  const addComment = useCallback(
    async (noteId, text = "") => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return null;
      }

      const note = notesById[noteId];
      if (!note || note.authorId === currentParticipantId) return null;

      try {
        return await addCommentService(sessionId, noteId, {
          authorId: currentParticipantId,
          text,
        });
      } catch (error) {
        console.error("Impossible d'ajouter le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
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

      const comment = (commentsByNote[noteId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );

      if (!comment || comment.authorId !== currentParticipantId) return;

      try {
        await updateComment(sessionId, noteId, commentId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être mis à jour.");
      }
    },
    [commentsByNote, currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
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

      const comment = (commentsByNote[noteId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );

      if (!comment || comment.authorId !== currentParticipantId) return;

      try {
        await removeCommentService(sessionId, noteId, commentId);
      } catch (error) {
        console.error("Impossible de supprimer le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être supprimé.");
      }
    },
    [commentsByNote, currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const setNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setNotePositionService(sessionId, noteId, position);
      } catch (error) {
        console.error("Impossible de déplacer la note:", error);
        setSessionError("La position de la note n'a pas pu être enregistrée.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const toggleVote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleVoteService(sessionId, currentParticipantId, noteId, {
          maxVotes: MAX_STICKERS,
          validNoteIds: noteIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier le vote:", error);
        setSessionError("Le vote n'a pas pu être enregistré.");
        return { committed: false, votes: {} };
      }
    },
    [
      currentParticipantId,
      isEnabled,
      noteIdsSet,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const actions = useMemo(
    () => ({
      setStep1Description,
      addNote,
      updateNoteText,
      removeNote,
      addComment,
      updateCommentText,
      removeComment,
      setNotePosition,
      toggleVote,
    }),
    [
      addComment,
      addNote,
      removeComment,
      removeNote,
      setNotePosition,
      setStep1Description,
      toggleVote,
      updateCommentText,
      updateNoteText,
    ]
  );

  const effectiveSyncError =
    isEnabled && syncErrorSessionId === sessionId ? syncError : "";
  const effectiveIsLoading =
    isEnabled &&
    (!participantReady || (lastSnapshotSessionId !== sessionId && !effectiveSyncError));

  return {
    isEnabled,
    participantReady,
    isLoading: effectiveIsLoading,
    syncError: effectiveSyncError,
    participant,
    participants,
    getParticipantLabel,
    step1Description,
    notes,
    myNotes,
    commentsByNote,
    votesByParticipant,
    votesByNote,
    myVoteCount,
    remainingVotes,
    maxStickers: MAX_STICKERS,
    actions,
  };
}

/**
 * Default export alias for usePaperBrainCollaboration.
 *
 * @type {typeof usePaperBrainCollaboration}
 * @example
 * import { usePaperBrainCollaboration } from "./paper-brain/useCollaboration.js";
 *
 * // Real usage reference (named import): src/pages/workshops/WorkshopRunner.jsx
 * const collaboration = usePaperBrainCollaboration({ sessionId, session, workshopId });
 */
export default useCollaboration;
