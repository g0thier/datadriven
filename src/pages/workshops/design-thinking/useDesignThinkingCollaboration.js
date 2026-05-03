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
  createDesignThinkingSharedNote,
  removeDesignThinkingSharedNote,
  setDesignThinkingProblemStatement,
  setDesignThinkingStep1Description,
  subscribeDesignThinkingSession,
  updateDesignThinkingSharedNote,
  upsertDesignThinkingParticipant,
} from "../../../firebase/workshops/design-thinking.service";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

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
  const step1RestoreInFlightRef = useRef(false);
  const problemStatementRestoreInFlightRef = useRef(false);

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

  useEffect(() => {
    setLastNonEmptyStep1Description("");
    setLastNonEmptyProblemStatement("");
    step1RestoreInFlightRef.current = false;
    problemStatementRestoreInFlightRef.current = false;
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

    if (participant?.id) {
      addParticipant(participant.id, participant);
    }

    return Array.from(participantMap.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "fr")
    );
  }, [participant, remoteParticipants, sessionGuests, sharedNotes]);

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

  const actions = useMemo(
    () => ({
      setStep1Description,
      setProblemStatement,
      addSharedNote,
      updateSharedNoteText,
      removeSharedNote,
    }),
    [
      addSharedNote,
      removeSharedNote,
      setProblemStatement,
      setStep1Description,
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
    problemStatement,
    actions,
  };
}

export default useDesignThinkingCollaboration;
