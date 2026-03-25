import { get, onValue, ref, update } from "firebase/database";
import { database } from "./app";

/**
 * @module firebase/management.service
 * @description Management helpers for leaders/owners and manager permissions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const MANAGEMENT_ROLES = new Set(["owner", "leader"]);

/**
 * Normalizes a role string.
 * @param {string} role - Raw role.
 * @returns {string} Normalized role.
 */
const normalizeRole = (role) => String(role || "").trim().toLowerCase();

/**
 * Normalizes page-access values from array or map format.
 * @param {string[]|Object<string, boolean>} value - Page access configuration.
 * @returns {string[]} Enabled and normalized paths.
 */
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

/**
 * Maps employee/user records to a normalized manager view model.
 * @param {string} uid - Manager user id.
 * @param {Object} [employeeData={}] - Employee data from company node.
 * @param {Object} [userData={}] - User profile data.
 * @returns {Object} Normalized manager.
 */
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

/**
 * Subscribes to owner/leader members for a company.
 * @param {string} companyId - Company id.
 * @param {Function} callback - Listener receiving managers list.
 * @returns {Function} Unsubscribe callback.
 */
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

/**
 * Reads persisted manager permissions for a company.
 * @param {string} companyId - Company id.
 * @returns {Promise<Object<string, {role:string, pageAccess:string[]}>>} Permissions by user id.
 */
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

/**
 * Creates or updates manager permission data for a user.
 * @param {string} companyId - Company id.
 * @param {string} userId - Manager user id.
 * @param {{role?:string, pageAccess?:string[]|Object<string, boolean>}} [patch={}] - Permissions patch.
 * @returns {Promise<void>} Update completion.
 */
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
