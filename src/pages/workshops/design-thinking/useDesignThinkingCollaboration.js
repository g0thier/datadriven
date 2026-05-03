/**
 * @module workshops/design-thinking/useDesignThinkingCollaboration
 * @description Collaboration hook managing realtime Design Thinking workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../../firebase";
import {
  addDesignThinkingIdeationComment,
  createDesignThinkingIdeationNote,
  createDesignThinkingPrototypeFeedbackNote,
  createDesignThinkingSharedNote,
  removeDesignThinkingIdeationComment,
  removeDesignThinkingIdeationNote,
  removeDesignThinkingPrototypeFeedbackNote,
  removeDesignThinkingSharedNote,
  setDesignThinkingConclusion,
  setDesignThinkingIdeationNotePosition,
  setDesignThinkingProblemStatement,
  setDesignThinkingStep1Description,
  subscribeDesignThinkingSession,
  toggleDesignThinkingIdeationVote,
  updateDesignThinkingIdeationComment,
  updateDesignThinkingIdeationNote,
  updateDesignThinkingPrototypeFeedbackNote,
  updateDesignThinkingSharedNote,
  upsertDesignThinkingParticipant,
} from "../../../firebase/workshops/design-thinking.service";

const MAX_STICKERS = 3;
const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});
const PROTOTYPE_FEEDBACK_COLUMNS = Object.freeze([
  {
    id: "works",
    label: "Ce qui fonctionne",
    noteBgClass: "bg-green-100",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
  },
  {
    id: "problems",
    label: "Ce qui pose problème",
    noteBgClass: "bg-red-100",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
  },
  {
    id: "improvements",
    label: "Ce qui peut être amélioré",
    noteBgClass: "bg-blue-100",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
  },
]);
const PROTOTYPE_FEEDBACK_COLUMN_IDS_SET = new Set(
  PROTOTYPE_FEEDBACK_COLUMNS.map((column) => column.id)
);

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

const normalizePrototypeFeedbackColumnId = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return PROTOTYPE_FEEDBACK_COLUMN_IDS_SET.has(normalized) ? normalized : "";
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

/**
 * Provides realtime collaboration state and actions for Design Thinking sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Design Thinking behavior.
 * @returns {Object} Collaboration state (participant, step1, errors) and write actions.
 */
