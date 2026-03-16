function getManagerPermissionId(manager, index) {
  return manager?.id ?? manager?._id ?? manager?.uid ?? manager?.email ?? `manager-${index}`;
}

function getManagerDisplayName(manager) {
  const fullName = [manager?.firstName, manager?.lastName].filter(Boolean).join(" ").trim();
  return manager?.name || manager?.fullName || fullName || "Manager";
}

function getManagerLabel(manager) {
  const role = manager?.role || manager?.jobTitle || "Manager";
  const email = manager?.email || manager?.mail || "";

  return {
    title: getManagerDisplayName(manager),
    subtitle: email ? `${role} • ${email}` : role,
  };
}

export function buildManagerList(list) {
  const source = Array.isArray(list) ? list : [];

  return source.map((manager, index) => ({
    ...manager,
    permissionId: String(getManagerPermissionId(manager, index)),
    label: getManagerLabel(manager),
  }));
}
