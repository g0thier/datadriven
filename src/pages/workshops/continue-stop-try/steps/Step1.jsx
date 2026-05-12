/**
 * @module workshops/continue-stop-try/steps/Step1
 * @description Continue Stop Try step 1 screen for defining the retrospective scope.
 */

import WorkshopStep1ChallengeInput from "../../../../components/workshops/WorkshopStep1ChallengeInput.jsx";

export default function Step1({ sessionTitle, step, collaboration }) {
  const description = collaboration?.step1Description ?? "";
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  return (
    <WorkshopStep1ChallengeInput
      sessionTitle={sessionTitle}
      step={step}
      value={description}
      isLoading={isLoading}
      syncError={syncError}
      onChange={(nextDescription, previousDescription) => {
        collaboration?.actions?.setStep1Description?.(nextDescription, previousDescription);
      }}
    />
  );
}
