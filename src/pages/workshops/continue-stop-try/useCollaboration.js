/**
 * @module workshops/continue-stop-try/useContinueStopTryCollaboration
 * @description Collaboration hook managing realtime Continue / Stop / Try workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../../firebase";
import {
  createContinueStopTryNote,
  removeContinueStopTryNote,
  setContinueStopTryNotePosition,
  setContinueStopTryStep1Description,
  setContinueStopTryStep5Placeholder,
  subscribeContinueStopTrySession,
  toggleContinueStopTryVote,
  updateContinueStopTryNote,
  upsertContinueStopTryParticipant,
} from "../../../firebase/workshops/continue-stop-try.service";

const COLUMN_CONFIG = [
  {
    id: "continue",
    label: "On continue",
    noteBgClass: "bg-green-100",
    noteMutedBgClass: "bg-green-50",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
    indicatorClass: "bg-green-500",
    indicatorSoftClass: "bg-green-200",
  },
  {
    id: "stop",
    label: "On arrête",
    noteBgClass: "bg-red-100",
    noteMutedBgClass: "bg-red-50",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
    indicatorClass: "bg-red-500",
    indicatorSoftClass: "bg-red-200",
  },
  {
    id: "try",
    label: "On tente",
    noteBgClass: "bg-blue-100",
    noteMutedBgClass: "bg-blue-50",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
    indicatorClass: "bg-blue-500",
    indicatorSoftClass: "bg-blue-200",
  },
];

const COLUMN_IDS = COLUMN_CONFIG.map((column) => column.id);
const COLUMN_IDS_SET = new Set(COLUMN_IDS);
const MAX_STICKERS_PER_COLUMN = 3;

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
  const col = index % 2;
  const row = Math.floor(index / 2);

  return {
    x: 24 + col * 220,
    y: 24 + row * 170,
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

const normalizeColumnId = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return COLUMN_IDS_SET.has(normalized) ? normalized : "";
};

const makeEmptyByColumn = (initialValueFactory) => {
  return COLUMN_IDS.reduce((accumulator, columnId) => {
    accumulator[columnId] = initialValueFactory(columnId);
    return accumulator;
  }, {});
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

/**
 * Provides realtime collaboration state and actions for Continue / Stop / Try sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Continue / Stop / Try behavior.
 * @returns {Object} Collaboration state and write actions.
 */
