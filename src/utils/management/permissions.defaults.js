const DEFAULT_TEAM_SECTIONS = {
  offices: false,
  departments: false,
  members: false,
};

export function buildDefaultPageAccess(pageLeafPaths = []) {
  return Object.fromEntries(pageLeafPaths.map((path) => [path, false]));
}

export function createDefaultPermissions(pageLeafPaths = []) {
  return {
    pageAccess: buildDefaultPageAccess(pageLeafPaths),
    teamSections: { ...DEFAULT_TEAM_SECTIONS },
  };
}

export function cloneDefaultPermissions(pageLeafPaths = []) {
  return createDefaultPermissions(pageLeafPaths);
}
