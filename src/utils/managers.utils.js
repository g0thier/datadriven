/**
 * @module utils/managers
 * @description Helpers to normalize manager records for permission screens.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Resolves a stable permission identifier for a manager.
 * @param {Object} manager - Manager payload.
 * @param {number} index - Fallback index.
 * @returns {string|number} Resolved identifier value.
 */
function getManagerPermissionId(manager, index) {
  return manager?.id ?? manager?._id ?? manager?.uid ?? manager?.email ?? `manager-${index}`;
}

/**
 * Resolves the best display name available for a manager.
 * @param {Object} manager - Manager payload.
 * @returns {string} Display name.
 */
function getManagerDisplayName(manager) {
  const fullName = [manager?.firstName, manager?.lastName].filter(Boolean).join(" ").trim();
  return manager?.name || manager?.fullName || fullName || "Manager";
}

/**
 * Builds a manager label object for UI rendering.
 * @param {Object} manager - Manager payload.
 * @returns {{title:string, subtitle:string}} Manager label.
 */
function getManagerLabel(manager) {
  const role = manager?.role || manager?.jobTitle || "Manager";
  const email = manager?.email || manager?.mail || "";

  return {
    title: getManagerDisplayName(manager),
    subtitle: email ? `${role} • ${email}` : role,
  };
}

/**
 * Normalizes a manager list with `permissionId` and UI label fields.
 * @param {Object[]} list - Source manager list.
 * @returns {Object[]} Enriched managers.
 */
export function buildManagerList(list) {
  const source = Array.isArray(list) ? list : [];

  return source.map((manager, index) => ({
    ...manager,
    permissionId: String(getManagerPermissionId(manager, index)),
    label: getManagerLabel(manager),
  }));
}
