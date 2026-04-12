/**
 * @module workshops/continue-stop-try/steps/Step1
 * @description Continue Stop Try step 1 screen for defining the retrospective scope.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

/**
 * Renders Continue Stop Try step 1 (retrospective framing).
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
    collaboration?.actions?.setStep1Description?.(event.target.value);
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
        className="w-full h-40 p-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Écrivez votre description ici..."
        disabled={isLoading}
        value={description}
        onChange={handleChange}
      />
    </WorkshopStepLayout>
  );
}
