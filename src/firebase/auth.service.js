import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./app";

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

export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User logged out successfully!");
  } catch (error) {
    console.error("Logout failed:", error.code, error.message);
    throw error;
  }
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email)
    .then(() => {
      console.log("E-mail de réinitialisation envoyé.");
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Erreur :", errorCode, errorMessage);
    });
};

export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};
