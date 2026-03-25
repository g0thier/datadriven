/**
 * @module utils/navigationTree
 * @description Helpers to build and flatten a unique navigation tree from link groups.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Normalizes an application path by removing query/hash and trailing slash.
 * @param {string} path - Raw path to normalize.
 * @returns {string} Normalized absolute path, or an empty string when invalid.
 */
function normalizePath(path) {
  if (typeof path !== "string") return "";

  const cleaned = path.trim().split(/[?#]/)[0].replace(/\/{2,}/g, "/");

  if (!cleaned.startsWith("/")) return "";
  if (cleaned.length > 1 && cleaned.endsWith("/")) return cleaned.slice(0, -1);

  return cleaned;
}

/**
 * Extracts a section path up to a given depth.
 * @param {string} path - Full path.
 * @param {number} level - Number of segments to keep.
 * @returns {string} Truncated path, or an empty string when unavailable.
 */
function getLevelPath(path, level) {
  const normalized = normalizePath(path);
  if (!normalized) return "";
  if (normalized === "/") return "/";

  const parts = normalized.split("/").filter(Boolean).slice(0, level);
  if (parts.length === 0) return "";
  return `/${parts.join("/")}`;
}

/**
 * Builds a unique two-level page tree from navigation link groups.
 * @param {Array<Array<Object>>} linkGroups - Nested list of links (`link.to` is used when present).
 * @param {string[]} [exceptions=[]] - Paths to exclude from the tree.
 * @returns {Array<{path: string, children: Array<{path: string}>}>} Unique page tree.
 */
export function buildUniquePageTree(linkGroups, exceptions = []) {
  const exceptionsSet = new Set(exceptions.map(normalizePath).filter(Boolean));
  const roots = new Map();

  linkGroups.flat().forEach((link) => {
    const normalized = normalizePath(link?.to);
    if (!normalized || exceptionsSet.has(normalized)) return;

    const level1Path = getLevelPath(normalized, 1);
    if (!level1Path || exceptionsSet.has(level1Path)) return;

    if (!roots.has(level1Path)) {
      roots.set(level1Path, { path: level1Path, children: [] });
    }

    const level2Path = getLevelPath(normalized, 2);
    if (!level2Path || level2Path === level1Path || exceptionsSet.has(level2Path)) return;

    const level1Node = roots.get(level1Path);
    if (level1Node.children.some((child) => child.path === level2Path)) return;

    level1Node.children.push({ path: level2Path });
  });

  return Array.from(roots.values());
}

/**
 * Flattens a page tree into a simple array of unique paths.
 * @param {Array<{path: string, children: Array<{path: string}>}>} tree - Tree to flatten.
 * @returns {string[]} Flattened list containing level-1 and level-2 paths.
 */
export function flattenPageTreePaths(tree) {
  return tree.flatMap((level1) => [level1.path, ...level1.children.map((child) => child.path)]);
}
