import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/departments.service
 * @description Realtime and CRUD helpers for company departments.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Subscribes to a company's departments list.
 * @param {string} companyId - Company id.
 * @param {Function} callback - Listener receiving normalized department list.
 * @returns {Function} Unsubscribe callback.
 */
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

/**
 * Creates a department for a company.
 * @param {string} companyId - Company id.
 * @param {{name?:string, isActive?:boolean}} [payload={}] - Department creation payload.
 * @returns {Promise<string>} Created department id.
 */
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

/**
 * Updates a department.
 * @param {string} companyId - Company id.
 * @param {string} departmentId - Department id.
 * @param {{name?:string, isActive?:boolean}} [patch={}] - Partial update payload.
 * @returns {Promise<void>} Update completion.
 */
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

/**
 * Removes a department.
 * @param {string} companyId - Company id.
 * @param {string} departmentId - Department id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeCompanyDepartment = async (companyId, departmentId) => {
  if (!companyId || !departmentId) return;
  await remove(ref(database, `companies/${companyId}/departments/${departmentId}`));
};
