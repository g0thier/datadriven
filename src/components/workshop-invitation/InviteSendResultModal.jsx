/**
 * @module components/workshop-invitation/InviteSendResultModal
 * @description UI component module for InviteSendResultModal.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import MaterialIcon from "../MaterialIcon";

const ICON_BY_VARIANT = {
  success: "check_circle",
  warning: "brightness_alert",
};

const ICON_COLOR_BY_VARIANT = {
  success: "text-green-600",
  warning: "text-amber-400",
};

/**
 * Renders the InviteSendResultModal component.
 * @param {Object} props - Component props.
 * @param {*} props.isOpen - isOpen prop.
 * @param {*} props.variant - variant prop.
 * @param {*} props.title - title prop.
 * @param {Array} [props.lines=[]] - lines prop.
 * @param {*} props.onConfirm - onConfirm prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import InviteSendResultModal from "../components/workshop-invitation/InviteSendResultModal";
 *
 * // Real usage reference: src/pages/innovation/WorkshopInvitation.jsx
 * <InviteSendResultModal />;
 */
function InviteSendResultModal({ isOpen, variant, title, lines = [], onConfirm }) {
  if (!isOpen) return null;

  const iconName = ICON_BY_VARIANT[variant] ?? ICON_BY_VARIANT.warning;
  const iconColor = ICON_COLOR_BY_VARIANT[variant] ?? ICON_COLOR_BY_VARIANT.warning;

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-slate-900/55 py-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 py-8">
        <div className="flex flex-col items-center text-center ">
          <div className="flex items-center justify-center mb-4">
            <MaterialIcon name={iconName} size={128} className={iconColor} fill={1} />
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
            className="mt-8 inline-flex min-w-32 items-center justify-center rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white transition hover:bg-violet-600"
          >
            À bientôt
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteSendResultModal;
