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

  return {
    id: uid,
    name: fullName,
    role: employeeData.role || userData.role || "",
    email: userData.email || "",
    phone: userData.phone || "",
    departments: userData.departmentIds || employeeData.departmentIds || [],
    office: userData.officeId || employeeData.officeId || null,
  };
};

export const subscribeCompanyMembers = (companyId, callback) => {
  if (!companyId) {
    callback([]);
    return () => {};
  }

  const employeesRef = ref(database, `companies/${companyId}/employees`);

  return onValue(employeesRef, async (snapshot) => {
    const employees = snapshot.val() || {};
    const employeeEntries = Object.entries(employees);

    const members = await Promise.all(
      employeeEntries.map(async ([uid, employeeData]) => {
        const userSnapshot = await get(ref(database, `users/${uid}`));
        const userData = userSnapshot.exists() ? userSnapshot.val() : {};
        return toMemberViewModel(uid, employeeData, userData);
      })
    );

    const sortedMembers = members.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    callback(sortedMembers);
  });
};

export const addCompanyMember = async (companyId, payload = {}) => {
  if (!companyId) throw new Error("addCompanyMember: companyId manquant");

  const now = new Date().toISOString();
  const userRef = push(ref(database, "users"));
  const memberId = userRef.key;

  if (!memberId) throw new Error("Impossible de générer memberId");

  const { firstName, lastName } = splitFullName(payload.name);
  const departments = Array.isArray(payload.departments) ? payload.departments : [];
  const officeId = payload.office || null;
  const role = payload.role || "";

  const updates = {};
  updates[`users/${memberId}`] = {
    firstName,
    lastName,
    name: payload.name || "",
    email: payload.email || "",
    phone: payload.phone || "",
    companyId,
    role,
    officeId,
    departmentIds: departments,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  updates[`companies/${companyId}/employees/${memberId}`] = {
    role,
    officeId,
    departmentIds: departments,
    isActive: true,
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

  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    const { firstName, lastName } = splitFullName(patch.name);
    userPatch.name = patch.name || "";
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

  const updates = {};
  updates[`users/${memberId}`] = userPatch;
  updates[`companies/${companyId}/employees/${memberId}`] = employeePatch;

  await update(ref(database), updates);
};

export const removeCompanyMember = async (companyId, memberId) => {
  if (!companyId || !memberId) return;

  const updates = {};
  updates[`companies/${companyId}/employees/${memberId}`] = null;
  updates[`users/${memberId}`] = null;
  await update(ref(database), updates);
};
