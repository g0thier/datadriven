// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

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
import { getDatabase, ref, set, update, push, get, onValue } from "firebase/database";

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


// Signing up with email and password
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

// Signing in with email and password
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

// Logging out
export const logout = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully!');
  } catch (error) {
    console.error('Logout failed:', error.code, error.message);
    throw error;
  };
};

// Sending password reset email
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

// Listening to auth state changes
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Database functions

// Utility function to create a URL-friendly slug from the company name
const slugify = (value) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const DEFAULT_DEPARTMENTS = [
  "Ressources Humaines",
  "Développement",
  "Marketing",
  "Ventes",
  "Support Client",
  "Finance",
  "Opérations",
  "Informatique",
  "Recherche et Développement",
  "Logistique",
];

// Create a new company in the database
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