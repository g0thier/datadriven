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
