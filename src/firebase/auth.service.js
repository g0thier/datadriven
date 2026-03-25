import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./app";

/**
 * @module firebase/auth.service
 * @description Authentication helpers for signup, signin, signout and password reset.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Creates a Firebase auth account with email/password.
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @returns {Promise<Object>} Created Firebase user.
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
 * Signs in an existing Firebase auth user with email/password.
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @returns {Promise<Object>} Authenticated Firebase user.
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

/**
 * Signs out the currently authenticated Firebase user.
 * @returns {Promise<void>} Logout completion.
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User logged out successfully!");
  } catch (error) {
    console.error("Logout failed:", error.code, error.message);
    throw error;
  }
};

/**
 * Sends a password-reset email.
 * @param {string} email - Target user email.
 * @returns {Promise<void>} Reset request completion.
 */
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

/**
 * Subscribes to Firebase auth state changes.
 * @param {Function} callback - Listener called with current user or `null`.
 * @returns {Function} Unsubscribe callback.
 */
export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};
