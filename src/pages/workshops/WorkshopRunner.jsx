/**
 * @module workshops/WorkshopRunner
 * @description Route entry component that resolves, orchestrates, and renders workshop runtime screens.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getWorkshopSession } from "../../firebase";
import StepTime from "./StepTime.jsx";
import { useStepTimeline } from "./useStepTimeline.js";
import { getWorkshop } from "./index.js";
import WorkshopWaitingPage from "./WorkshopWaitingPage.jsx";
import RouteFallback from "../../components/fallback/RouteFallback.jsx";
import WorkshopSummaryPage from "./WorkshopSummaryPage.jsx";
import WorkshopVoiceOverlay from "../../components/workshop-audio/WorkshopVoiceOverlay.jsx";
import WorkshopSelector from "./WorkshopSelector.jsx";

/**
 * Renders the workshop runtime route page.
 * Resolves workshop/session data, handles waiting/finished states, and renders active steps.
 *
 * @returns {JSX.Element} The workshop runtime screen.
 *
 * @example
 * import { lazy } from "react";
 * const WorkshopRunner = lazy(() => import("./workshops/WorkshopRunner.jsx"));
 *
 * // Real usage reference: src/App.jsx
 * <Route path="/innovation/:workshopId/:id" element={<WorkshopRunner />} />;
 *
 * // Internal callsites in this component:
 * // - useStepTimeline(sessionData, startAt)
 * // - Workshop bridge selected by workshop id
 * // - <StepTime ... />, <WorkshopWaitingPage ... />, <WorkshopSummaryPage ... />
 */
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
  const isWorkshopActive = !isWaiting && !isFinished;

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
    <WorkshopSelector
      sessionId={sessionId}
      session={session}
      workshopId={resolvedWorkshopId}
    >
      {(collaboration) => (
        (() => {
          const requestedAudioChannel =
            currentStep?.audioChannel === "subgroup" ? "subgroup" : "general";
          const subgroupId = String(collaboration?.subgroupId || "").trim();
          const hasSubgroupAudioChannel = requestedAudioChannel !== "subgroup" || Boolean(subgroupId);
          const stepAudioEnabled = Boolean(currentStep?.audioEnabled) && hasSubgroupAudioChannel;
          const voiceChannelId =
            requestedAudioChannel === "subgroup" && subgroupId ? `subgroup-${subgroupId}` : "general";

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

              <WorkshopVoiceOverlay
                roomId={sessionId}
                channelId={voiceChannelId}
                workshopActive={isWorkshopActive}
                stepAudioEnabled={stepAudioEnabled}
                maxParticipants={8}
              />
            </div>
          );
        })()
      )}
    </WorkshopSelector>
  );
}
