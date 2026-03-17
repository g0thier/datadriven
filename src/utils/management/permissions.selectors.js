export function getLevel1TargetPaths(level1) {
  return level1.children.length > 0
    ? level1.children.map((level2) => level2.path)
    : [level1.path];
}

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

export function getTotalLevel2PagesCount(pageTree) {
  return pageTree.reduce((sum, level1) => sum + level1.children.length, 0);
}

export function getSelectedDepartments(pageTree, pageAccess) {
  return pageTree
    .filter((level1) => getLevel1SelectionState(level1, pageAccess).hasAny)
    .map((level1) => level1.path);
}

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

export function isOwnerProfile(manager) {
  return String(manager?.role || "").trim().toLowerCase() === "owner";
}
