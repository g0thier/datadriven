import { get, onValue, push, ref, update } from "firebase/database";
import { database } from "./app";

const splitFullName = (name = "") => {
  const value = String(name || "").trim();
  if (!value) return { firstName: "", lastName: "" };

  const parts = value.split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
};

const toMemberViewModel = (uid, employeeData = {}, userData = {}) => {
  const firstName = userData.firstName || "";
  const lastName = userData.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || userData.name || "";
  const resolvedRole = employeeData.role || userData.role || "colab";

  return {
    id: uid,
    firstName,
    lastName,
    name: fullName,
    role: resolvedRole,
    email: userData.email || "",
    phone: userData.phone || "",
    departments: userData.departmentIds || employeeData.departmentIds || [],
    office: userData.officeId || employeeData.officeId || null,
    isActive:
      typeof userData.isActive === "boolean"
        ? userData.isActive
        : typeof employeeData.isActive === "boolean"
          ? employeeData.isActive
          : true,
  };
};

export const subscribeCompanyMembers = (companyId, callback) => {
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
    const employeeEntries = Object.entries(employees);

    const members = await Promise.all(
      employeeEntries.map(async ([uid, employeeData]) => {
        const userSnapshot = await get(ref(database, `users/${uid}`));
        const userData = userSnapshot.exists() ? userSnapshot.val() : {};
        return toMemberViewModel(uid, employeeData, userData);
      })
    );

    // Ignore stale async resolutions to prevent older snapshots from overriding newer edits.
    if (currentSeq !== latestSnapshotSeq) return;

    const sortedMembers = members.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    callback(sortedMembers);
  });
};

export const addCompanyMember = async (companyId, payload = {}) => {
  if (!companyId) throw new Error("addCompanyMember: companyId manquant");

  const now = new Date().toISOString();
  const memberIdFromPayload =
    typeof payload.uid === "string" && payload.uid.trim().length > 0 ? payload.uid.trim() : null;
  const userRef = memberIdFromPayload ? null : push(ref(database, "users"));
  const memberId = memberIdFromPayload || userRef?.key;

  if (!memberId) throw new Error("Impossible de générer memberId");

  const resolvedFirstName =
    typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const resolvedLastName =
    typeof payload.lastName === "string" ? payload.lastName.trim() : "";
  const fallbackName = splitFullName(payload.name || "");
  const firstName = resolvedFirstName || fallbackName.firstName;
  const lastName = resolvedLastName || fallbackName.lastName;
  const departments = Array.isArray(payload.departments) ? payload.departments : [];
  const officeId = payload.office || null;
  const role = payload.role || "colab";
  const isActive = typeof payload.isActive === "boolean" ? payload.isActive : true;

  const updates = {};
  updates[`users/${memberId}`] = {
    firstName,
    lastName,
    email: payload.email || "",
    phone: payload.phone || "",
    companyId,
    role,
    officeId,
    departmentIds: departments,
    isActive,
    createdAt: now,
    updatedAt: now,
  };

  updates[`companies/${companyId}/employees/${memberId}`] = {
    role,
    officeId,
    departmentIds: departments,
    isActive,
    joinedAt: now,
    updatedAt: now,
  };

  await update(ref(database), updates);
  return memberId;
};

export const updateCompanyMember = async (companyId, memberId, patch = {}) => {
  if (!companyId || !memberId) return;

  const now = new Date().toISOString();
  const userPatch = { updatedAt: now };
  const employeePatch = { updatedAt: now };

  if (Object.prototype.hasOwnProperty.call(patch, "firstName")) {
    userPatch.firstName = patch.firstName || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "lastName")) {
    userPatch.lastName = patch.lastName || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    const { firstName, lastName } = splitFullName(patch.name);
    userPatch.firstName = firstName;
    userPatch.lastName = lastName;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "email")) userPatch.email = patch.email || "";
  if (Object.prototype.hasOwnProperty.call(patch, "phone")) userPatch.phone = patch.phone || "";
  if (Object.prototype.hasOwnProperty.call(patch, "office")) {
    userPatch.officeId = patch.office || null;
    employeePatch.officeId = patch.office || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "departments")) {
    const departments = Array.isArray(patch.departments) ? patch.departments : [];
    userPatch.departmentIds = departments;
    employeePatch.departmentIds = departments;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "role")) {
    userPatch.role = patch.role || "";
    employeePatch.role = patch.role || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "isActive")) {
    const isActive = Boolean(patch.isActive);
    userPatch.isActive = isActive;
    employeePatch.isActive = isActive;
  }

  await Promise.all([
    update(ref(database, `users/${memberId}`), userPatch),
    update(ref(database, `companies/${companyId}/employees/${memberId}`), employeePatch),
  ]);
};

export const removeCompanyMember = async (companyId, memberId) => {
  if (!companyId || !memberId) return;

  const updates = {};
  updates[`companies/${companyId}/employees/${memberId}`] = null;
  updates[`users/${memberId}`] = null;
  await update(ref(database), updates);
};
