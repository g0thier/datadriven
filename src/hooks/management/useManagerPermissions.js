import { useEffect, useMemo, useRef, useState } from "react";
import { getCompanyManagerPermissions, upsertCompanyManagerPermissions } from "../../firebase";
import {
  buildDefaultPageAccess,
  cloneDefaultPermissions,
} from "../../utils/management/permissions.defaults.js";
import { normalizePermissions } from "../../utils/management/permissions.normalizers.js";
import {
  getLevel1TargetPaths,
  getSelectedDepartments,
  getSelectedLevel2Pages,
  getTotalLevel2PagesCount,
  isOwnerProfile,
} from "../../utils/management/permissions.selectors.js";

/**
 * @module hooks/management/useManagerPermissions
 * @description Hook to hydrate, normalize and persist manager page permissions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Normalizes a role string.
 * @param {string} role - Raw role value.
 * @returns {string} Normalized role.
 */
const normalizeRole = (role) => String(role || "").trim().toLowerCase();

/**
 * Lists enabled path keys from a page-access map.
 * @param {Object<string, boolean>} [pageAccess={}] - Page access map.
 * @returns {string[]} Enabled paths.
 */
const listEnabledPagePaths = (pageAccess = {}) =>
  Object.entries(pageAccess)
    .filter(([, isEnabled]) => Boolean(isEnabled))
    .map(([path]) => path);

/**
 * Maps persisted backend permissions into local hook state format.
 * @param {Object} [persistedPermissions={}] - Persisted permissions by manager id.
 * @param {string[]} [pageLeafPaths=[]] - Known selectable page leaf paths.
 * @returns {Object<string, {pageAccess:Object<string, boolean>}>} Normalized permissions state.
 */
function mapPersistedPermissionsToState(persistedPermissions = {}, pageLeafPaths = []) {
  const source = persistedPermissions ?? {};
  const next = {};

  Object.entries(source).forEach(([managerId, managerPermission]) => {
    if (!managerId) return;

    const nextPageAccess = {
      ...buildDefaultPageAccess(pageLeafPaths),
    };

    const persistedPaths = Array.isArray(managerPermission?.pageAccess)
      ? managerPermission.pageAccess
      : [];

    persistedPaths.forEach((path) => {
      const normalizedPath = String(path || "").trim();
      if (!normalizedPath) return;
      nextPageAccess[normalizedPath] = true;
    });

    next[String(managerId)] = {
      pageAccess: nextPageAccess,
    };
  });

  return next;
}

/**
 * Builds a persisted payload for one manager from local permissions state.
 * @param {Object} manager - Manager record.
 * @param {{pageAccess:Object<string, boolean>}} managerPermissions - Local manager permissions.
 * @param {string[]} pageLeafPaths - Known selectable page leaf paths.
 * @returns {{role:string, pageAccess:string[]}} Persistable permissions payload.
 */
function buildPersistedPayload(manager, managerPermissions, pageLeafPaths) {
  const role = normalizeRole(manager?.role);
  const pageAccess =
    role === "owner"
      ? [...pageLeafPaths]
      : listEnabledPagePaths(managerPermissions?.pageAccess ?? {});

  return { role, pageAccess };
}

/**
 * Exposes manager-permission state, counters and toggles for the management UI.
 * @param {Object} params - Hook params.
 * @param {string} params.companyId - Company identifier.
 * @param {Object[]} params.managers - Managers list.
 * @param {Array<{path:string, children:Array<{path:string}>}>} params.pageTree - Page tree structure.
 * @param {string[]} params.pageLeafPaths - Selectable leaf paths.
 * @returns {Object} Permissions state, selectors and mutation handlers.
 */
