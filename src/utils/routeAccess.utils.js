import {
  APP_ROLES,
  COLAB_DEFAULT_REDIRECT_PATH,
  COLAB_RESTRICTED_LINKS,
  OVER_CAPACITY_ALLOWED_LINKS,
} from "../constants/routeAccess.js";

/**
 * @module utils/routeAccess
 * @description Role-based route authorization helpers with over-capacity logic.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const COLAB_RESTRICTED_SET = new Set(
  (COLAB_RESTRICTED_LINKS || [])
    .map((path) => normalizePath(path))
    .filter(Boolean)
);

const OVER_CAPACITY_ALLOWED_SET = new Set(
  (OVER_CAPACITY_ALLOWED_LINKS || [])
    .map((path) => normalizePath(path))
    .filter(Boolean)
);

/**
 * Normalizes a role name to one of the known application roles.
 * @param {string} [role=""] - Raw role value.
 * @returns {string} Normalized role key.
 */
function normalizeRole(role = "") {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === APP_ROLES.OWNER) return APP_ROLES.OWNER;
  if (normalized === APP_ROLES.LEADER) return APP_ROLES.LEADER;
  if (normalized === APP_ROLES.COLAB) return APP_ROLES.COLAB;
  return APP_ROLES.COLAB;
}

/**
 * Normalizes a route path by removing query/hash and trailing slash.
 * @param {string} [path=""] - Raw path.
 * @returns {string} Normalized absolute path or empty string.
 */
export function normalizePath(path = "") {
  if (typeof path !== "string") return "";

  const sanitized = String(path || "").trim().split(/[?#]/)[0].replace(/\/{2,}/g, "/");
  if (!sanitized.startsWith("/")) return "";

  if (sanitized.length > 1 && sanitized.endsWith("/")) {
    return sanitized.slice(0, -1);
  }

  return sanitized;
}

/**
 * Extracts the first-level section root from a path.
 * @param {string} [path=""] - Route path.
 * @returns {string} Section root path or empty string.
 */
export function getSectionRootPath(path = "") {
  const normalized = normalizePath(path);
  if (!normalized || normalized === "/") return "";

  const [firstSegment] = normalized.split("/").filter(Boolean);
  return firstSegment ? `/${firstSegment}` : "";
}

/**
 * Normalizes, deduplicates and filters a list of paths.
 * @param {string[]} [paths=[]] - Candidate paths.
 * @returns {string[]} Unique normalized paths.
 */
export function normalizePathList(paths = []) {
  const source = Array.isArray(paths) ? paths : [];
  const seen = new Set();
  const next = [];

  source.forEach((path) => {
    const normalizedPath = normalizePath(path);
    if (!normalizedPath || seen.has(normalizedPath)) return;
    seen.add(normalizedPath);
    next.push(normalizedPath);
  });

  return next;
}

/**
 * Normalizes leader page access from an array or map object.
 * @param {string[]|Object<string, boolean>} value - Access configuration.
 * @returns {string[]} Normalized allowed paths.
 */
export function normalizeLeaderPageAccess(value) {
  if (Array.isArray(value)) {
    return normalizePathList(value);
  }

  if (value && typeof value === "object") {
    const enabledPaths = Object.entries(value)
      .filter(([, isEnabled]) => Boolean(isEnabled))
      .map(([path]) => path);
    return normalizePathList(enabledPaths);
  }

  return [];
}

/**
 * Checks if a leader can access a path according to explicit permissions.
 * @param {string} path - Target path.
 * @param {string[]|Object<string, boolean>} [leaderPageAccess=[]] - Leader page access config.
 * @returns {boolean} Whether access is granted.
 */
function canLeaderAccessPath(path, leaderPageAccess = []) {
  const leaderAccessSet = new Set(normalizeLeaderPageAccess(leaderPageAccess));
  return leaderAccessSet.has(path);
}

/**
 * Evaluates route access for a given role and subscription capacity state.
 * @param {Object} params - Access check inputs.
 * @param {string} params.role - User role.
 * @param {string} params.path - Target path.
 * @param {string[]|Object<string, boolean>} [params.leaderPageAccess=[]] - Leader page access config.
 * @param {boolean} [params.isSubscriptionOverCapacity=false] - Whether the company is over capacity.
 * @returns {boolean} Whether route access is allowed.
 */
export function isRouteAllowedForRole({
  role,
  path,
  leaderPageAccess = [],
  isSubscriptionOverCapacity = false,
}) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) return false;

  const normalizedRole = normalizeRole(role);
  const isAllowedForColab = !COLAB_RESTRICTED_SET.has(normalizedPath);

  if (!isSubscriptionOverCapacity) {
    if (normalizedRole === APP_ROLES.OWNER) return true;

    if (normalizedRole !== APP_ROLES.LEADER) {
      return isAllowedForColab;
    }

    if (isAllowedForColab) return true;

    return canLeaderAccessPath(normalizedPath, leaderPageAccess);
  }

  if (normalizedRole === APP_ROLES.COLAB) return isAllowedForColab;
  if (isAllowedForColab) return true;
  if (!OVER_CAPACITY_ALLOWED_SET.has(normalizedPath)) return false;
  if (normalizedRole === APP_ROLES.OWNER) return true;

  return canLeaderAccessPath(normalizedPath, leaderPageAccess);
}

