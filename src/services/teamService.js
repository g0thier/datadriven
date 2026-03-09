import {
  addCompanyOffice,
  addCompanyDepartment,
  addCompanyMember,
  getUserCompanyId,
  onAuthStateChangedListener,
  removeCompanyMember,
  removeCompanyOffice,
  removeCompanyDepartment,
  subscribeCompanyDepartments,
  subscribeCompanyMembers,
  subscribeCompanyOffices,
  updateCompanyMember,
  updateCompanyDepartment,
  updateCompanyOffice,
} from "../firebase";

// auth
export {
  getUserCompanyId,
  onAuthStateChangedListener,
};

// subscriptions
export function watchCompanyOffices(companyId, callback) {
  if (!companyId) return () => {};
  return subscribeCompanyOffices(companyId, callback);
}

export function watchCompanyDepartments(companyId, callback) {
  if (!companyId) return () => {};
  return subscribeCompanyDepartments(companyId, callback);
}

export function watchCompanyMembers(companyId, callback) {
  if (!companyId) return () => {};
  return subscribeCompanyMembers(companyId, callback);
}

// offices
export function createOffice(companyId) {
  return addCompanyOffice(companyId, {
    alias: "",
    address: "",
    city: "",
    zip: "",
    country: "",
  });
}

export function editOffice(companyId, id, patch) {
  return updateCompanyOffice(companyId, id, patch);
}

export function deleteOffice(companyId, id) {
  return removeCompanyOffice(companyId, id);
}

// departments
export function createDepartment(companyId) {
  return addCompanyDepartment(companyId, { name: "" });
}

export function editDepartment(companyId, id, patch) {
  return updateCompanyDepartment(companyId, id, patch);
}

export function deleteDepartment(companyId, id) {
  return removeCompanyDepartment(companyId, id);
}

// members
export function createMember(companyId) {
  return addCompanyMember(companyId, {
    name: "",
    role: "",
    email: "",
    phone: "",
    departments: [],
    office: null,
  });
}

export function editMember(companyId, id, patch) {
  return updateCompanyMember(companyId, id, patch);
}

export function deleteMember(companyId, id) {
  return removeCompanyMember(companyId, id);
}
