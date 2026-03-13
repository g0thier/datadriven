import MaterialIcon from "../MaterialIcon";

const ICON_BY_VARIANT = {
  success: "check_circle",
  warning: "brightness_alert",
};

const ICON_COLOR_BY_VARIANT = {
  success: "text-emerald-600",
  warning: "text-amber-500",
};

function InviteSendResultModal({ isOpen, variant, title, lines = [], onConfirm }) {
  if (!isOpen) return null;

  const iconName = ICON_BY_VARIANT[variant] ?? ICON_BY_VARIANT.warning;
  const iconColor = ICON_COLOR_BY_VARIANT[variant] ?? ICON_COLOR_BY_VARIANT.warning;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <MaterialIcon name={iconName} size={38} className={iconColor} fill={1} />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>

          <div className="mt-4 space-y-1 text-slate-600">
            {lines.map((line) => (
              <p key={line} className="text-base">
                {line}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={onConfirm}
            className="mt-8 inline-flex min-w-32 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteSendResultModal;
