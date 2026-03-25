/**
 * @module components/management/ManagersAccess
 * @description UI component module for ManagersAccess.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import MaterialIcon from "../MaterialIcon.jsx";

const EMPTY_MANAGER_PERMISSIONS = {
  pageAccess: {},
};

/**
 * Renders the ManagersAccess component.
 * @param {Object} props - Component props.
 * @param {*} props.managers - managers prop.
 * @param {*} props.selectedManagerId - selectedManagerId prop.
 * @param {*} props.permissionsByManager - permissionsByManager prop.
 * @param {*} props.onSelectManager - onSelectManager prop.
 * @param {*} props.onDemoteManager - onDemoteManager prop.
 * @param {string} [props.demotingManagerId=""] - demotingManagerId prop.
 * @param {string} [props.demotionError=""] - demotionError prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import ManagersAccess from "../components/management/ManagersAccess";
 *
 * // Real usage reference: src/pages/management/Management.jsx
 * <ManagersAccess />;
 */
export default function ManagersAccess({
  managers,
  selectedManagerId,
  permissionsByManager,
  onSelectManager,
  onDemoteManager,
  demotingManagerId = "",
  demotionError = "",
}) {
  return (
    <div className="h-fit rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">Gestion des accès</p>
        <h2 className="text-2xl font-bold text-slate-900">Droits d'accès managers</h2>
      </div>

      {demotionError ? <p className="mb-3 text-xs text-rose-600">{demotionError}</p> : null}

      <div className="space-y-3">
        {managers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Aucun manager avec le role owner ou leader n'a ete trouve.
          </p>
        ) : (
          managers.map((manager) => {
            const isActive = manager.permissionId === selectedManagerId;
            const normalizedRole = String(manager?.role || "").trim().toLowerCase();
            const isOwnerProfile = normalizedRole === "owner";
            const isLeaderProfile = normalizedRole === "leader";
            const isDemoting = demotingManagerId === manager.permissionId;
            const managerPermissions =
              permissionsByManager[manager.permissionId] ?? EMPTY_MANAGER_PERMISSIONS;
            const enabledPages = Object.values(managerPermissions.pageAccess ?? {}).filter(Boolean)
              .length;
            const leaderAccessLabel =
              enabledPages >= 2 ? `${enabledPages} pages actives` : `${enabledPages} page active`;

            return (
              <div key={manager.permissionId} className="relative">
                <button
                  type="button"
                  onClick={() => onSelectManager(manager.permissionId)}
                  disabled={isDemoting}
                  className={[
                    "w-full rounded-2xl border p-4 text-left transition",
                    isLeaderProfile ? "pr-12" : "",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                    isDemoting ? "opacity-90" : "",
                  ].join(" ")}
                >
                  <p className="font-semibold">{manager.label.title}</p>
                  <p
                    className={[
                      "mt-1 text-sm",
                      isActive ? "text-slate-200" : "text-slate-600",
                    ].join(" ")}
                  >
                    {manager.label.subtitle}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span
                      className={[
                        "rounded-full px-2 py-1",
                        isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {isOwnerProfile ? "Full access" : leaderAccessLabel}
                    </span>
                  </div>
                </button>

                {isLeaderProfile ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDemoteManager?.(manager.permissionId);
                    }}
                    disabled={isDemoting}
                    aria-label={`Retirer ${manager.label.title} des leaders`}
                    className={[
                      "absolute right-3 top-3 rounded-full p-1 transition",
                      isActive ? "text-white/80 hover:text-violet-500" : "text-slate-500 hover:text-violet-500",
                      isDemoting ? "opacity-70" : "cursor-pointer",
                    ].join(" ")}
                  >
                    <MaterialIcon name="close" size={18} weight={600} />
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
