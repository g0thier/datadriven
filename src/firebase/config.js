// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import slugify from "../utils/string";
import DEFAULT_DEPARTMENTS from "../constants/defaults";

// Import Authentication and Database functions
import { 
    getAuth, 
    // GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged, 
    // signInWithPopup, 
    signOut } from "firebase/auth";
import { getDatabase, ref, set, update, push, get, onValue, remove } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and Database instances
export const auth = getAuth(app);
export const database = getDatabase(app);


/**
 * @module firebase/config
 * @description Firebase configuration and utility functions for authentication and database operations.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 * @see
 */

/**
 * Sign up a new user with email and password
 * @param {*} email 
 * @param {*} password 
 * @returns 
 */
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User signed up successfully!", user);
    return user;
  } catch (error) {
    console.error("Signup failed:", error.code, error.message);
    throw error;
  }
};

/**
 * Sign in a user with email and password
 * @param {*} email 
 * @param {*} password 
 * @returns 
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User logged in successfully!", user);
    return user;
  } catch (error) {
    console.error("Login failed:", error.code, error.message);
    throw error;
  }
};

/* Logging in with Google
export const login = async () => {
    const provider = new GoogleAuthProvider();
    const  result = await signInWithPopup(auth, provider);
    console.log('User info', result);
} */

/**
 * Logging out the current user
 * @returns 
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully!');
  } catch (error) {
    console.error('Logout failed:', error.code, error.message);
    throw error;
  };
};

/**
 * Sending password reset email
 * @param {*} email 
 * @returns 
 */
export const resetPassword = async (email) => {
   await sendPasswordResetEmail(auth, email)
    .then(() => {
        // E-mail de réinitialisation envoyé avec succès !
        console.log("E-mail de réinitialisation envoyé.");
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // Gérer les erreurs ici (ex: utilisateur non trouvé)
        console.error("Erreur :", errorCode, errorMessage);
    });
};

/**
 * Listening to auth state changes
 * @param {function} callback Callback function to handle auth state changes
 * @returns {function} Unsubscribe function to stop listening
 */
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Database functions

/**
 * Creates a new company in the database
 * @param {*} uid UID of the user creating the company
 * @param {*} payload Payload containing company and admin information
 * @returns {Promise<{companyId: string, slug: string}>} The created company's ID and slug
 */
export const createCompany = async (uid, payload) => {
  if (!uid) {
    throw new Error("createCompany: uid manquant");
  }

  const db = database;
  const now = new Date().toISOString();

  // Création de la société
  const companyRef = push(ref(db, "companies"));
  const companyId = companyRef.key;

  if (!companyId) {
    throw new Error("Impossible de générer companyId");
  }

  const slug = `${slugify(payload.company.name)}-${companyId.slice(-6)}`;

  // Normalisation des adresses
  const addressesInput = Array.isArray(payload.company.addresses)
    ? payload.company.addresses
    : [];

  const addresses = {};
  addressesInput.forEach((item) => {
    const addressRef = push(ref(db, `companies/${companyId}/addresses`));
    const addressId = addressRef.key;

    if (!addressId) return;

    addresses[addressId] = {
      alias: item.alias || "",
      address: item.address || "",
      city: item.city || "",
      zip: item.zip || "",
      country: item.country || "",
      isDefault: Boolean(item.isDefault),
      createdAt: now,
    };
  });

  // Assurer qu'il y a une adresse par défaut
  const addressIds = Object.keys(addresses);
  if (addressIds.length > 0 && !addressIds.some((id) => addresses[id].isDefault)) {
    addresses[addressIds[0]].isDefault = true;
  }

  // Normalisation des départements
  const departmentsInput =
    Array.isArray(payload.company.departments) && payload.company.departments.length > 0
      ? payload.company.departments
      : DEFAULT_DEPARTMENTS;

  const departments = {};
  departmentsInput.forEach((name) => {
    const departmentSlug = slugify(name);
    departments[departmentSlug] = {
      name,
      slug: departmentSlug,
      isActive: true,
      createdAt: now,
    };
  });

  const updates = {};

  updates[`users/${uid}`] = {
    email: payload.admin.email,
    firstName: payload.admin.firstName,
    lastName: payload.admin.lastName,
    phone: payload.admin.phone || "",
    companyId,
    role: "owner",
    isActive: true,
    createdAt: now,
  };

  updates[`companies/${companyId}`] = {
    name: payload.company.name,
    slug,
    legalForm: payload.company.legalForm || "",
    siret: payload.company.siret || "",
    vatNumber: payload.company.vatNumber || "",
    ownerUid: uid,
    plan: "free",
    status: "active",
    acceptTerms: payload.acceptTerms,
    createdAt: now,
    addresses,
    departments,
    employees: {
      [uid]: {
        role: "owner",
        isActive: true,
        joinedAt: now,
      },
    },
  };

  await update(ref(db), updates);

  return { companyId, slug };
};

