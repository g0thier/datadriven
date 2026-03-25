import { createCompany, signUpWithEmail } from "../firebase";

/**
 * @module services/registerCompanyService
 * @description Service to register a company account and initialize company data.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Creates an auth account, then creates the company record for that user.
 * @param {Object} params - Registration inputs.
 * @param {string} params.email - User email.
 * @param {string} params.password - User password.
 * @param {Object} params.payload - Company payload used by `createCompany`.
 * @returns {Promise<{user:Object, result:Object}>} Created user and company creation result.
 * @throws {Error} When user creation succeeds but no user is returned.
 */
export async function registerCompanyAccount({ email, password, payload }) {
  const user = await signUpWithEmail(email, password);
  if (!user) {
    throw new Error("Utilisateur introuvable après inscription.");
  }

  const result = await createCompany(user.uid, payload);
  return { user, result };
}
