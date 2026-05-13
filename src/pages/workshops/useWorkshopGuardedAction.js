import { useCallback } from "react";

export function useWorkshopGuardedAction({
  isEnabled,
  sessionId,
  participantReady,
  participantId,
  setSessionError,
}) {
  const runGuardedAction = useCallback(
    async ({
      execute,
      errorLog,
      errorMessage,
      fallback,
      requireParticipant = true,
      extraGuard,
    }) => {
      if (!isEnabled || !sessionId) return fallback;
      if (requireParticipant && (!participantReady || !participantId)) return fallback;
      if (typeof extraGuard === "function" && !extraGuard()) return fallback;

      try {
        return await execute();
      } catch (error) {
        if (errorLog) {
          console.error(errorLog, error);
        }
        if (errorMessage) {
          setSessionError?.(errorMessage);
        }
        return fallback;
      }
    },
    [isEnabled, participantId, participantReady, sessionId, setSessionError]
  );

  return {
    runGuardedAction,
  };
}

export default useWorkshopGuardedAction;