/**
 * Returns the first allowed path from candidates, otherwise a fallback path.
 * @param {Object} params - Resolution inputs.
 * @param {string[]} [params.candidatePaths=[]] - Candidate destination paths.
 * @param {string} params.role - User role.
 * @param {string[]|Object<string, boolean>} [params.leaderPageAccess=[]] - Leader page access config.
 * @param {boolean} [params.isSubscriptionOverCapacity=false] - Whether the company is over capacity.
 * @param {string} [params.fallbackPath=COLAB_DEFAULT_REDIRECT_PATH] - Fallback path.
 * @returns {string} First authorized route.
 */
export function resolveFirstAllowedPath({
  candidatePaths = [],
  role,
  leaderPageAccess = [],
  isSubscriptionOverCapacity = false,
  fallbackPath = COLAB_DEFAULT_REDIRECT_PATH,
}) {
  const normalizedFallback = normalizePath(fallbackPath) || COLAB_DEFAULT_REDIRECT_PATH;
  const normalizedCandidates = normalizePathList(candidatePaths);

  for (const candidatePath of normalizedCandidates) {
    if (
      isRouteAllowedForRole({
        role,
        path: candidatePath,
        leaderPageAccess,
        isSubscriptionOverCapacity,
      })
    ) {
      return candidatePath;
    }
  }

  return normalizedFallback;
}

/**
 * Resolves an authorized navigation target from a preferred target and fallbacks.
 * @param {Object} params - Resolution inputs.
 * @param {string} params.targetPath - Preferred target path.
 * @param {string} params.role - User role.
 * @param {string[]|Object<string, boolean>} [params.leaderPageAccess=[]] - Leader page access config.
 * @param {boolean} [params.isSubscriptionOverCapacity=false] - Whether the company is over capacity.
 * @param {string[]} [params.candidatePaths=[]] - Candidate fallback paths.
 * @param {string} [params.fallbackPath=COLAB_DEFAULT_REDIRECT_PATH] - Final fallback path.
 * @returns {string} Authorized target path.
 */
export function resolveAuthorizedTargetPath({
  targetPath,
  role,
  leaderPageAccess = [],
  isSubscriptionOverCapacity = false,
  candidatePaths = [],
  fallbackPath = COLAB_DEFAULT_REDIRECT_PATH,
}) {
  const normalizedTargetPath = normalizePath(targetPath);
  if (
    normalizedTargetPath &&
    isRouteAllowedForRole({
      role,
      path: normalizedTargetPath,
      leaderPageAccess,
      isSubscriptionOverCapacity,
    })
  ) {
    return normalizedTargetPath;
  }

  return resolveFirstAllowedPath({
    candidatePaths,
    role,
    leaderPageAccess,
    isSubscriptionOverCapacity,
    fallbackPath,
  });
}
