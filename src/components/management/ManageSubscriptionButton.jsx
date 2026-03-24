export default function ManageSubscriptionButton({
  onClick,
  isLoading = false,
  isDisabled = false,
  leftContent = null,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      {leftContent ? <div className="min-w-[280px] flex-1">{leftContent}</div> : null}

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
    </div>
  );
}
