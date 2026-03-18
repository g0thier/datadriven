import { get, onValue, ref, update } from "firebase/database";
import { database } from "./app";

const MANAGEMENT_ROLES = new Set(["owner", "leader"]);

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const normalizePageAccessList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, isEnabled]) => Boolean(isEnabled))
      .map(([path]) => String(path || "").trim())
      .filter(Boolean);
  }

  return [];
};

const toManagerViewModel = (uid, employeeData = {}, userData = {}) => {
  const firstName = userData.firstName || "";
  const lastName = userData.lastName || "";
  const fullName =
    `${firstName} ${lastName}`.trim() || userData.name || userData.displayName || "";
  const role = employeeData.role || userData.role || "";

  return {
    id: uid,
    firstName,
    lastName,
    name: fullName,
    role,
    email: userData.email || "",
  };
};

export const subscribeCompanyManagers = (companyId, callback) => {
  if (!companyId) {
    callback([]);
    return () => {};
  }

  const employeesRef = ref(database, `companies/${companyId}/employees`);
  let latestSnapshotSeq = 0;

  return onValue(employeesRef, async (snapshot) => {
    latestSnapshotSeq += 1;
    const currentSeq = latestSnapshotSeq;

    const employees = snapshot.val() || {};
    const managerEntries = Object.entries(employees).filter(([, employeeData]) =>
      MANAGEMENT_ROLES.has(normalizeRole(employeeData?.role))
    );

    const managers = await Promise.all(
      managerEntries.map(async ([uid, employeeData]) => {
        const userSnapshot = await get(ref(database, `users/${uid}`));
        const userData = userSnapshot.exists() ? userSnapshot.val() : {};
        return toManagerViewModel(uid, employeeData || {}, userData);
      })
    );

    // Ignore stale async resolutions to prevent older snapshots from overriding newer edits.
    if (currentSeq !== latestSnapshotSeq) return;

    const sortedManagers = managers.sort((a, b) => {
      const left = a.name || a.email || a.id;
      const right = b.name || b.email || b.id;
      return left.localeCompare(right, "fr");
    });

    callback(sortedManagers);
  });
};

export const getCompanyManagerPermissions = async (companyId) => {
  if (!companyId) return {};

  const snapshot = await get(ref(database, `companies/${companyId}/managerPermissions`));
  if (!snapshot.exists()) return {};

  const source = snapshot.val() || {};
  const next = {};

  Object.entries(source).forEach(([userId, value]) => {
    if (!userId) return;
    next[String(userId)] = {
      role: normalizeRole(value?.role),
      pageAccess: normalizePageAccessList(value?.pageAccess),
    };
  });

  return next;
};

export const upsertCompanyManagerPermissions = async (companyId, userId, patch = {}) => {
  if (!companyId || !userId) return;

  const payload = {
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "role")) {
    payload.role = normalizeRole(patch.role);
  }

  if (Object.prototype.hasOwnProperty.call(patch, "pageAccess")) {
    payload.pageAccess = normalizePageAccessList(patch.pageAccess);
  }

  await update(ref(database, `companies/${companyId}/managerPermissions/${userId}`), payload);
};
