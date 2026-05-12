/**
 * @module workshops/speed-boat/steps/Step1
 * @description Speed Boat step 1 screen for defining the workshop challenge.
 */

import speedBoatBoatImg from "../../../../assets/workshops/speed-boat/speed-boat-boat.png";
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
      footer={
        <div className="mt-4 bg-white rounded-2xl shadow-md overflow-hidden">
          <img
            src={speedBoatBoatImg}
            alt="Support visuel Speed Boat"
            className="w-full h-auto object-contain"
          />
        </div>
      }
    />
  );
}
