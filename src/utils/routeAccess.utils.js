import {
  APP_ROLES,
  COLAB_DEFAULT_REDIRECT_PATH,
  COLAB_RESTRICTED_LINKS,
} from "../constants/routeAccess.js";

const COLAB_RESTRICTED_SET = new Set(
  (COLAB_RESTRICTED_LINKS || [])
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

export function isRouteAllowedForRole({
  role,
  path,
  leaderPageAccess = [],
}) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) return false;

  const normalizedRole = normalizeRole(role);
  if (normalizedRole === APP_ROLES.OWNER) return true;

  const isAllowedForColab = !COLAB_RESTRICTED_SET.has(normalizedPath);
  if (normalizedRole !== APP_ROLES.LEADER) {
    return isAllowedForColab;
  }

  if (isAllowedForColab) return true;

  const leaderAccessSet = new Set(normalizeLeaderPageAccess(leaderPageAccess));
  return leaderAccessSet.has(normalizedPath);
}

export function resolveFirstAllowedPath({
  candidatePaths = [],
  role,
  leaderPageAccess = [],
  fallbackPath = COLAB_DEFAULT_REDIRECT_PATH,
}) {
  const normalizedFallback = normalizePath(fallbackPath) || COLAB_DEFAULT_REDIRECT_PATH;
  const normalizedCandidates = normalizePathList(candidatePaths);

  for (const candidatePath of normalizedCandidates) {
    if (isRouteAllowedForRole({ role, path: candidatePath, leaderPageAccess })) {
      return candidatePath;
    }
  }

  return normalizedFallback;
}

export function resolveAuthorizedTargetPath({
  targetPath,
  role,
  leaderPageAccess = [],
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
    })
  ) {
    return normalizedTargetPath;
  }

  return resolveFirstAllowedPath({
    candidatePaths,
    role,
    leaderPageAccess,
    fallbackPath,
  });
}
