/**
 * @module components/workshop-invitation/SendInvitesButton
 * @description UI component module for SendInvitesButton.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the SendInvitesButton component.
 * @param {Object} props - Component props.
 * @param {*} props.canSend - canSend prop.
 * @param {*} props.onClick - onClick prop.
 * @param {boolean} [props.isSending=false] - isSending prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import SendInvitesButton from "../components/workshop-invitation/SendInvitesButton";
 *
 * // Real usage reference: src/pages/innovation/WorkshopInvitation.jsx
 * <SendInvitesButton />;
 */
function SendInvitesButton({ canSend, onClick, isSending = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canSend || isSending}
      className={[
        "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold",
        "transition shadow-sm",
        canSend && !isSending
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "bg-slate-200 text-slate-500 cursor-not-allowed",
      ].join(" ")}
    >
      {isSending ? "Envoi en cours..." : "Envoyer les invitations"}
    </button>
  );
}

export default SendInvitesButton;
