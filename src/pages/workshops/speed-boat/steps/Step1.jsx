/**
 * @module workshops/speed-boat/steps/Step1
 * @description Speed Boat step 1 screen for defining the workshop challenge.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import speedBoatBoatImg from "../../../../assets/workshops/speed-boat/speed-boat-boat.png";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

/**
 * Renders Speed Boat step 1 (challenge definition).
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.step - Step metadata (label, description, duration, etc.).
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 1 screen.
 */
export default function Step1({ sessionTitle, step, collaboration }) {
  const description = collaboration?.step1Description ?? "";
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const handleChange = (event) => {
    const nextDescription = event.target.value;
    if (isLoading || nextDescription === description) return;

    collaboration?.actions?.setStep1Description?.(nextDescription, description);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <textarea
        className="w-full h-40 p-4 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Écrivez votre défi ici..."
        disabled={isLoading}
        value={description}
        onChange={handleChange}
      />

      <div className="mt-4 bg-white rounded-2xl shadow-md overflow-hidden">
        <img
          src={speedBoatBoatImg}
          alt="Support visuel Speed Boat"
          className="w-full h-auto object-contain"
        />
      </div>
    </WorkshopStepLayout>
  );
}
