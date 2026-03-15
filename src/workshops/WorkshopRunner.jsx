import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getWorkshopSession } from "../firebase";
import StepTime from "./StepTime.jsx";
import { useStepTimeline } from "./useStepTimeline.js";
import { getWorkshop } from "./index.js";
import { usePaperBrainCollaboration } from "./paper-brain/usePaperBrainCollaboration.js";

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

  const { currentStep, isFinished } = useStepTimeline(sessionData ?? { steps: [] }, startAt);

  const StepComponent = currentStep?.component ?? null;

  if (isLoadingSession) {
    return <div className="p-10">Chargement de la session…</div>;
  }

  if (sessionLoadError) {
    return <div className="p-10">{sessionLoadError}</div>;
  }

  if (!sessionData) {
    return <div className="p-10">Atelier introuvable : {resolvedWorkshopId}</div>;
  }

  return (
    <div className="min-h-screen">
      <StepTime sessionData={sessionData} startAt={startAt} />

      {isFinished ? (
        <div className="pr-88 p-10">Atelier terminé</div>
      ) : StepComponent && currentStep ? (
        <StepComponent
          sessionTitle={sessionData.title}
          step={currentStep}
          session={session}
          collaboration={collaboration}
        />
      ) : (
        <div className="pr-88 p-10">Démarrage…</div>
      )}
    </div>
  );
}
