import {
  auth,
  addCompanyOffice,
  addCompanyDepartment,
  addCompanyMember,
  getUserCompanyId,
  onAuthStateChangedListener,
  signUpMemberWithEmail,
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

async function requestMemberDeletion(companyId, memberId) {
  const endpoint = resolveFunctionUrl(DELETE_MEMBER_URL, "deleteCompanyMember");
  if (!endpoint) {
    throw new Error("missing_delete_member_url");
  }

  const authHeaders = await resolveAuthHeaders();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      companyId,
      memberId,
    }),
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
function generatePassword(length = 16) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%*_-";

  const mandatory = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const allChars = `${upper}${lower}${numbers}${symbols}`;
  const remaining = Math.max(length - mandatory.length, 0);

  for (let index = 0; index < remaining; index += 1) {
    mandatory.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return mandatory
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function createMember(companyId, payload = {}) {
  if (!companyId) throw new Error("createMember: companyId manquant");

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email) throw new Error("L'email du membre est requis.");

  const generatedPassword = generatePassword();
  const authUser = await signUpMemberWithEmail(email, generatedPassword);

  const memberId = await addCompanyMember(companyId, {
    ...payload,
    uid: authUser.uid,
    email,
    role: payload.role || "colab",
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
  });

  return { id: memberId, generatedPassword };
}

export function editMember(companyId, id, patch) {
  return updateCompanyMember(companyId, id, patch);
}

export async function deleteMember(companyId, id) {
  if (!companyId || !id) return;
  await requestMemberDeletion(companyId, id);
}
