/**
 * @module components/management/ManageSubscriptionButton
 * @description UI component module for ManageSubscriptionButton.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the ManageSubscriptionButton component.
 * @param {Object} props - Component props.
 * @param {*} props.onClick - onClick prop.
 * @param {boolean} [props.isLoading=false] - isLoading prop.
 * @param {boolean} [props.isDisabled=false] - isDisabled prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import ManageSubscriptionButton from "../components/management/ManageSubscriptionButton";
 *
 * // Real usage reference: src/pages/management/Abonnement.jsx
 * <ManageSubscriptionButton />;
 */
export default function ManageSubscriptionButton({
  onClick,
  isLoading = false,
  isDisabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || isDisabled}
      className={[
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
        isLoading || isDisabled
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : "bg-slate-800 text-white hover:bg-slate-900",
      ].join(" ")}
    >
      {isLoading ? "Redirection..." : "Gérer mon abonnement"}
    </button>
  );
}
