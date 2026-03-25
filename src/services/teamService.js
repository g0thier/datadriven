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

/**
 * @module services/teamService
 * @description Service layer for team management (offices, departments, members) and protected function calls.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTION_REGION;
const CREATE_MEMBER_URL = import.meta.env.VITE_CREATE_COMPANY_MEMBER_URL;
const DELETE_MEMBER_URL = import.meta.env.VITE_DELETE_COMPANY_MEMBER_URL;

/**
 * Builds a default callable HTTPS function URL using Firebase project and region env vars.
 * @param {string} functionName - Target function name.
 * @returns {string} Function URL, or empty string when config is missing.
 */
function buildDefaultFunctionUrl(functionName) {
  const projectId = String(FIREBASE_PROJECT_ID || "").trim();
  const region = String(FIREBASE_FUNCTION_REGION || "").trim();
  if (!projectId || !region) return "";
  return `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
}

/**
 * Resolves a function URL from env override, or builds a default one.
 * @param {string} envUrl - Explicit endpoint URL from env.
 * @param {string} functionName - Function name used for fallback URL.
 * @returns {string} Resolved endpoint URL.
 */
function resolveFunctionUrl(envUrl, functionName) {
  const candidateUrl = String(envUrl || "").trim();
  if (candidateUrl) return candidateUrl;
  return buildDefaultFunctionUrl(functionName);
}

/**
 * Builds bearer authorization headers from the current Firebase user token.
 * @returns {Promise<{Authorization:string}>} Authorization headers.
 * @throws {Error} When no authenticated user/token is available.
 */
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

/**
 * Calls a protected HTTPS Cloud Function endpoint with a JSON payload.
 * @param {string} functionName - Logical function name for fallback URL and errors.
 * @param {string} envUrl - Optional env override for endpoint URL.
 * @param {Object} [payload={}] - Request body payload.
 * @returns {Promise<Object>} Parsed JSON response payload.
 * @throws {Error} When endpoint is missing or the function returns an error.
 */
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

/**
 * Requests member creation through the backend function.
 * @param {string} companyId - Company identifier.
 * @param {Object} [payload={}] - Member creation payload.
 * @returns {Promise<Object>} Function response payload.
 */
async function requestMemberCreation(companyId, payload = {}) {
  return postProtectedFunction("createCompanyMember", CREATE_MEMBER_URL, {
    companyId,
    payload,
  });
}

/**
 * Requests member deletion through the backend function.
 * @param {string} companyId - Company identifier.
 * @param {string} memberId - Member identifier.
 * @returns {Promise<Object>} Function response payload.
 */
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
/**
 * Subscribes to company offices updates.
 * @param {string} companyId - Company identifier.
 * @param {Function} callback - Listener invoked with offices updates.
 * @returns {Function} Unsubscribe callback.
 */
export function watchCompanyOffices(companyId, callback) {
  if (!companyId) return () => {};
  return subscribeCompanyOffices(companyId, callback);
}

/**
 * Subscribes to company departments updates.
 * @param {string} companyId - Company identifier.
 * @param {Function} callback - Listener invoked with departments updates.
 * @returns {Function} Unsubscribe callback.
 */
export function watchCompanyDepartments(companyId, callback) {
  if (!companyId) return () => {};
  return subscribeCompanyDepartments(companyId, callback);
}

/**
 * Subscribes to company members updates.
 * @param {string} companyId - Company identifier.
 * @param {Function} callback - Listener invoked with members updates.
 * @returns {Function} Unsubscribe callback.
 */
export function watchCompanyMembers(companyId, callback) {
  if (!companyId) return () => {};
  return subscribeCompanyMembers(companyId, callback);
}

// offices
/**
 * Creates an empty office record with default fields.
 * @param {string} companyId - Company identifier.
 * @returns {Promise<Object>} Created office record.
 */
export function createOffice(companyId) {
  return addCompanyOffice(companyId, {
    alias: "",
    address: "",
    city: "",
    zip: "",
    country: "",
  });
}

/**
 * Updates an existing office record.
 * @param {string} companyId - Company identifier.
 * @param {string} id - Office identifier.
 * @param {Object} patch - Partial office fields to update.
 * @returns {Promise<void>} Update operation result.
 */
export function editOffice(companyId, id, patch) {
  return updateCompanyOffice(companyId, id, patch);
}

/**
 * Deletes an office record.
 * @param {string} companyId - Company identifier.
 * @param {string} id - Office identifier.
 * @returns {Promise<void>} Delete operation result.
 */
export function deleteOffice(companyId, id) {
  return removeCompanyOffice(companyId, id);
}

// departments
/**
 * Creates a department with default values.
 * @param {string} companyId - Company identifier.
 * @returns {Promise<Object>} Created department record.
 */
export function createDepartment(companyId) {
  return addCompanyDepartment(companyId, { name: "Nouveau département", isActive: true });
}

/**
 * Updates an existing department record.
 * @param {string} companyId - Company identifier.
 * @param {string} id - Department identifier.
 * @param {Object} patch - Partial department fields to update.
 * @returns {Promise<void>} Update operation result.
 */
export function editDepartment(companyId, id, patch) {
  return updateCompanyDepartment(companyId, id, patch);
}

/**
 * Deletes a department record.
 * @param {string} companyId - Company identifier.
 * @param {string} id - Department identifier.
 * @returns {Promise<void>} Delete operation result.
 */
export function deleteDepartment(companyId, id) {
  return removeCompanyDepartment(companyId, id);
}

// members
/**
 * Creates a member through the protected backend function.
 * @param {string} companyId - Company identifier.
 * @param {Object} [payload={}] - Member creation payload.
 * @returns {Promise<Object>} Function response payload.
 * @throws {Error} When `companyId` is missing.
 */
export async function createMember(companyId, payload = {}) {
  if (!companyId) throw new Error("createMember: companyId manquant");
  return requestMemberCreation(companyId, payload);
}

/**
 * Updates an existing member record.
 * @param {string} companyId - Company identifier.
 * @param {string} id - Member identifier.
 * @param {Object} patch - Partial member fields to update.
 * @returns {Promise<void>} Update operation result.
 */
export function editMember(companyId, id, patch) {
  return updateCompanyMember(companyId, id, patch);
}

/**
 * Deletes a member through the protected backend function.
 * @param {string} companyId - Company identifier.
 * @param {string} id - Member identifier.
 * @returns {Promise<void>} Nothing when inputs are missing, otherwise deletion result.
 */
export async function deleteMember(companyId, id) {
  if (!companyId || !id) return;
  await requestMemberDeletion(companyId, id);
}
