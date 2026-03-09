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
        isActive: typeof data?.isActive === "boolean" ? data.isActive : true,
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.name.localeCompare(b.name, "fr");
      });

    callback(departments);
  });
};

export const addCompanyDepartment = async (companyId, payload = {}) => {
  if (!companyId) throw new Error("addCompanyDepartment: companyId manquant");

  const now = new Date().toISOString();
  const departmentName = (payload.name || "").trim() || "Nouveau département";
  const departmentRef = push(ref(database, `companies/${companyId}/departments`));
  const departmentId = departmentRef.key;

  if (!departmentId) throw new Error("Impossible de générer departmentId");

  await set(departmentRef, {
    name: departmentName,
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
    createdAt: now,
  });

  return departmentId;
};

export const updateCompanyDepartment = async (companyId, departmentId, patch = {}) => {
  if (!companyId || !departmentId) return;

  const payload = {
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    payload.name = patch.name || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "isActive")) {
    payload.isActive = Boolean(patch.isActive);
  }

  await update(ref(database, `companies/${companyId}/departments/${departmentId}`), payload);
};

export const removeCompanyDepartment = async (companyId, departmentId) => {
  if (!companyId || !departmentId) return;
  await remove(ref(database, `companies/${companyId}/departments/${departmentId}`));
};
