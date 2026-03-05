import { useMemo } from "react";
import { useParams } from "react-router-dom";
import StepTime from "./StepTime.jsx";
import { useStepTimeline } from "./useStepTimeline.js";
import { getWorkshop } from "./index.js";

export default function WorkshopRunner() {
  const { workshopId } = useParams();

  const sessionData = getWorkshop(workshopId);

  const startAt = useMemo(() => new Date(), []);
  const { currentIndex, currentStep, isFinished } = useStepTimeline(sessionData, startAt);

  const StepComponent = currentStep?.component ?? null;

  if (!sessionData) {
    return <div className="p-10">Atelier introuvable : {workshopId}</div>;
  }

  return (
    <div className="min-h-screen">
      <StepTime sessionData={sessionData} startAt={startAt} />

      {isFinished ? (
        <div className="pr-88 p-10">Atelier terminé</div>
      ) : StepComponent && currentStep ? (
        <StepComponent sessionTitle={sessionData.title} step={currentStep} />
      ) : (
        <div className="pr-88 p-10">Démarrage…</div>
      )}
    </div>
  );
}