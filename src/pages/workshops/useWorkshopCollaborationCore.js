import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../firebase";
import { EMPTY_ARRAY, resolveParticipantIdentity } from "./collaboration.shared.js";

const DEFAULT_SYNC_ERROR_MESSAGE = "Impossible de se synchroniser avec le serveur.";
const DEFAULT_PARTICIPANT_ERROR_MESSAGE = "Impossible d'enregistrer le participant.";

export function useWorkshopCollaborationCore({
  sessionId,
  session,
  isEnabled,
  subscribeSession,
  upsertParticipant,
  syncErrorMessage = DEFAULT_SYNC_ERROR_MESSAGE,
  participantErrorMessage = DEFAULT_PARTICIPANT_ERROR_MESSAGE,
  participantOverride,
  canSyncParticipant,
}) {
  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [state, setState] = useState(null);
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

  const resolvedParticipant = useMemo(
    () => (isAuthResolved ? resolveParticipantIdentity({ sessionGuests, authUser }) : null),
    [authUser, isAuthResolved, sessionGuests]
  );

  const participant = useMemo(() => {
    if (participantOverride === undefined) {
      return resolvedParticipant;
    }

    return participantOverride || null;
  }, [participantOverride, resolvedParticipant]);

  const participantReady = Boolean(isEnabled && isAuthResolved && participant?.id);

  const setSessionError = useCallback(
    (message) => {
      setSyncError(message);
      setSyncErrorSessionId(sessionId || "");
    },
    [sessionId]
  );

  useEffect(() => {
    if (!isEnabled || !sessionId || typeof subscribeSession !== "function") return () => {};

    const unsubscribe = subscribeSession(
      sessionId,
      (nextState) => {
        setState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation atelier:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError(syncErrorMessage);
      }
    );

    return typeof unsubscribe === "function" ? unsubscribe : () => {};
  }, [isEnabled, sessionId, setSessionError, subscribeSession, syncErrorMessage]);

  const activeState = isEnabled && lastSnapshotSessionId === sessionId ? state : null;

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || typeof upsertParticipant !== "function") {
      return () => {};
    }

    if (
      typeof canSyncParticipant === "function" &&
      !canSyncParticipant({ isEnabled, sessionId, participant, participantReady })
    ) {
      return () => {};
    }

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertParticipant(sessionId, participant);
      } catch (error) {
        if (isCancelled) return;
        console.error(participantErrorMessage, error);
      }
    };

    syncParticipant();
    const intervalId = setInterval(syncParticipant, 30_000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [
    canSyncParticipant,
    isEnabled,
    participant,
    participantErrorMessage,
    participantReady,
    sessionId,
    upsertParticipant,
  ]);

  return {
    authUser,
    isAuthResolved,
    sessionGuests,
    participant,
    participantReady,
    syncError,
    syncErrorSessionId,
    setSessionError,
    activeState,
    lastSnapshotSessionId,
  };
}
