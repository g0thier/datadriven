import {
  APP_ROLES,
  COLAB_DEFAULT_REDIRECT_PATH,
  COLAB_RESTRICTED_LINKS,
  OVER_CAPACITY_ALLOWED_LINKS,
} from "../constants/routeAccess.js";

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

function normalizeRole(role = "") {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === APP_ROLES.OWNER) return APP_ROLES.OWNER;
  if (normalized === APP_ROLES.LEADER) return APP_ROLES.LEADER;
  if (normalized === APP_ROLES.COLAB) return APP_ROLES.COLAB;
  return APP_ROLES.COLAB;
}

export function normalizePath(path = "") {
  if (typeof path !== "string") return "";

  const sanitized = String(path || "").trim().split(/[?#]/)[0].replace(/\/{2,}/g, "/");
  if (!sanitized.startsWith("/")) return "";

  if (sanitized.length > 1 && sanitized.endsWith("/")) {
    return sanitized.slice(0, -1);
  }

  return sanitized;
}

export function getSectionRootPath(path = "") {
  const normalized = normalizePath(path);
  if (!normalized || normalized === "/") return "";

  const [firstSegment] = normalized.split("/").filter(Boolean);
  return firstSegment ? `/${firstSegment}` : "";
}

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

function canLeaderAccessPath(path, leaderPageAccess = []) {
  const leaderAccessSet = new Set(normalizeLeaderPageAccess(leaderPageAccess));
  return leaderAccessSet.has(path);
}

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
