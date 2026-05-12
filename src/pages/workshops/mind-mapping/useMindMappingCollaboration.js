import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../../firebase";
import {
  addMindMappingConcept,
  addMindMappingComment,
  createMindMappingNote,
  removeMindMappingConcept,
  removeMindMappingComment,
  removeMindMappingNote,
  setReformulation as setMindMappingReformulation,
  setMindMappingStep1Description,
  subscribeMindMappingSession,
  toggleMindMappingConceptVote,
  updateMindMappingConcept,
  updateMindMappingComment,
  updateMindMappingNote,
  upsertMindMappingParticipant,
} from "../../../firebase/workshops/mind-mapping.service";

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);
const MAX_STICKERS = 3;

const sortByCreatedAt = (a, b) => {
  const createdA = a?.createdAt || "";
  const createdB = b?.createdAt || "";

  if (createdA !== createdB) {
    return createdA.localeCompare(createdB);
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

const resolveGuestName = (guest = {}) => {
  const firstName = String(guest?.firstName || "").trim();
  const lastName = String(guest?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    String(guest?.name || "").trim() ||
    String(guest?.label || "").trim() ||
    String(guest?.email || "").trim() ||
    ""
  );
};

const makeParticipantFallbackLabel = (participantId) => {
  const id = String(participantId || "");
  const suffix = id.slice(-4).toUpperCase();
  return suffix ? `Participant ${suffix}` : "Participant";
};

const resolveParticipantIdentity = ({ sessionGuests, authUser }) => {
  const authUid = String(authUser?.uid || "").trim();
  if (!authUid) return null;

  const authEmail = String(authUser?.email || "").trim();
  const authDisplayName = String(authUser?.displayName || "").trim();

  const matchingGuest = sessionGuests.find((guest) => {
    if (!guest) return false;

    const guestId = String(guest?.id || "").trim();
    const guestEmail = String(guest?.email || "").trim().toLowerCase();

    if (guestId && guestId === authUid) return true;
    if (authEmail && guestEmail && guestEmail === authEmail.toLowerCase()) return true;
    return false;
  });

  return {
    id: authUid,
    name:
      resolveGuestName(matchingGuest) ||
      authDisplayName ||
      authEmail ||
      makeParticipantFallbackLabel(authUid),
    email: authEmail,
    isAuthenticated: true,
  };
};

export function useMindMappingCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "mind-mapping";

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [mindMappingState, setMindMappingState] = useState(null);
  const [lastSnapshotSessionId, setLastSnapshotSessionId] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncErrorSessionId, setSyncErrorSessionId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((nextAuthUser) => {
      setAuthUser(nextAuthUser);
      setIsAuthResolved(true);
    });

    return unsubscribe;
  }, []);

  const sessionGuests = useMemo(
    () => (Array.isArray(session?.allGuests) ? session.allGuests : EMPTY_ARRAY),
    [session?.allGuests]
  );

  const participant = useMemo(
    () => (isAuthResolved ? resolveParticipantIdentity({ sessionGuests, authUser }) : null),
    [authUser, isAuthResolved, sessionGuests]
  );
  const participantReady = Boolean(isEnabled && isAuthResolved && participant?.id);

  const setSessionError = useCallback(
    (message) => {
      setSyncError(message);
      setSyncErrorSessionId(sessionId || "");
    },
    [sessionId]
  );

  useEffect(() => {
    if (!isEnabled || !sessionId) return () => {};

    const unsubscribe = subscribeMindMappingSession(
      sessionId,
      (nextState) => {
        setMindMappingState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation Mind Mapping:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activeMindMappingState =
    isEnabled && lastSnapshotSessionId === sessionId ? mindMappingState : null;
  const rawStep1Description = String(activeMindMappingState?.step1?.description || "");

  const rawNotes =
    activeMindMappingState?.notes && typeof activeMindMappingState.notes === "object"
      ? activeMindMappingState.notes
      : EMPTY_OBJECT;

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

  const notesById = useMemo(
    () =>
      notes.reduce((accumulator, note) => {
        accumulator[note.id] = note;
        return accumulator;
      }, {}),
    [notes]
  );

  const rawCommentsByNote =
    activeMindMappingState?.commentsByNote &&
    typeof activeMindMappingState.commentsByNote === "object"
      ? activeMindMappingState.commentsByNote
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

  const rawConcepts =
    activeMindMappingState?.concepts && typeof activeMindMappingState.concepts === "object"
      ? activeMindMappingState.concepts
      : EMPTY_OBJECT;

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

  const conceptsById = useMemo(
    () =>
      concepts.reduce((accumulator, concept) => {
        accumulator[concept.id] = concept;
        return accumulator;
      }, {}),
    [concepts]
  );
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

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertMindMappingParticipant(sessionId, participant);
      } catch (error) {
        if (isCancelled) return;
        console.error("Impossible d'enregistrer le participant:", error);
      }
    };

    syncParticipant();
    const intervalId = setInterval(syncParticipant, 30_000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isEnabled, participant, participantReady, sessionId]);

  const remoteParticipants =
    activeMindMappingState?.participants && typeof activeMindMappingState.participants === "object"
      ? activeMindMappingState.participants
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
      String(a.name || "").localeCompare(String(b.name || ""), "fr")
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
      return participantById[participantId]?.name || makeParticipantFallbackLabel(participantId);
    },
    [participantById]
  );

  const currentParticipantId = participant?.id || "";
  const step1Description = rawStep1Description;
  const rawVotesByParticipant =
    activeMindMappingState?.votesByParticipant &&
    typeof activeMindMappingState.votesByParticipant === "object"
      ? activeMindMappingState.votesByParticipant
      : EMPTY_OBJECT;

  const votesByParticipant = useMemo(() => {
    const normalizedVotes = {};

    Object.entries(rawVotesByParticipant).forEach(([participantId, votes]) => {
      if (!votes || typeof votes !== "object") return;

      const voteMap = {};

      Object.entries(votes).forEach(([conceptId, enabled]) => {
        if (!enabled) return;
        if (!conceptIdsSet.has(conceptId)) return;
        voteMap[conceptId] = true;
      });

      if (Object.keys(voteMap).length > 0) {
        normalizedVotes[participantId] = voteMap;
      }
    });

    return normalizedVotes;
  }, [conceptIdsSet, rawVotesByParticipant]);

  const votesByConcept = useMemo(() => {
    const groupedVotes = {};
    concepts.forEach((concept) => {
      groupedVotes[concept.id] = new Set();
    });

    Object.entries(votesByParticipant).forEach(([participantId, votes]) => {
      Object.entries(votes).forEach(([conceptId, enabled]) => {
        if (!enabled) return;
        if (!groupedVotes[conceptId]) return;
        groupedVotes[conceptId].add(participantId);
      });
    });

    return groupedVotes;
  }, [concepts, votesByParticipant]);
  const rawReformulationsByConcept =
    activeMindMappingState?.reformulationsByConcept &&
    typeof activeMindMappingState.reformulationsByConcept === "object"
      ? activeMindMappingState.reformulationsByConcept
      : EMPTY_OBJECT;

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
  const myVoteCount = useMemo(() => {
    return Object.entries(myVotes).reduce((count, [conceptId, enabled]) => {
      if (!enabled) return count;
      if (!conceptIdsSet.has(conceptId)) return count;
      return count + 1;
    }, 0);
  }, [conceptIdsSet, myVotes]);

  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

  const setStep1Description = useCallback(
    async (description, previousDescription = step1Description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setMindMappingStep1Description(sessionId, currentParticipantId, description, {
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
      setSessionError,
      step1Description,
    ]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const text = options?.text ?? "";

      try {
        return await createMindMappingNote(sessionId, {
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
        await updateMindMappingNote(sessionId, noteId, { text });
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
        await removeMindMappingNote(sessionId, noteId);
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
        return await addMindMappingComment(sessionId, noteId, {
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
        await updateMindMappingComment(sessionId, noteId, commentId, { text });
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
        await removeMindMappingComment(sessionId, noteId, commentId);
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
        return await addMindMappingConcept(sessionId, {
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
        await updateMindMappingConcept(sessionId, conceptId, { text });
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
        await removeMindMappingConcept(sessionId, conceptId);
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
        return await toggleMindMappingConceptVote(sessionId, currentParticipantId, conceptId, {
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
      setStep1Description,
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
      setStep1Description,
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
    step1Description,
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

export default useMindMappingCollaboration;
