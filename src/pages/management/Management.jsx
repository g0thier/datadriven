import { useEffect, useMemo, useState } from "react";
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
import { buildUniquePageTree, flattenPageTreePaths } from "../../utils/navigationTree.utils.js";

const MANAGEMENT_LINK_GROUPS = [navbarLinks, innovationLinks, teamLinks, managementLinks];
const MANAGEMENT_PAGE_EXCEPTIONS = ["/soon"];
const MANAGEMENT_PAGE_TREE = buildUniquePageTree(MANAGEMENT_LINK_GROUPS, MANAGEMENT_PAGE_EXCEPTIONS);
const MANAGEMENT_PAGE_PATHS = flattenPageTreePaths(MANAGEMENT_PAGE_TREE);

function buildDefaultPageAccess() {
  return Object.fromEntries(MANAGEMENT_PAGE_PATHS.map((path) => [path, false]));
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

  const totalDepartmentsCount = MANAGEMENT_PAGE_TREE.length;
  const totalLevel2PagesCount = MANAGEMENT_PAGE_TREE.reduce(
    (sum, level1) => sum + level1.children.length,
    0
  );
  const selectedDepartmentsCount = MANAGEMENT_PAGE_TREE.filter((level1) =>
    Boolean(permissions.pageAccess?.[level1.path])
  ).length;
  const selectedLevel2PagesCount = MANAGEMENT_PAGE_TREE.reduce(
    (sum, level1) =>
      sum + level1.children.filter((level2) => Boolean(permissions.pageAccess?.[level2.path])).length,
    0
  );

  const payloadPreview = useMemo(() => {
    if (!selectedManager) return null;

    return {
      managerId: selectedManager.permissionId,
      managerName: selectedManager.label.title,
      permissions: {
        pages: permissions.pageAccess,
        sections: {
          team: permissions.teamSections,
        },
      },
    };
  }, [permissions, selectedManager]);

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
                      <p className="text-xs text-slate-500">Départements</p>
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
                  {MANAGEMENT_PAGE_TREE.map((level1) => (
                    <div key={level1.path} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <PermissionCheckbox
                        checked={Boolean(permissions.pageAccess?.[level1.path])}
                        onChange={() => togglePagePath(level1.path)}
                        disabled={!effectiveSelectedManagerId}
                        label={level1.path}
                        description="Niveau 1"
                      />

                      {level1.children.length > 0 ? (
                        <div className="mt-3 grid gap-3 pl-4">
                          {level1.children.map((level2) => (
                            <PermissionCheckbox
                              key={level2.path}
                              checked={Boolean(permissions.pageAccess?.[level2.path])}
                              onChange={() => togglePagePath(level2.path)}
                              disabled={!effectiveSelectedManagerId}
                              label={level2.path}
                              description={`Niveau 2 de ${level1.path}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
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
