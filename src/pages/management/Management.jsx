import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import ManagerSummary from "../../components/management/ManagerSummary.jsx";
import ManagersAccess from "../../components/management/ManagersAccess.jsx";
import PagesSelection from "../../components/management/PagesSelection.jsx";
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
  const selectedDepartmentsCount = selectedDepartments.length;
  const selectedLevel2PagesCount = selectedLevel2Pages.length;

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
              <ManagerSummary
                selectedManager={selectedManager}
                selectedDepartmentsCount={selectedDepartmentsCount}
                totalDepartmentsCount={totalDepartmentsCount}
                selectedLevel2PagesCount={selectedLevel2PagesCount}
                totalLevel2PagesCount={totalLevel2PagesCount}
              />
              <PagesSelection
                pageTree={MANAGEMENT_PAGE_TREE}
                pageAccess={permissions.pageAccess}
                isDisabled={!effectiveSelectedManagerId}
                onToggleLevel1={toggleLevel1Group}
                onToggleLevel2={togglePagePath}
                getPathDisplayMeta={getPathDisplayMeta}
                getLevel1SelectionState={getLevel1SelectionState}
              />

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
