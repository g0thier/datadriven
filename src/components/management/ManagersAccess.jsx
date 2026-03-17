const EMPTY_MANAGER_PERMISSIONS = {
  pageAccess: {},
};

export default function ManagersAccess({
  managers,
  selectedManagerId,
  permissionsByManager,
  onSelectManager,
}) {
  return (
    <div className="h-fit rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">Gestion des accès</p>
        <h2 className="text-2xl font-bold text-slate-900">Droits d'accès managers</h2>
      </div>

      <div className="space-y-3">
        {managers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Aucun manager avec le role owner ou leader n'a ete trouve.
          </p>
        ) : (
          managers.map((manager) => {
            const isActive = manager.permissionId === selectedManagerId;
            const isOwnerProfile = String(manager?.role || "").trim().toLowerCase() === "owner";
            const managerPermissions =
              permissionsByManager[manager.permissionId] ?? EMPTY_MANAGER_PERMISSIONS;
            const enabledPages = Object.values(managerPermissions.pageAccess ?? {}).filter(Boolean)
              .length;
            const leaderAccessLabel =
              enabledPages >= 2 ? `${enabledPages} pages actives` : `${enabledPages} page active`;

            return (
              <button
                key={manager.permissionId}
                type="button"
                onClick={() => onSelectManager(manager.permissionId)}
                className={[
                  "w-full rounded-2xl border p-4 text-left transition",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:bg-slate-50",
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
            );
          })
        )}
      </div>
    </div>
  );
}
