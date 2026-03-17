import { useEffect, useMemo, useState } from "react";
import MaterialIcon from "../../components/MaterialIcon.jsx";
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import ManagersAccess from "../../components/management/ManagersAccess.jsx";
import {
  innovationLinks,
  managementLinks,
  navbarLinks,
  teamLinks,
} from "../../constants/navigationLinks.js";
import { getUserCompanyId, onAuthStateChangedListener, subscribeCompanyManagers } from "../../firebase";
import { buildManagerList } from "../../utils/managers.utils.js";
import { buildUniquePageTree } from "../../utils/navigationTree.utils.js";

const MANAGEMENT_LINK_GROUPS = [navbarLinks, innovationLinks, teamLinks, managementLinks];
const MANAGEMENT_PAGE_EXCEPTIONS = ["/soon"];
const MANAGEMENT_PAGE_TREE = buildUniquePageTree(MANAGEMENT_LINK_GROUPS, MANAGEMENT_PAGE_EXCEPTIONS);
const MANAGEMENT_PAGE_LEAF_PATHS = MANAGEMENT_PAGE_TREE.flatMap((level1) =>
  level1.children.length > 0
    ? level1.children.map((level2) => level2.path)
    : [level1.path]
);
const MANAGEMENT_LINK_META_BY_PATH = MANAGEMENT_LINK_GROUPS.flat().reduce((map, link) => {
  if (!link?.to || map.has(link.to)) return map;
  map.set(link.to, { label: link.label, icon: link.icon });
  return map;
}, new Map());

function getPathDisplayMeta(path) {
  const meta = MANAGEMENT_LINK_META_BY_PATH.get(path);
  if (meta) return meta;
  return { label: path, icon: "route" };
}

function buildDefaultPageAccess() {
  return Object.fromEntries(MANAGEMENT_PAGE_LEAF_PATHS.map((path) => [path, false]));
}

const DEFAULT_PERMISSIONS = {
  pageAccess: buildDefaultPageAccess(),
  teamSections: {
    offices: false,
    departments: false,
    members: false,
  },
};

function cloneDefaultPermissions() {
  return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
}

function normalizePermissions(permissionMap, managers) {
  const source = permissionMap ?? {};
  const next = {};

  managers.forEach((manager) => {
    const rawPermissions = source[manager.permissionId] ?? {};
    const defaults = cloneDefaultPermissions();

    next[manager.permissionId] = {
      ...defaults,
      ...rawPermissions,
      pageAccess: {
        ...buildDefaultPageAccess(),
        ...(rawPermissions.pageAccess ?? {}),
      },
      teamSections: {
        ...defaults.teamSections,
        ...(rawPermissions.teamSections ?? {}),
      },
    };
  });

  return next;
}

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

function getLevel1TargetPaths(level1) {
  return level1.children.length > 0
    ? level1.children.map((level2) => level2.path)
    : [level1.path];
}

function getLevel1SelectionState(level1, pageAccess) {
  const targetPaths = getLevel1TargetPaths(level1);
  const selectedCount = targetPaths.filter((path) => Boolean(pageAccess?.[path])).length;

  return {
    hasAny: selectedCount > 0,
    allSelected: selectedCount === targetPaths.length,
    selectedCount,
    totalCount: targetPaths.length,
  };
}

