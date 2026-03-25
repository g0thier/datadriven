import { buildDefaultPageAccess, cloneDefaultPermissions } from "./permissions.defaults.js";

/**
 * @module utils/management/permissions.normalizers
 * @description Normalizers to align manager permissions with expected defaults.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Normalizes a permission map for a manager list and page leaf paths.
 * @param {Object<string, Object>} permissionMap - Existing permissions keyed by manager id.
 * @param {Array<{permissionId:string}>} managers - Managers with resolved permission ids.
 * @param {string[]} pageLeafPaths - Known page leaf paths.
 * @returns {Object<string, Object>} Normalized permission map.
 */
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
