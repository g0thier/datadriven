/**
 * @module utils/management/permissions.defaults
 * @description Default permission factories for manager access control.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const DEFAULT_TEAM_SECTIONS = {
  offices: false,
  departments: false,
  members: false,
};

/**
 * Builds a default page-access map from leaf paths.
 * @param {string[]} [pageLeafPaths=[]] - Allowed page leaf paths.
 * @returns {Object<string, boolean>} Page access map initialized to `false`.
 */
export function buildDefaultPageAccess(pageLeafPaths = []) {
  return Object.fromEntries(pageLeafPaths.map((path) => [path, false]));
}

/**
 * Creates a full default permissions object.
 * @param {string[]} [pageLeafPaths=[]] - Allowed page leaf paths.
 * @returns {{pageAccess:Object<string, boolean>, teamSections:{offices:boolean, departments:boolean, members:boolean}}} Default permissions.
 */
export function createDefaultPermissions(pageLeafPaths = []) {
  return {
    pageAccess: buildDefaultPageAccess(pageLeafPaths),
    teamSections: { ...DEFAULT_TEAM_SECTIONS },
  };
}

/**
 * Clones default permissions for safe mutable usage.
 * @param {string[]} [pageLeafPaths=[]] - Allowed page leaf paths.
 * @returns {{pageAccess:Object<string, boolean>, teamSections:{offices:boolean, departments:boolean, members:boolean}}} Cloned defaults.
 */
export function cloneDefaultPermissions(pageLeafPaths = []) {
  return createDefaultPermissions(pageLeafPaths);
}