export default function Management() {
  const [companyId, setCompanyId] = useState(null);
  const [managerRecords, setManagerRecords] = useState([]);
  const managers = useMemo(() => buildManagerList(managerRecords), [managerRecords]);

  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [permissionsByManager, setPermissionsByManager] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (currentUser) => {
      if (!currentUser) {
        setCompanyId(null);
        setManagerRecords([]);
        return;
      }

      try {
        const nextCompanyId = await getUserCompanyId(currentUser.uid);
        setCompanyId(nextCompanyId || null);

        if (!nextCompanyId) {
          setManagerRecords([]);
        }
      } catch (error) {
        console.error("Impossible de récupérer le companyId de l'utilisateur :", error);
        setCompanyId(null);
        setManagerRecords([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCompanyManagers(companyId, setManagerRecords);
    return () => unsubscribe();
  }, [companyId]);

  const normalizedPermissionsByManager = useMemo(
    () => normalizePermissions(permissionsByManager, managers),
    [permissionsByManager, managers]
  );

  const effectiveSelectedManagerId = useMemo(() => {
    if (managers.length === 0) return "";

    const isCurrentManagerStillPresent = managers.some(
      (manager) => manager.permissionId === selectedManagerId
    );

    return isCurrentManagerStillPresent
      ? selectedManagerId
      : managers[0].permissionId;
  }, [managers, selectedManagerId]);

  const permissions =
    normalizedPermissionsByManager[effectiveSelectedManagerId] ?? cloneDefaultPermissions();

  const selectedManager = managers.find(
    (manager) => manager.permissionId === effectiveSelectedManagerId
  );

  function updateManagerPermissions(updater) {
    if (!effectiveSelectedManagerId) return;

    setPermissionsByManager((prev) => {
      const normalized = normalizePermissions(prev, managers);
      const current = normalized[effectiveSelectedManagerId] ?? cloneDefaultPermissions();
      const updated = updater(current);
      return {
        ...normalized,
        [effectiveSelectedManagerId]: updated,
      };
    });
  }

  function togglePagePath(path) {
    updateManagerPermissions((current) => ({
      ...current,
      pageAccess: {
        ...buildDefaultPageAccess(),
        ...(current.pageAccess ?? {}),
        [path]: !(current.pageAccess?.[path] ?? false),
      },
    }));
  }

  function toggleLevel1Group(level1) {
    updateManagerPermissions((current) => {
      const nextPageAccess = {
        ...buildDefaultPageAccess(),
        ...(current.pageAccess ?? {}),
      };
      const targetPaths = getLevel1TargetPaths(level1);
      const hasAnySelected = targetPaths.some((path) => Boolean(nextPageAccess[path]));
      const nextValue = !hasAnySelected;

      targetPaths.forEach((path) => {
        nextPageAccess[path] = nextValue;
      });

      return {
        ...current,
        pageAccess: nextPageAccess,
      };
    });
  }

  const totalDepartmentsCount = MANAGEMENT_PAGE_TREE.length;
  const totalLevel2PagesCount = MANAGEMENT_PAGE_TREE.reduce(
    (sum, level1) => sum + level1.children.length,
    0
  );
  const selectedDepartments = useMemo(
    () =>
      MANAGEMENT_PAGE_TREE.filter((level1) =>
        getLevel1SelectionState(level1, permissions.pageAccess).hasAny
      ).map((level1) => level1.path),
    [permissions.pageAccess]
  );
  const selectedLevel2Pages = useMemo(
    () =>
      MANAGEMENT_PAGE_TREE.flatMap((level1) => {
        if (level1.children.length === 0) {
          return permissions.pageAccess?.[level1.path] ? [level1.path] : [];
        }

        return level1.children
          .filter((level2) => Boolean(permissions.pageAccess?.[level2.path]))
          .map((level2) => level2.path);
      }),
    [permissions.pageAccess]
  );
  const pagePermissionsTree = useMemo(
    () =>
      MANAGEMENT_PAGE_TREE.map((level1) => {
        const state = getLevel1SelectionState(level1, permissions.pageAccess);
        return {
          path: level1.path,
          enabled: state.hasAny,
          pages: level1.children.map((level2) => ({
            path: level2.path,
            enabled: Boolean(permissions.pageAccess?.[level2.path]),
          })),
        };
      }),
    [permissions.pageAccess]
  );
  const selectedDepartmentsCount = selectedDepartments.length;
  const selectedLevel2PagesCount = selectedLevel2Pages.length;

  const payloadPreview = useMemo(() => {
    if (!selectedManager) return null;

    return {
      managerId: selectedManager.permissionId,
      managerName: selectedManager.label.title,
      permissions: {
        departments: selectedDepartments,
        pages: selectedLevel2Pages,
        tree: pagePermissionsTree,
      },
    };
  }, [pagePermissionsTree, selectedDepartments, selectedLevel2Pages, selectedManager]);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Management</h1>
            <SectionNavButtons
              links={managementLinks}
              ariaLabel="Navigation management"
              variant="page"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <ManagersAccess
              managers={managers}
              selectedManagerId={effectiveSelectedManagerId}
              permissionsByManager={normalizedPermissionsByManager}
              onSelectManager={setSelectedManagerId}
            />

            <div className="grid gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Manager sélectionné</p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedManager?.label.title ?? "Aucun manager"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedManager?.label.subtitle ?? "Aucune donnée disponible."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:min-w-72">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Secteur</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {selectedDepartmentsCount}/{totalDepartmentsCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Pages</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {selectedLevel2PagesCount}/{totalLevel2PagesCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-500">Pages sélectionnées</p>

                <div className="space-y-4 mt-3">
                  {MANAGEMENT_PAGE_TREE.map((level1) => {
                    const level1Meta = getPathDisplayMeta(level1.path);
                    const level1State = getLevel1SelectionState(level1, permissions.pageAccess);

                    return (
                      <div
                        key={level1.path}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <PermissionCheckbox
                          checked={level1State.hasAny}
                          onChange={() => toggleLevel1Group(level1)}
                          disabled={!effectiveSelectedManagerId}
                          label={
                            <span className="inline-flex items-center gap-2">
                              <MaterialIcon name={level1Meta.icon} size={18} className="text-slate-600" />
                              <span>{level1Meta.label}</span>
                            </span>
                          }
                        />

                        {level1.children.length > 0 ? (
                          <div className="mt-3 grid gap-3 pl-4">
                            {level1.children.map((level2) => {
                              const level2Meta = getPathDisplayMeta(level2.path);
                              return (
                                <PermissionCheckbox
                                  key={level2.path}
                                  checked={Boolean(permissions.pageAccess?.[level2.path])}
                                  onChange={() => togglePagePath(level2.path)}
                                  disabled={!effectiveSelectedManagerId}
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

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Payload de sortie</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Exemple de structure prête à envoyer à ton backend ou à stocker dans Firestore / API.
                  </p>
                </div>

                <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
{JSON.stringify(payloadPreview, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
