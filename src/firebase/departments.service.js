import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "./app";

export const subscribeCompanyDepartments = (companyId, callback) => {
  if (!companyId) {
    callback([]);
    return () => {};
  }

  const departmentsRef = ref(database, `companies/${companyId}/departments`);
  return onValue(departmentsRef, (snapshot) => {
    const rawDepartments = snapshot.val() || {};
    const departments = Object.entries(rawDepartments)
      .map(([id, data]) => ({
        id,
        name: data?.name || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    callback(departments);
  });
};

export const addCompanyDepartment = async (companyId, payload = {}) => {
  if (!companyId) throw new Error("addCompanyDepartment: companyId manquant");

  const now = new Date().toISOString();
  const departmentRef = push(ref(database, `companies/${companyId}/departments`));
  const departmentId = departmentRef.key;

  if (!departmentId) throw new Error("Impossible de générer departmentId");

  await set(departmentRef, {
    name: payload.name || "",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  return departmentId;
};

export const updateCompanyDepartment = async (companyId, departmentId, patch = {}) => {
  if (!companyId || !departmentId) return;

  await update(ref(database, `companies/${companyId}/departments/${departmentId}`), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
};

export const removeCompanyDepartment = async (companyId, departmentId) => {
  if (!companyId || !departmentId) return;
  await remove(ref(database, `companies/${companyId}/departments/${departmentId}`));
};