export default function useManagerPermissions({
  companyId,
  managers,
  pageTree,
  pageLeafPaths,
}) {
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [permissionsByManager, setPermissionsByManager] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const lastPersistedSignaturesRef = useRef({});

  useEffect(() => {
    lastPersistedSignaturesRef.current = {};
  }, [companyId]);

  const normalizedPermissionsByManager = useMemo(
    () => normalizePermissions(permissionsByManager, managers, pageLeafPaths),
    [permissionsByManager, managers, pageLeafPaths]
  );

  const effectiveSelectedManagerId = useMemo(() => {
    if (managers.length === 0) return "";

    const isCurrentManagerStillPresent = managers.some(
      (manager) => manager.permissionId === selectedManagerId
    );

    return isCurrentManagerStillPresent ? selectedManagerId : managers[0].permissionId;
  }, [managers, selectedManagerId]);

  const permissions =
    normalizedPermissionsByManager[effectiveSelectedManagerId] ??
    cloneDefaultPermissions(pageLeafPaths);

  const selectedManager = useMemo(
    () => managers.find((manager) => manager.permissionId === effectiveSelectedManagerId),
    [effectiveSelectedManagerId, managers]
  );
  const ownerProfile = isOwnerProfile(selectedManager);

  useEffect(() => {
    let isSubscribed = true;

    if (!companyId) {
      setPermissionsByManager({});
      setIsHydrated(false);
      return () => {
        isSubscribed = false;
      };
    }

    setIsHydrated(false);

    const loadPersistedPermissions = async () => {
      try {
        const persistedPermissions = await getCompanyManagerPermissions(companyId);
        if (!isSubscribed) return;

        setPermissionsByManager(
          mapPersistedPermissionsToState(persistedPermissions, pageLeafPaths)
        );
      } catch (error) {
        console.error("Impossible de charger les permissions des managers :", error);
        if (!isSubscribed) return;
        setPermissionsByManager({});
      } finally {
        if (isSubscribed) {
          setIsHydrated(true);
        }
      }
    };

    loadPersistedPermissions();

    return () => {
      isSubscribed = false;
    };
  }, [companyId, pageLeafPaths]);

  useEffect(() => {
    if (!companyId || !isHydrated) return;

    const managerIds = new Set(managers.map((manager) => String(manager.permissionId)));
    Object.keys(lastPersistedSignaturesRef.current).forEach((managerId) => {
      if (!managerIds.has(managerId)) {
        delete lastPersistedSignaturesRef.current[managerId];
      }
    });

    managers.forEach((manager) => {
      const managerId = String(manager.permissionId || "").trim();
      if (!managerId) return;

      const managerPermissions =
        normalizedPermissionsByManager[managerId] ?? cloneDefaultPermissions(pageLeafPaths);
      const payload = buildPersistedPayload(manager, managerPermissions, pageLeafPaths);
      const signature = JSON.stringify(payload);

      if (lastPersistedSignaturesRef.current[managerId] === signature) return;

      lastPersistedSignaturesRef.current[managerId] = signature;

      upsertCompanyManagerPermissions(companyId, managerId, payload).catch((error) => {
        console.error(
          `Impossible d'enregistrer les permissions du manager ${managerId} :`,
          error
        );
        delete lastPersistedSignaturesRef.current[managerId];
      });
    });
  }, [companyId, isHydrated, managers, normalizedPermissionsByManager, pageLeafPaths]);

  function updateManagerPermissions(updater) {
    if (!effectiveSelectedManagerId) return;

    setPermissionsByManager((prev) => {
      const normalized = normalizePermissions(prev, managers, pageLeafPaths);
      const current = normalized[effectiveSelectedManagerId] ?? cloneDefaultPermissions(pageLeafPaths);
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
        ...buildDefaultPageAccess(pageLeafPaths),
        ...(current.pageAccess ?? {}),
        [path]: !(current.pageAccess?.[path] ?? false),
      },
    }));
  }

  function toggleLevel1Group(level1) {
    updateManagerPermissions((current) => {
      const nextPageAccess = {
        ...buildDefaultPageAccess(pageLeafPaths),
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

  const totalDepartmentsCount = pageTree.length;
  const totalLevel2PagesCount = useMemo(() => getTotalLevel2PagesCount(pageTree), [pageTree]);
  const selectedDepartments = useMemo(
    () => getSelectedDepartments(pageTree, permissions.pageAccess),
    [pageTree, permissions.pageAccess]
  );
  const selectedLevel2Pages = useMemo(
    () => getSelectedLevel2Pages(pageTree, permissions.pageAccess),
    [pageTree, permissions.pageAccess]
  );

  const displayedSelectedDepartmentsCount = ownerProfile
    ? totalDepartmentsCount
    : selectedDepartments.length;
  const displayedSelectedLevel2PagesCount = ownerProfile
    ? totalLevel2PagesCount
    : selectedLevel2Pages.length;

  return {
    selectedManagerId: effectiveSelectedManagerId,
    onSelectManager: setSelectedManagerId,
    permissionsByManager: normalizedPermissionsByManager,
    pageAccess: permissions.pageAccess,
    selectedManager,
    isOwnerProfile: ownerProfile,
    isPagesSelectionDisabled: !effectiveSelectedManagerId || !isHydrated,
    toggleLevel1Group,
    togglePagePath,
    totalDepartmentsCount,
    totalLevel2PagesCount,
    selectedDepartmentsCount: displayedSelectedDepartmentsCount,
    selectedLevel2PagesCount: displayedSelectedLevel2PagesCount,
  };
}
