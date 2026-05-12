/**
 * @module components/workshops/WorkshopStep1ChallengeInput
 * @description Shared Step 1 challenge input screen for workshop pages.
 */

import WorkshopStepLayout from "../../pages/workshops/WorkshopStepLayout.jsx";
import WorkshopSyncErrorAlert from "./WorkshopSyncErrorAlert.jsx";

export default function WorkshopStep1ChallengeInput({
  sessionTitle,
  step,
  value,
  isLoading = false,
  syncError = "",
  onChange,
  footer = null,
}) {
  const normalizedValue = value ?? "";

  const handleChange = (event) => {
    const nextValue = event.target.value;
    if (isLoading || nextValue === normalizedValue) return;

    onChange?.(nextValue, normalizedValue);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <textarea
        className="w-full h-40 p-4 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Écrivez ici..."
        disabled={isLoading}
        value={normalizedValue}
        onChange={handleChange}
      />

      {footer}
    </WorkshopStepLayout>
  );
}
