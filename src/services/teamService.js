import {
  auth,
  addCompanyOffice,
  addCompanyDepartment,
  getUserCompanyId,
  onAuthStateChangedListener,
  removeCompanyOffice,
  removeCompanyDepartment,
  subscribeCompanyDepartments,
  subscribeCompanyMembers,
  subscribeCompanyOffices,
  updateCompanyMember,
  updateCompanyDepartment,
  updateCompanyOffice,
} from "../firebase";

const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTION_REGION;
const CREATE_MEMBER_URL = import.meta.env.VITE_CREATE_COMPANY_MEMBER_URL;
const DELETE_MEMBER_URL = import.meta.env.VITE_DELETE_COMPANY_MEMBER_URL;

function buildDefaultFunctionUrl(functionName) {
  const projectId = String(FIREBASE_PROJECT_ID || "").trim();
  const region = String(FIREBASE_FUNCTION_REGION || "").trim();
  if (!projectId || !region) return "";
  return `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
}

function resolveFunctionUrl(envUrl, functionName) {
  const candidateUrl = String(envUrl || "").trim();
  if (candidateUrl) return candidateUrl;
  return buildDefaultFunctionUrl(functionName);
}

async function resolveAuthHeaders() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("auth_required");
  }

  const idToken = await currentUser.getIdToken();
  const normalizedToken = String(idToken || "").trim();

  if (!normalizedToken) {
    throw new Error("auth_required");
  }

  return {
    Authorization: `Bearer ${normalizedToken}`,
  };
}

async function postProtectedFunction(functionName, envUrl, payload = {}) {
  const endpoint = resolveFunctionUrl(envUrl, functionName);
  if (!endpoint) {
    throw new Error(`missing_${functionName}_url`);
  }

  const authHeaders = await resolveAuthHeaders();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorCode = String(body?.error || "").trim();
    const error = new Error(errorCode || `HTTP ${response.status}`);
    if (errorCode) {
      error.code = errorCode;
    }
    throw error;
  }

  return body || {};
}

async function requestMemberCreation(companyId, payload = {}) {
  return postProtectedFunction("createCompanyMember", CREATE_MEMBER_URL, {
    companyId,
    payload,
  });
}

async function requestMemberDeletion(companyId, memberId) {
  return postProtectedFunction("deleteCompanyMember", DELETE_MEMBER_URL, {
    companyId,
    memberId,
  });
}

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
  return addCompanyDepartment(companyId, { name: "Nouveau département", isActive: true });
}

export function editDepartment(companyId, id, patch) {
  return updateCompanyDepartment(companyId, id, patch);
}

export function deleteDepartment(companyId, id) {
  return removeCompanyDepartment(companyId, id);
}

// members
export async function createMember(companyId, payload = {}) {
  if (!companyId) throw new Error("createMember: companyId manquant");
  return requestMemberCreation(companyId, payload);
}

export function editMember(companyId, id, patch) {
  return updateCompanyMember(companyId, id, patch);
}

export async function deleteMember(companyId, id) {
  if (!companyId || !id) return;
  await requestMemberDeletion(companyId, id);
}
