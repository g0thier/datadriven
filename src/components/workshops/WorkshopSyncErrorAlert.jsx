/**
 * @module components/workshops/WorkshopSyncErrorAlert
 * @description Shared sync error alert for workshop screens.
 */

export default function WorkshopSyncErrorAlert({ message, className = "mb-3" }) {
  const normalizedMessage = String(message || "").trim();
  if (!normalizedMessage) return null;

  const mergedClassName = [className, "text-sm text-red-600"].filter(Boolean).join(" ");

  return (
    <p className={mergedClassName} role="alert">
      {normalizedMessage}
    </p>
  );
}
