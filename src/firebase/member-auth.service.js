import {
  createUserWithEmailAndPassword,
  signOut,
  updateCurrentUser,
} from "firebase/auth";
import { auth } from "./app";

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
