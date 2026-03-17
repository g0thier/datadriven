import { useMemo, useState } from "react";
import { buildDefaultPageAccess, cloneDefaultPermissions } from "../../utils/management/permissions.defaults.js";
import { normalizePermissions } from "../../utils/management/permissions.normalizers.js";
import {
  getLevel1TargetPaths,
  getSelectedDepartments,
  getSelectedLevel2Pages,
  getTotalLevel2PagesCount,
  isOwnerProfile,
} from "../../utils/management/permissions.selectors.js";

export default function useManagerPermissions({ managers, pageTree, pageLeafPaths }) {
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [permissionsByManager, setPermissionsByManager] = useState({});

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
    isPagesSelectionDisabled: !effectiveSelectedManagerId,
    toggleLevel1Group,
    togglePagePath,
    totalDepartmentsCount,
    totalLevel2PagesCount,
    selectedDepartmentsCount: displayedSelectedDepartmentsCount,
    selectedLevel2PagesCount: displayedSelectedLevel2PagesCount,
  };
}
