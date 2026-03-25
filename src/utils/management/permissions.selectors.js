/**
 * @module utils/management/permissions.selectors
 * @description Selectors and derived-state helpers for manager permission trees.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Returns target paths controlled by a level-1 node.
 * @param {{path:string, children:Array<{path:string}>}} level1 - Level-1 tree node.
 * @returns {string[]} Target paths for this section.
 */
export function getLevel1TargetPaths(level1) {
  return level1.children.length > 0
    ? level1.children.map((level2) => level2.path)
    : [level1.path];
}

/**
 * Computes selection state for a level-1 section.
 * @param {{path:string, children:Array<{path:string}>}} level1 - Level-1 tree node.
 * @param {Object<string, boolean>} pageAccess - Current page-access map.
 * @returns {{hasAny:boolean, allSelected:boolean, selectedCount:number, totalCount:number}} Selection state.
 */
export function getLevel1SelectionState(level1, pageAccess) {
  const targetPaths = getLevel1TargetPaths(level1);
  const selectedCount = targetPaths.filter((path) => Boolean(pageAccess?.[path])).length;

  return {
    hasAny: selectedCount > 0,
    allSelected: selectedCount === targetPaths.length,
    selectedCount,
    totalCount: targetPaths.length,
  };
}

/**
 * Counts all available level-2 pages in the tree.
 * @param {Array<{children:Array}>} pageTree - Navigation tree.
 * @returns {number} Number of level-2 pages.
 */
export function getTotalLevel2PagesCount(pageTree) {
  return pageTree.reduce((sum, level1) => sum + level1.children.length, 0);
}

/**
 * Returns selected level-1 department paths.
 * @param {Array<{path:string, children:Array<{path:string}>}>} pageTree - Navigation tree.
 * @param {Object<string, boolean>} pageAccess - Current page-access map.
 * @returns {string[]} Selected level-1 paths.
 */
export function getSelectedDepartments(pageTree, pageAccess) {
  return pageTree
    .filter((level1) => getLevel1SelectionState(level1, pageAccess).hasAny)
    .map((level1) => level1.path);
}

/**
 * Returns selected level-2 pages (or level-1 path when leaf section has no children).
 * @param {Array<{path:string, children:Array<{path:string}>}>} pageTree - Navigation tree.
 * @param {Object<string, boolean>} pageAccess - Current page-access map.
 * @returns {string[]} Selected page paths.
 */
export function getSelectedLevel2Pages(pageTree, pageAccess) {
  return pageTree.flatMap((level1) => {
    if (level1.children.length === 0) {
      return pageAccess?.[level1.path] ? [level1.path] : [];
    }

    return level1.children
      .filter((level2) => Boolean(pageAccess?.[level2.path]))
      .map((level2) => level2.path);
  });
}

/**
 * Checks whether a manager profile belongs to an owner.
 * @param {Object} manager - Manager record.
 * @returns {boolean} `true` when role is owner.
 */
export function isOwnerProfile(manager) {
  return String(manager?.role || "").trim().toLowerCase() === "owner";
}