export function useCollaboration({ sessionId, session, workshopId }) {
  const isContinueStopTryWorkshop = workshopId === "continue-arrete-tente";
  const isEnabled = Boolean(sessionId) && isContinueStopTryWorkshop;

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [continueStopTryState, setContinueStopTryState] = useState(null);
  const [lastSnapshotSessionId, setLastSnapshotSessionId] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncErrorSessionId, setSyncErrorSessionId] = useState("");
  const [lastNonEmptyStep1Description, setLastNonEmptyStep1Description] = useState("");
  const step1RestoreInFlightRef = useRef(false);

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

    const unsubscribe = subscribeContinueStopTrySession(
      sessionId,
      (nextState) => {
        setContinueStopTryState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation On continue, arrête, tente:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activeContinueStopTryState =
    isEnabled && lastSnapshotSessionId === sessionId ? continueStopTryState : null;
  const rawStep1Description = String(activeContinueStopTryState?.step1?.description || "");

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

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertContinueStopTryParticipant(sessionId, participant);
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
    activeContinueStopTryState?.notes && typeof activeContinueStopTryState.notes === "object"
      ? activeContinueStopTryState.notes
      : EMPTY_OBJECT;

  const notes = useMemo(() => {
    return Object.entries(rawNotes)
      .map(([noteId, data], index) => {
        const columnId = normalizeColumnId(data?.columnId);
        if (!columnId) return null;

        return {
          id: String(data?.id || noteId),
          authorId: String(data?.authorId || ""),
          columnId,
          text: data?.text ?? "",
          position: normalizePosition(data?.position, buildGridPosition(index)),
          createdAt: data?.createdAt || "",
          updatedAt: data?.updatedAt || "",
        };
      })
      .filter(Boolean)
      .sort(sortByCreatedAt);
  }, [rawNotes]);

  const notesByColumn = useMemo(() => {
    const grouped = makeEmptyByColumn(() => []);

    notes.forEach((note) => {
      grouped[note.columnId].push(note);
    });

    return grouped;
  }, [notes]);

  const notesById = useMemo(
    () =>
      notes.reduce((accumulator, note) => {
        accumulator[note.id] = note;
        return accumulator;
      }, {}),
    [notes]
  );

  const noteIdsSet = useMemo(() => new Set(notes.map((note) => note.id)), [notes]);

  const noteColumnsById = useMemo(() => {
    return notes.reduce((accumulator, note) => {
      accumulator[note.id] = note.columnId;
      return accumulator;
    }, {});
  }, [notes]);

  const rawVotesByParticipant =
    activeContinueStopTryState?.votesByParticipant &&
    typeof activeContinueStopTryState.votesByParticipant === "object"
      ? activeContinueStopTryState.votesByParticipant
      : EMPTY_OBJECT;

  const votesByParticipant = useMemo(() => {
    const normalizedVotes = {};

    Object.entries(rawVotesByParticipant).forEach(([participantId, votes]) => {
      if (!votes || typeof votes !== "object") return;

      const cleanedVotes = Object.entries(votes).reduce((accumulator, [noteId, enabled]) => {
        if (!enabled) return accumulator;
        if (!noteIdsSet.has(noteId)) return accumulator;
        accumulator[noteId] = true;
        return accumulator;
      }, {});

      if (Object.keys(cleanedVotes).length > 0) {
        normalizedVotes[participantId] = cleanedVotes;
      }
    });

    return normalizedVotes;
  }, [noteIdsSet, rawVotesByParticipant]);

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

  const myVotes = useMemo(() => {
    const currentParticipantId = participant?.id || "";
    if (!currentParticipantId) return EMPTY_OBJECT;

    return votesByParticipant[currentParticipantId] || EMPTY_OBJECT;
  }, [participant?.id, votesByParticipant]);

  const myVoteCountByColumn = useMemo(() => {
    const countByColumn = makeEmptyByColumn(() => 0);

    Object.keys(myVotes).forEach((noteId) => {
      const columnId = noteColumnsById[noteId];
      if (!COLUMN_IDS_SET.has(columnId)) return;
      countByColumn[columnId] += 1;
    });

    return countByColumn;
  }, [myVotes, noteColumnsById]);

  const remainingVotesByColumn = useMemo(() => {
    return makeEmptyByColumn((columnId) =>
      Math.max(0, MAX_STICKERS_PER_COLUMN - (myVoteCountByColumn[columnId] || 0))
    );
  }, [myVoteCountByColumn]);

  const rankedNotesByColumn = useMemo(() => {
    return makeEmptyByColumn((columnId) => {
      const notesForColumn = notesByColumn[columnId] || EMPTY_ARRAY;

      return notesForColumn
        .map((note) => {
          const stickerSet = votesByNote[note.id];
          const stickerCount = stickerSet instanceof Set ? stickerSet.size : 0;
          return {
            ...note,
            stickerCount,
          };
        })
        .filter((note) => note.stickerCount > 0)
        .sort((a, b) => {
          if (b.stickerCount !== a.stickerCount) {
            return b.stickerCount - a.stickerCount;
          }

          if (a.createdAt !== b.createdAt) {
            return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
          }

          return String(a.id || "").localeCompare(String(b.id || ""));
        });
    });
  }, [notesByColumn, votesByNote]);

  const rawStep5Placeholders =
    activeContinueStopTryState?.step5Placeholders &&
    typeof activeContinueStopTryState.step5Placeholders === "object"
      ? activeContinueStopTryState.step5Placeholders
      : EMPTY_OBJECT;

  const step5PlaceholdersByColumn = useMemo(() => {
    return makeEmptyByColumn((columnId) => String(rawStep5Placeholders?.[columnId]?.text || ""));
  }, [rawStep5Placeholders]);

  const remoteParticipants =
    activeContinueStopTryState?.participants &&
    typeof activeContinueStopTryState.participants === "object"
      ? activeContinueStopTryState.participants
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

      return participantById[participantId]?.name || makeParticipantFallbackLabel(participantId);
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
        await setContinueStopTryStep1Description(
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

  const myNotesByColumn = useMemo(() => {
    const grouped = makeEmptyByColumn(() => []);

    myNotes.forEach((note) => {
      grouped[note.columnId].push(note);
    });

    return grouped;
  }, [myNotes]);
  const setStep1Description = useCallback(
    async (description, previousDescription = step1Description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setContinueStopTryStep1Description(sessionId, currentParticipantId, description, {
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

  const setStep5Placeholder = useCallback(
    async (columnId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      const normalizedColumnId = normalizeColumnId(columnId);
      if (!normalizedColumnId) return;

      try {
        await setContinueStopTryStep5Placeholder(
          sessionId,
          currentParticipantId,
          normalizedColumnId,
          text
        );
      } catch (error) {
        console.error("Impossible de mettre à jour le placeholder:", error);
        setSessionError("Le texte d'engagement n'a pas pu être enregistré.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const columnId = normalizeColumnId(options?.columnId);
      if (!columnId) return null;

      const fallbackPosition = buildGridPosition((notesByColumn[columnId] || EMPTY_ARRAY).length);
      const position = normalizePosition(options?.position, fallbackPosition);
      const text = options?.text ?? "";

      try {
        return await createContinueStopTryNote(sessionId, {
          authorId: currentParticipantId,
          columnId,
          text,
          position,
        });
      } catch (error) {
        console.error("Impossible d'ajouter la note:", error);
        setSessionError("La note n'a pas pu être ajoutée.");
        return null;
      }
    },
    [
      currentParticipantId,
      isEnabled,
      notesByColumn,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const updateNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = notesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await updateContinueStopTryNote(sessionId, noteId, { text });
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
        await removeContinueStopTryNote(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer la note:", error);
        setSessionError("La note n'a pas pu être supprimée.");
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
  );

  const setNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setContinueStopTryNotePosition(sessionId, noteId, position);
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
        return await toggleContinueStopTryVote(sessionId, currentParticipantId, noteId, {
          maxVotesPerColumn: MAX_STICKERS_PER_COLUMN,
          validNoteIds: noteIdsSet,
          noteColumnsById,
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
      noteColumnsById,
      noteIdsSet,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const actions = useMemo(
    () => ({
      setStep1Description,
      setStep5Placeholder,
      addNote,
      updateNoteText,
      removeNote,
      setNotePosition,
      toggleVote,
    }),
    [
      addNote,
      removeNote,
      setNotePosition,
      setStep1Description,
      setStep5Placeholder,
      toggleVote,
      updateNoteText,
    ]
  );

  const effectiveSyncError = isEnabled && syncErrorSessionId === sessionId ? syncError : "";
  const effectiveIsLoading =
    isEnabled && (!participantReady || (lastSnapshotSessionId !== sessionId && !effectiveSyncError));

  const myVoteCount = Object.values(myVoteCountByColumn).reduce((sum, count) => sum + count, 0);
  const remainingVotes = Object.values(remainingVotesByColumn).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    isEnabled,
    participantReady,
    isLoading: effectiveIsLoading,
    syncError: effectiveSyncError,
    participant,
    participants,
    getParticipantLabel,
    columns: COLUMN_CONFIG,
    step1Description,
    step5PlaceholdersByColumn,
    notes,
    notesByColumn,
    rankedNotesByColumn,
    myNotes,
    myNotesByColumn,
    votesByParticipant,
    votesByNote,
    myVoteCount,
    myVoteCountByColumn,
    remainingVotes,
    remainingVotesByColumn,
    maxStickers: MAX_STICKERS_PER_COLUMN,
    actions,
  };
}

/**
 * Default export alias for useContinueStopTryCollaboration.
 *
 * @type {typeof useContinueStopTryCollaboration}
 */
export default useCollaboration;
