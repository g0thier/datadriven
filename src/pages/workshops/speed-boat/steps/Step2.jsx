/**
 * @module workshops/speed-boat/steps/Step2
 * @description Speed Boat step 2 screen for defining the workshop objective.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import speedBoatIslandImg from "../../../../assets/workshops/speed-boat/speed-boat-island.png";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

/**
 * Renders Speed Boat step 2 (objective definition).
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.step - Step metadata (label, description, duration, etc.).
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 2 screen.
 */
export default function Step2({ sessionTitle, step, collaboration }) {
  const objective = collaboration?.step2Objective ?? "";
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const handleChange = (event) => {
    const nextObjective = event.target.value;
    if (isLoading || nextObjective === objective) return;

    collaboration?.actions?.setStep2Objective?.(nextObjective, objective);
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
        placeholder="Écrivez votre objectif ici..."
        disabled={isLoading}
        value={objective}
        onChange={handleChange}
      />

      <div className="mt-4 bg-white rounded-2xl shadow-md overflow-hidden">
        <img
          src={speedBoatIslandImg}
          alt="Destination Speed Boat"
          className="w-full h-auto object-contain"
        />
      </div>
    </WorkshopStepLayout>
  );
}