export function useDesignThinkingCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "design-thinking";

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [designThinkingState, setDesignThinkingState] = useState(null);
  const [lastSnapshotSessionId, setLastSnapshotSessionId] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncErrorSessionId, setSyncErrorSessionId] = useState("");
  const [lastNonEmptyStep1Description, setLastNonEmptyStep1Description] = useState("");
  const [lastNonEmptyProblemStatement, setLastNonEmptyProblemStatement] = useState("");
  const [lastNonEmptyConclusion, setLastNonEmptyConclusion] = useState("");
  const step1RestoreInFlightRef = useRef(false);
  const problemStatementRestoreInFlightRef = useRef(false);
  const conclusionRestoreInFlightRef = useRef(false);

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

    const unsubscribe = subscribeDesignThinkingSession(
      sessionId,
      (nextState) => {
        setDesignThinkingState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation Design Thinking:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activeDesignThinkingState =
    isEnabled && lastSnapshotSessionId === sessionId ? designThinkingState : null;
  const rawStep1Description = String(activeDesignThinkingState?.step1?.description || "");
  const rawProblemStatement = String(activeDesignThinkingState?.problemStatement?.text || "");
  const rawConclusion = String(activeDesignThinkingState?.conclusion?.text || "");

  useEffect(() => {
    setLastNonEmptyStep1Description("");
    setLastNonEmptyProblemStatement("");
    setLastNonEmptyConclusion("");
    step1RestoreInFlightRef.current = false;
    problemStatementRestoreInFlightRef.current = false;
    conclusionRestoreInFlightRef.current = false;
  }, [isEnabled, sessionId]);

  useEffect(() => {
    if (!rawStep1Description) return;

    setLastNonEmptyStep1Description((currentValue) =>
      currentValue === rawStep1Description ? currentValue : rawStep1Description
    );
  }, [rawStep1Description]);

  useEffect(() => {
    if (!rawProblemStatement) return;

    setLastNonEmptyProblemStatement((currentValue) =>
      currentValue === rawProblemStatement ? currentValue : rawProblemStatement
    );
  }, [rawProblemStatement]);

  useEffect(() => {
    if (!rawConclusion) return;

    setLastNonEmptyConclusion((currentValue) =>
      currentValue === rawConclusion ? currentValue : rawConclusion
    );
  }, [rawConclusion]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertDesignThinkingParticipant(sessionId, participant);
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
    activeDesignThinkingState?.participants &&
    typeof activeDesignThinkingState.participants === "object"
      ? activeDesignThinkingState.participants
      : EMPTY_OBJECT;
  const rawSharedNotes =
    activeDesignThinkingState?.sharedNotes &&
    typeof activeDesignThinkingState.sharedNotes === "object"
      ? activeDesignThinkingState.sharedNotes
      : EMPTY_OBJECT;
  const rawIdeationNotes =
    activeDesignThinkingState?.ideation?.notes &&
    typeof activeDesignThinkingState.ideation.notes === "object"
      ? activeDesignThinkingState.ideation.notes
      : EMPTY_OBJECT;
  const rawIdeationCommentsByNote =
    activeDesignThinkingState?.ideation?.commentsByNote &&
    typeof activeDesignThinkingState.ideation.commentsByNote === "object"
      ? activeDesignThinkingState.ideation.commentsByNote
      : EMPTY_OBJECT;
  const rawIdeationVotesByParticipant =
    activeDesignThinkingState?.ideation?.votesByParticipant &&
    typeof activeDesignThinkingState.ideation.votesByParticipant === "object"
      ? activeDesignThinkingState.ideation.votesByParticipant
      : EMPTY_OBJECT;
  const rawPrototypeFeedbackNotes =
    activeDesignThinkingState?.prototypeFeedback?.notes &&
    typeof activeDesignThinkingState.prototypeFeedback.notes === "object"
      ? activeDesignThinkingState.prototypeFeedback.notes
      : EMPTY_OBJECT;

  const sharedNotes = useMemo(() => {
    return Object.entries(rawSharedNotes)
      .map(([noteId, data]) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        createdAt: String(data?.createdAt || ""),
        updatedAt: String(data?.updatedAt || ""),
      }))
      .sort(sortByCreatedAt);
  }, [rawSharedNotes]);

  const sharedNotesById = useMemo(() => {
    return sharedNotes.reduce((accumulator, note) => {
      accumulator[note.id] = note;
      return accumulator;
    }, {});
  }, [sharedNotes]);

  const prototypeFeedbackNotes = useMemo(() => {
    return Object.entries(rawPrototypeFeedbackNotes)
      .map(([noteId, data]) => {
        const columnId = normalizePrototypeFeedbackColumnId(data?.columnId);
        if (!columnId) return null;

        return {
          id: String(data?.id || noteId),
          authorId: String(data?.authorId || ""),
          columnId,
          text: data?.text ?? "",
          createdAt: String(data?.createdAt || ""),
          updatedAt: String(data?.updatedAt || ""),
        };
      })
      .filter(Boolean)
      .sort(sortByCreatedAt);
  }, [rawPrototypeFeedbackNotes]);

  const prototypeFeedbackNotesById = useMemo(() => {
    return prototypeFeedbackNotes.reduce((accumulator, note) => {
      accumulator[note.id] = note;
      return accumulator;
    }, {});
  }, [prototypeFeedbackNotes]);

  const prototypeFeedbackNotesByColumn = useMemo(() => {
    const grouped = PROTOTYPE_FEEDBACK_COLUMNS.reduce((accumulator, column) => {
      accumulator[column.id] = [];
      return accumulator;
    }, {});

    prototypeFeedbackNotes.forEach((note) => {
      if (!grouped[note.columnId]) return;
      grouped[note.columnId].push(note);
    });

    return grouped;
  }, [prototypeFeedbackNotes]);

  const notes = useMemo(() => {
    return Object.entries(rawIdeationNotes)
      .map(([noteId, data], index) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        position: normalizePosition(data?.position, buildGridPosition(index)),
        createdAt: String(data?.createdAt || ""),
        updatedAt: String(data?.updatedAt || ""),
      }))
      .sort(sortByCreatedAt);
  }, [rawIdeationNotes]);

  const notesById = useMemo(() => {
    return notes.reduce((accumulator, note) => {
      accumulator[note.id] = note;
      return accumulator;
    }, {});
  }, [notes]);

  const commentsByNote = useMemo(() => {
    const normalizedComments = {};

    Object.entries(rawIdeationCommentsByNote).forEach(([noteId, comments]) => {
      if (!comments || typeof comments !== "object") return;

      normalizedComments[noteId] = Object.entries(comments)
        .map(([commentId, data]) => ({
          id: String(data?.id || commentId),
          authorId: String(data?.authorId || ""),
          text: data?.text ?? "",
          createdAt: String(data?.createdAt || ""),
          updatedAt: String(data?.updatedAt || ""),
        }))
        .sort(sortByCreatedAt);
    });

    return normalizedComments;
  }, [rawIdeationCommentsByNote]);

  const votesByParticipant = useMemo(() => {
    const normalizedVotes = {};

    Object.entries(rawIdeationVotesByParticipant).forEach(([participantId, votes]) => {
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
  }, [rawIdeationVotesByParticipant]);

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

    sharedNotes.forEach((note) => {
      addParticipant(note.authorId);
    });

    prototypeFeedbackNotes.forEach((note) => {
      addParticipant(note.authorId);
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
  }, [notes, participant, prototypeFeedbackNotes, remoteParticipants, sessionGuests, sharedNotes]);

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
  const problemStatement = rawProblemStatement || lastNonEmptyProblemStatement;
  const conclusion = rawConclusion || lastNonEmptyConclusion;
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

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
    if (rawStep1Description || !lastNonEmptyStep1Description) return;
    if (step1RestoreInFlightRef.current) return;

    let cancelled = false;
    step1RestoreInFlightRef.current = true;

    const restoreStep1Description = async () => {
      try {
        await setDesignThinkingStep1Description(
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

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
    if (rawProblemStatement || !lastNonEmptyProblemStatement) return;
    if (problemStatementRestoreInFlightRef.current) return;

    let cancelled = false;
    problemStatementRestoreInFlightRef.current = true;

    const restoreProblemStatement = async () => {
      try {
        await setDesignThinkingProblemStatement(
          sessionId,
          currentParticipantId,
          lastNonEmptyProblemStatement,
          { expectedPreviousStatement: "" }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer la problématique:", error);
      } finally {
        if (!cancelled) {
          problemStatementRestoreInFlightRef.current = false;
        }
      }
    };

    restoreProblemStatement();

    return () => {
      cancelled = true;
    };
  }, [
    currentParticipantId,
    isEnabled,
    lastNonEmptyProblemStatement,
    participantReady,
    rawProblemStatement,
    sessionId,
  ]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
    if (rawConclusion || !lastNonEmptyConclusion) return;
    if (conclusionRestoreInFlightRef.current) return;

    let cancelled = false;
    conclusionRestoreInFlightRef.current = true;

    const restoreConclusion = async () => {
      try {
        await setDesignThinkingConclusion(
          sessionId,
          currentParticipantId,
          lastNonEmptyConclusion,
          { expectedPreviousConclusion: "" }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer la conclusion:", error);
      } finally {
        if (!cancelled) {
          conclusionRestoreInFlightRef.current = false;
        }
      }
    };

    restoreConclusion();

    return () => {
      cancelled = true;
    };
  }, [
    currentParticipantId,
    isEnabled,
    lastNonEmptyConclusion,
    participantReady,
    rawConclusion,
    sessionId,
  ]);

  const setStep1Description = useCallback(
    async (description, previousDescription = step1Description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setDesignThinkingStep1Description(sessionId, currentParticipantId, description, {
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

  const setProblemStatement = useCallback(
    async (statement, previousStatement = problemStatement) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setDesignThinkingProblemStatement(sessionId, currentParticipantId, statement, {
          expectedPreviousStatement: previousStatement,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour la problématique:", error);
        setSessionError("La problématique n'a pas pu être enregistrée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      problemStatement,
      sessionId,
      setSessionError,
    ]
  );

  const setConclusion = useCallback(
    async (nextConclusion, previousConclusion = conclusion) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setDesignThinkingConclusion(
          sessionId,
          currentParticipantId,
          nextConclusion,
          {
            expectedPreviousConclusion: previousConclusion,
          }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la conclusion:", error);
        setSessionError("La conclusion n'a pas pu être enregistrée.");
      }
    },
    [
      conclusion,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const addSharedNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createDesignThinkingSharedNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter la contribution:", error);
        setSessionError("La contribution n'a pas pu être ajoutée.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateSharedNoteText = useCallback(
    async (noteId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = sharedNotesById[noteId];
      if (!note) return;

      const currentText = String(note.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateDesignThinkingSharedNote(
          sessionId,
          noteId,
          { text: nextText },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la contribution:", error);
        setSessionError("La contribution n'a pas pu être mise à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      sharedNotesById,
    ]
  );

  const removeSharedNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      if (!sharedNotesById[noteId]) return;

      try {
        await removeDesignThinkingSharedNote(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer la contribution:", error);
        setSessionError("La contribution n'a pas pu être supprimée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      sharedNotesById,
    ]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const fallbackPosition = buildGridPosition(notes.length);
      const position = normalizePosition(options?.position, fallbackPosition);
      const text = options?.text ?? "";

      try {
        return await createDesignThinkingIdeationNote(sessionId, {
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

  const addPrototypeFeedbackNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const columnId = normalizePrototypeFeedbackColumnId(options?.columnId);
      if (!columnId) return null;

      try {
        return await createDesignThinkingPrototypeFeedbackNote(sessionId, {
          authorId: currentParticipantId,
          columnId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le feedback prototype:", error);
        setSessionError("Le feedback prototype n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updatePrototypeFeedbackNoteText = useCallback(
    async (noteId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = prototypeFeedbackNotesById[noteId];
      if (!note) return;

      const currentText = String(note.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateDesignThinkingPrototypeFeedbackNote(
          sessionId,
          noteId,
          { text: nextText },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour le feedback prototype:", error);
        setSessionError("Le feedback prototype n'a pas pu être mis à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      prototypeFeedbackNotesById,
      sessionId,
      setSessionError,
    ]
  );

  const removePrototypeFeedbackNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      if (!prototypeFeedbackNotesById[noteId]) return;

      try {
        await removeDesignThinkingPrototypeFeedbackNote(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer le feedback prototype:", error);
        setSessionError("Le feedback prototype n'a pas pu être supprimé.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      prototypeFeedbackNotesById,
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
        await updateDesignThinkingIdeationNote(sessionId, noteId, { text });
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
        await removeDesignThinkingIdeationNote(sessionId, noteId);
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
        return await addDesignThinkingIdeationComment(sessionId, noteId, {
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
        await updateDesignThinkingIdeationComment(sessionId, noteId, commentId, { text });
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
        await removeDesignThinkingIdeationComment(sessionId, noteId, commentId);
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
        await setDesignThinkingIdeationNotePosition(sessionId, noteId, position);
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
        return await toggleDesignThinkingIdeationVote(sessionId, currentParticipantId, noteId, {
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
      setProblemStatement,
      setConclusion,
      addSharedNote,
      updateSharedNoteText,
      removeSharedNote,
      addPrototypeFeedbackNote,
      updatePrototypeFeedbackNoteText,
      removePrototypeFeedbackNote,
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
      addPrototypeFeedbackNote,
      addSharedNote,
      removeComment,
      removeNote,
      removePrototypeFeedbackNote,
      removeSharedNote,
      setConclusion,
      setNotePosition,
      setProblemStatement,
      setStep1Description,
      toggleVote,
      updateCommentText,
      updateNoteText,
      updatePrototypeFeedbackNoteText,
      updateSharedNoteText,
    ]
  );

  const effectiveSyncError = isEnabled && syncErrorSessionId === sessionId ? syncError : "";
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
    sharedNotes,
    prototypeFeedbackColumns: PROTOTYPE_FEEDBACK_COLUMNS,
    prototypeFeedbackNotes,
    prototypeFeedbackNotesByColumn,
    problemStatement,
    conclusion,
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

export default useDesignThinkingCollaboration;