/**
 * Returns the companyId associated to the authenticated user profile.
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
export const getUserCompanyId = async (uid) => {
  if (!uid) return null;
  const snapshot = await get(ref(database, `users/${uid}/companyId`));
  return snapshot.exists() ? snapshot.val() : null;
};

/**
 * Subscribes to company departments in Realtime Database.
 * @param {string} companyId
 * @param {(departments: Array<{id: string, name: string}>) => void} callback
 * @returns {() => void}
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
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    callback(departments);
  });
};

/**
 * Creates a new department for a company.
 * @param {string} companyId
 * @param {{name?: string}} payload
 * @returns {Promise<string>} departmentId
 */
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

/**
 * Updates an existing department.
 * @param {string} companyId
 * @param {string} departmentId
 * @param {Record<string, unknown>} patch
 */
export const updateCompanyDepartment = async (companyId, departmentId, patch = {}) => {
  if (!companyId || !departmentId) return;

  await update(ref(database, `companies/${companyId}/departments/${departmentId}`), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Removes a company department.
 * @param {string} companyId
 * @param {string} departmentId
 */
export const removeCompanyDepartment = async (companyId, departmentId) => {
  if (!companyId || !departmentId) return;
  await remove(ref(database, `companies/${companyId}/departments/${departmentId}`));
};

/**
 * Subscribes to company offices (addresses) in Realtime Database.
 * @param {string} companyId
 * @param {(offices: Array<{id: string, name: string, address: string}>) => void} callback
 * @returns {() => void}
 */
export const subscribeCompanyOffices = (companyId, callback) => {
  if (!companyId) {
    callback([]);
    return () => {};
  }

  const addressesRef = ref(database, `companies/${companyId}/addresses`);
  return onValue(addressesRef, (snapshot) => {
    const rawAddresses = snapshot.val() || {};
    const offices = Object.entries(rawAddresses)
      .map(([id, data]) => ({
        id,
        name: data?.alias || "",
        address: data?.address || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    callback(offices);
  });
};

/**
 * Creates a new office as an address entry for a company.
 * @param {string} companyId
 * @param {{name?: string, address?: string}} payload
 * @returns {Promise<string>} officeId
 */
export const addCompanyOffice = async (companyId, payload = {}) => {
  if (!companyId) throw new Error("addCompanyOffice: companyId manquant");

  const now = new Date().toISOString();
  const officeRef = push(ref(database, `companies/${companyId}/addresses`));
  const officeId = officeRef.key;

  if (!officeId) throw new Error("Impossible de générer officeId");

  await set(officeRef, {
    alias: payload.name || "",
    address: payload.address || "",
    city: "",
    zip: "",
    country: "",
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  return officeId;
};

/**
 * Updates an existing office.
 * @param {string} companyId
 * @param {string} officeId
 * @param {{name?: string, address?: string}} patch
 */
export const updateCompanyOffice = async (companyId, officeId, patch = {}) => {
  if (!companyId || !officeId) return;

  const payload = {
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    payload.alias = patch.name;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "address")) {
    payload.address = patch.address;
  }

  await update(ref(database, `companies/${companyId}/addresses/${officeId}`), payload);
};

/**
 * Removes a company office.
 * @param {string} companyId
 * @param {string} officeId
 */
export const removeCompanyOffice = async (companyId, officeId) => {
  if (!companyId || !officeId) return;
  await remove(ref(database, `companies/${companyId}/addresses/${officeId}`));
};

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

/**
 * Subscribes to members of a company.
 * Reads ids from companies/{companyId}/employees and hydrates user profiles from users/{uid}.
 * @param {string} companyId
 * @param {(members: Array<{id: string, name: string, role: string, email: string, phone: string, departments: string[], office: string | null}>) => void} callback
 * @returns {() => void}
 */
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

/**
 * Creates a member in both users/{uid} and companies/{companyId}/employees/{uid}.
 * @param {string} companyId
 * @param {{name?: string, role?: string, email?: string, phone?: string, departments?: string[], office?: string|null}} payload
 * @returns {Promise<string>} memberId
 */
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

/**
 * Updates a member in both users/{uid} and companies/{companyId}/employees/{uid}.
 * @param {string} companyId
 * @param {string} memberId
 * @param {{name?: string, role?: string, email?: string, phone?: string, departments?: string[], office?: string|null}} patch
 */
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

/**
 * Removes a member from companies/{companyId}/employees and users/{uid}.
 * @param {string} companyId
 * @param {string} memberId
 */
export const removeCompanyMember = async (companyId, memberId) => {
  if (!companyId || !memberId) return;

  const updates = {};
  updates[`companies/${companyId}/employees/${memberId}`] = null;
  updates[`users/${memberId}`] = null;
  await update(ref(database), updates);
};
