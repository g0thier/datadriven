import { buildDefaultPageAccess, cloneDefaultPermissions } from "./permissions.defaults.js";

export function normalizePermissions(permissionMap, managers, pageLeafPaths) {
  const source = permissionMap ?? {};
  const next = {};

  managers.forEach((manager) => {
    const rawPermissions = source[manager.permissionId] ?? {};
    const defaults = cloneDefaultPermissions(pageLeafPaths);

    next[manager.permissionId] = {
      ...defaults,
      ...rawPermissions,
      pageAccess: {
        ...buildDefaultPageAccess(pageLeafPaths),
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
