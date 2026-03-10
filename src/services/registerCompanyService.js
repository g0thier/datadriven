import { createCompany, signUpWithEmail } from "../firebase";

export async function registerCompanyAccount({ email, password, payload }) {
  const user = await signUpWithEmail(email, password);
  if (!user) {
    throw new Error("Utilisateur introuvable après inscription.");
  }

  const result = await createCompany(user.uid, payload);
  return { user, result };
}
