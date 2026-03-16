import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getWorkshopSession } from "../firebase";
import StepTime from "./StepTime.jsx";
import { useStepTimeline } from "./useStepTimeline.js";
import { getWorkshop } from "./index.js";
import { usePaperBrainCollaboration } from "./paper-brain/usePaperBrainCollaboration.js";
import WorkshopWaitingPage from "./WorkshopWaitingPage.jsx";
import RouteFallback from "../components/fallback/RouteFallback.jsx";
import WorkshopSummaryPage from "./WorkshopSummaryPage.jsx";

export default function WorkshopRunner() {
  const { workshopId: routeWorkshopId, id: sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionLoadError, setSessionLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!sessionId) {
        setIsLoadingSession(false);
        return;
      }

      setIsLoadingSession(true);
      setSessionLoadError("");

      try {
        const nextSession = await getWorkshopSession(sessionId);
        if (cancelled) return;

        setSession(nextSession);

        if (!nextSession) {
          setSessionLoadError("Session introuvable ou expirée.");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de charger la session atelier:", error);
        setSession(null);
        setSessionLoadError("Impossible de charger la session.");
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const resolvedWorkshopId = session?.workshopId || routeWorkshopId;
  const sessionData = getWorkshop(resolvedWorkshopId);
  const collaboration = usePaperBrainCollaboration({
    sessionId,
    session,
    workshopId: resolvedWorkshopId,
  });

  const startAt = useMemo(() => {
    const sessionDate = session?.workshopDateTime ? new Date(session.workshopDateTime) : null;
    if (sessionDate && !Number.isNaN(sessionDate.getTime())) {
      return sessionDate;
    }
    return new Date();
  }, [session?.workshopDateTime]);

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isWaiting = startAt.getTime() > nowMs;
  const remainingMs = Math.max(0, startAt.getTime() - nowMs);

  const { currentStep, isFinished } = useStepTimeline(sessionData ?? { steps: [] }, startAt);

  const StepComponent = currentStep?.component ?? null;

  if (isLoadingSession) {
    // Chargement de la session…
    return (
      <>
        <RouteFallback /> 
      </>
    );
  }

  if (sessionLoadError) {
    return <div className="p-10">{sessionLoadError}</div>;
  }

  if (!sessionData) {
    return <div className="p-10">Atelier introuvable : {resolvedWorkshopId}</div>;
  }

  if (isWaiting) {
    return (
      <WorkshopWaitingPage
        sessionTitle={sessionData.title}
        startAt={startAt}
        remainingMs={remainingMs}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <StepTime sessionData={sessionData} startAt={startAt} />

      {isFinished ? (
        <WorkshopSummaryPage
          workshopId={resolvedWorkshopId}
          sessionTitle={sessionData.title}
          collaboration={collaboration}
        />
      ) : StepComponent && currentStep ? (
        <StepComponent
          sessionTitle={sessionData.title}
          step={currentStep}
          session={session}
          collaboration={collaboration}
        />
      ) : (
        <RouteFallback />
      )}
    </div>
  );
}
