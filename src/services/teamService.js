import {
  addCompanyOffice,
  addCompanyDepartment,
  addCompanyMember,
  getUserCompanyId,
  onAuthStateChangedListener,
  signUpMemberWithEmail,
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

export function deleteMember(companyId, id) {
  return removeCompanyMember(companyId, id);
}
