import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addPaperBrainComment,
  auth,
  createPaperBrainNote,
  onAuthStateChangedListener,
  removePaperBrainComment,
  removePaperBrainNote,
  setPaperBrainNotePosition,
  setPaperBrainStep1Description,
  subscribePaperBrainSession,
  togglePaperBrainVote,
  updatePaperBrainComment,
  updatePaperBrainNote,
  upsertPaperBrainParticipant,
} from "../../firebase";

const MAX_STICKERS = 3;

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

const sortByCreatedAt = (a, b) => {
  const createdA = a?.createdAt || "";
  const createdB = b?.createdAt || "";

  if (createdA !== createdB) {
    return createdA.localeCompare(createdB);
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

const buildGridPosition = (index = 0) => {
  const col = index % 5;
  const row = Math.floor(index / 5);

  return {
    x: 40 + col * 290,
    y: 40 + row * 220,
  };
};

const normalizePosition = (position = {}, fallback = buildGridPosition(0)) => {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
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
    const guestId = String(guest.id || "").trim();
    const guestEmail = String(guest.email || "").trim().toLowerCase();

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

export function usePaperBrainCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "paper-brain";

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [paperBrainState, setPaperBrainState] = useState(null);
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

    const unsubscribe = subscribePaperBrainSession(
      sessionId,
      (nextState) => {
        setPaperBrainState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation Paper Brain:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activePaperBrainState =
    isEnabled && lastSnapshotSessionId === sessionId ? paperBrainState : null;

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertPaperBrainParticipant(sessionId, participant);
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

  const rawNotes =
    activePaperBrainState?.notes && typeof activePaperBrainState.notes === "object"
      ? activePaperBrainState.notes
      : EMPTY_OBJECT;

  const notes = useMemo(() => {
    return Object.entries(rawNotes)
      .map(([noteId, data], index) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        position: normalizePosition(data?.position, buildGridPosition(index)),
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
    activePaperBrainState?.commentsByNote &&
    typeof activePaperBrainState.commentsByNote === "object"
      ? activePaperBrainState.commentsByNote
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
    activePaperBrainState?.votesByParticipant &&
    typeof activePaperBrainState.votesByParticipant === "object"
      ? activePaperBrainState.votesByParticipant
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
    activePaperBrainState?.participants &&
    typeof activePaperBrainState.participants === "object"
      ? activePaperBrainState.participants
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
    async (description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setPaperBrainStep1Description(sessionId, currentParticipantId, description);
      } catch (error) {
        console.error("Impossible de mettre à jour la description:", error);
        setSessionError("La description n'a pas pu être enregistrée.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const fallbackPosition = buildGridPosition(notes.length);
      const position = normalizePosition(options?.position, fallbackPosition);
      const text = options?.text ?? "";

      try {
        return await createPaperBrainNote(sessionId, {
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
        await updatePaperBrainNote(sessionId, noteId, { text });
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
        await removePaperBrainNote(sessionId, noteId);
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
        return await addPaperBrainComment(sessionId, noteId, {
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
        await updatePaperBrainComment(sessionId, noteId, commentId, { text });
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
        await removePaperBrainComment(sessionId, noteId, commentId);
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
        await setPaperBrainNotePosition(sessionId, noteId, position);
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
        return await togglePaperBrainVote(sessionId, currentParticipantId, noteId, {
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

  const step1Description = String(activePaperBrainState?.step1?.description || "");
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

export default usePaperBrainCollaboration;
