/**
 * @module components/management/PagesSelection
 * @description UI component module for PagesSelection.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import MaterialIcon from "../MaterialIcon.jsx";
import { getLevel1SelectionState } from "../../utils/management/permissions.selectors.js";

function PermissionCheckbox({ checked, onChange, label, description, disabled = false }) {
  return (
    <label
      className={[
        "flex items-start gap-3 rounded-2xl border px-4 py-4 transition",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          : checked
          ? "cursor-pointer border-slate-900 bg-slate-50"
          : "cursor-pointer border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
    </label>
  );
}

/**
 * Renders the PagesSelection component.
 * @param {Object} props - Component props.
 * @param {*} props.pageTree - pageTree prop.
 * @param {*} props.pageAccess - pageAccess prop.
 * @param {*} props.isDisabled - isDisabled prop.
 * @param {boolean} [props.isOwnerProfile=false] - isOwnerProfile prop.
 * @param {*} props.onToggleLevel1 - onToggleLevel1 prop.
 * @param {*} props.onToggleLevel2 - onToggleLevel2 prop.
 * @param {*} props.getPathDisplayMeta - getPathDisplayMeta prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import PagesSelection from "../components/management/PagesSelection";
 *
 * // Real usage reference: src/pages/management/Management.jsx
 * <PagesSelection />;
 */
export default function PagesSelection({
  pageTree,
  pageAccess,
  isDisabled,
  isOwnerProfile = false,
  onToggleLevel1,
  onToggleLevel2,
  getPathDisplayMeta,
}) {
  const isSelectionDisabled = isDisabled || isOwnerProfile;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <p className="text-sm font-medium text-slate-500">Pages sélectionnées</p>

      <div className="mt-1 space-y-4">
        {pageTree.map((level1) => {
          const level1Meta = getPathDisplayMeta(level1.path);
          const level1State = getLevel1SelectionState(level1, pageAccess);
          const level1HasAny = isOwnerProfile ? true : level1State.hasAny;

          return (
            <div key={level1.path}>
              <button
                type="button"
                onClick={() => onToggleLevel1(level1)}
                disabled={isSelectionDisabled}
                className={[
                  "flex w-full items-center justify-start gap-2 text-left text-xl font-bold text-slate-900",
                  isSelectionDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                ].join(" ")}
              >
                <span>{level1Meta.label}</span>
                <MaterialIcon
                  name={level1Meta.icon}
                  size={24}
                  className={level1HasAny ? "text-amber-400" : "text-slate-400"}
                />
              </button>

              {level1.children.length > 0 ? (
                <div className="mb-9 mt-3 grid gap-3 pl-4">
                  {level1.children.map((level2) => {
                    const level2Meta = getPathDisplayMeta(level2.path);
                    const isChecked = isOwnerProfile ? true : Boolean(pageAccess?.[level2.path]);

                    return (
                      <PermissionCheckbox
                        key={level2.path}
                        checked={isChecked}
                        onChange={() => onToggleLevel2(level2.path)}
                        disabled={isSelectionDisabled}
                        label={
                          <span className="inline-flex items-center gap-2">
                            <MaterialIcon
                              name={level2Meta.icon}
                              size={18}
                              className="text-slate-600"
                            />
                            <span>{level2Meta.label}</span>
                          </span>
                        }
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
