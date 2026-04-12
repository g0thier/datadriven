import {
  createUserWithEmailAndPassword,
  signOut,
  updateCurrentUser,
} from "firebase/auth";
import { auth } from "./app";

/**
 * @module firebase/member-auth.service
 * @description Auth helper to create member accounts while restoring previous session.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Creates a member auth account and restores the previously authenticated user.
 * @param {string} email - Member email.
 * @param {string} password - Member password.
 * @returns {Promise<Object>} Created Firebase user.
 */
export const signUpMemberWithEmail = async (email, password) => {
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  if (!normalizedEmail) {
    throw new Error("L'email du membre est requis.");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Le mot de passe du membre est requis.");
  }

  const previousUser = auth.currentUser;

  try {
    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const createdUser = credential.user;

    await signOut(auth);

    if (previousUser) {
      await updateCurrentUser(auth, previousUser);
    }

    return createdUser;
  } catch (error) {
    if (previousUser && !auth.currentUser) {
      await updateCurrentUser(auth, previousUser).catch(() => {});
    }
    throw error;
  }
};
