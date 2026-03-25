/**
 * @module components/management/SubscriptionActionError
 * @description UI component module for SubscriptionActionError.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the SubscriptionActionError component.
 * @param {Object} props - Component props.
 * @param {*} props.message - message prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import SubscriptionActionError from "../components/management/SubscriptionActionError";
 *
 * // Real usage reference: src/pages/management/Abonnement.jsx
 * <SubscriptionActionError />;
 */
export default function SubscriptionActionError({ message }) {
  if (!message) return null;

  return (
    <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}
