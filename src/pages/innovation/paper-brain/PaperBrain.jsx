import { useMemo } from "react";
import StepTime from "../../../components/StepTime.jsx";
import { data } from "../../../components/StepTimeData.jsx";
import { useStepTimeline } from "../../../hooks/useStepTimeline.js";

import Step1 from "./Step1.jsx";
import Step2 from "./Step2.jsx";
import Step3 from "./Step3.jsx";
import Step4 from "./Step4.jsx";
import Step5 from "./Step5.jsx";

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5];

export default function PaperBrain() {
  const startAt = useMemo(() => new Date(), []);
  const { currentIndex, currentStep, isFinished } = useStepTimeline(data, startAt);

  const StepComponent = currentIndex >= 0 ? STEP_COMPONENTS[currentIndex] : null;

  return (
    <div className="min-h-screen">
      <StepTime sessionData={data} startAt={startAt} />

      {isFinished ? (
        <div className="pr-88 p-10">Atelier terminé</div>
      ) : StepComponent && currentStep ? (
        <StepComponent sessionTitle={data.title} step={currentStep} />
      ) : (
        <div className="pr-88 p-10">Démarrage…</div>
      )}
    </div>
  );
}