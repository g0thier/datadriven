import MaterialIcon from "../MaterialIcon.jsx";

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

export default function PagesSelection({
  pageTree,
  pageAccess,
  isDisabled,
  isOwnerProfile = false,
  onToggleLevel1,
  onToggleLevel2,
  getPathDisplayMeta,
  getLevel1SelectionState,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <p className="text-sm font-medium text-slate-500">Pages sélectionnées</p>

      {isOwnerProfile ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Profil Owner, aucune restriction d&apos;accès ne peut être imposée.
        </div>
      ) : (
        <div className="mt-1 space-y-4">
          {pageTree.map((level1) => {
            const level1Meta = getPathDisplayMeta(level1.path);
            const level1State = getLevel1SelectionState(level1, pageAccess);

            return (
              <div key={level1.path}>
                <button
                  type="button"
                  onClick={() => onToggleLevel1(level1)}
                  disabled={isDisabled}
                  className={[
                    "flex w-full items-center justify-start gap-2 text-left text-xl font-bold text-slate-900",
                    isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  ].join(" ")}
                >
                  <span>{level1Meta.label}</span>
                  <MaterialIcon
                    name={level1Meta.icon}
                    size={24}
                    className={level1State.hasAny ? "text-amber-400" : "text-slate-400"}
                  />
                </button>

                {level1.children.length > 0 ? (
                  <div className="mb-9 mt-3 grid gap-3 pl-4">
                    {level1.children.map((level2) => {
                      const level2Meta = getPathDisplayMeta(level2.path);

                      return (
                        <PermissionCheckbox
                          key={level2.path}
                          checked={Boolean(pageAccess?.[level2.path])}
                          onChange={() => onToggleLevel2(level2.path)}
                          disabled={isDisabled}
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
      )}
    </div>
  );
}
