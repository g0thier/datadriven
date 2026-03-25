/**
 * @module components/management/SubscriptionStatusMessage
 * @description UI component module for SubscriptionStatusMessage.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the SubscriptionStatusMessage component.
 * @param {Object} props - Component props.
 * @param {*} props.statusMessage - statusMessage prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import SubscriptionStatusMessage from "../components/management/SubscriptionStatusMessage";
 *
 * // Real usage reference: src/pages/management/Abonnement.jsx
 * <SubscriptionStatusMessage />;
 */
export default function SubscriptionStatusMessage({ statusMessage }) {
  if (!statusMessage) return null;

  return (
    <div
      className={[
        "mb-6 rounded-xl border px-4 py-3",
        statusMessage.variant === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
      ].join(" ")}
    >
      <p className="text-sm font-semibold">{statusMessage.title}</p>
      <p className="mt-1 text-sm">{statusMessage.message}</p>
    </div>
  );
}
