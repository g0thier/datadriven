import { auth } from "../firebase";

/**
 * @module services/stripeService
 * @description Stripe helpers to call protected checkout/portal functions and persist session state.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const DEFAULT_FUNCTION_REGION = "europe-west1";
const ABONNEMENT_PATH = "/management/abonnement";

const STRIPE_CHECKOUT_URL = import.meta.env.VITE_STRIPE_CREATE_CHECKOUT_SESSION_URL;
const STRIPE_PORTAL_URL = import.meta.env.VITE_STRIPE_CREATE_PORTAL_SESSION_URL;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const STRIPE_LAST_SESSION_STORAGE_KEY = "stripe_last_checkout_session_id";

/**
 * Builds the default Cloud Function URL for a given function name.
 * @param {string} functionName - Function identifier.
 * @returns {string} Fully-qualified function URL, or empty string when project id is unavailable.
 */
const buildDefaultFunctionUrl = (functionName) => {
  if (!FIREBASE_PROJECT_ID) return "";

  return `https://${DEFAULT_FUNCTION_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net/${functionName}`;
};

/**
 * Resolves an explicit env URL first, then falls back to a computed default URL.
 * @param {string} envUrl - Environment-provided URL.
 * @param {string} functionName - Function identifier used for fallback URL generation.
 * @returns {string} Resolved endpoint URL.
 */
const resolveFunctionUrl = (envUrl, functionName) => {
  const candidateUrl = String(envUrl || "").trim();
  if (candidateUrl) return candidateUrl;
  return buildDefaultFunctionUrl(functionName);
};

/**
 * Builds bearer authorization headers from the current Firebase user token.
 * @returns {Promise<{Authorization:string}>} Authorization headers.
 * @throws {Error} When no authenticated user/token is available.
 */
const resolveAuthHeaders = async () => {
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
};

/**
 * Sends an authenticated JSON POST request and parses a JSON response body.
 * @param {string} url - Target endpoint URL.
 * @param {Object} payload - Request body payload.
 * @returns {Promise<Object>} Parsed response body.
 * @throws {Error} When URL is missing or when the response is not successful.
 */
const postJson = async (url, payload) => {
  if (!url) {
    throw new Error("URL de fonction Stripe manquante.");
  }

  const authHeaders = await resolveAuthHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || `HTTP ${response.status}`);
  }

  return body || {};
};

/**
 * Resolves the absolute URL of the abonnement page from the current origin.
 * @returns {string} Absolute abonnement page URL.
 */
const resolveAbonnementPageUrl = () =>
  new URL(ABONNEMENT_PATH, window.location.origin).toString();

/**
 * Persists the last Stripe Checkout session id in local storage.
 * @param {string} sessionId - Stripe checkout session id.
 * @returns {void}
 */
export const persistStripeLastSessionId = (sessionId) => {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) return;

  try {
    window.localStorage.setItem(STRIPE_LAST_SESSION_STORAGE_KEY, normalizedSessionId);
  } catch {
    // Ignore storage errors (private mode / quota).
  }
};

/**
 * Reads the last persisted Stripe Checkout session id from local storage.
 * @returns {string} Persisted session id, or empty string when unavailable.
 */
export const readStripeLastSessionId = () => {
  try {
    return String(window.localStorage.getItem(STRIPE_LAST_SESSION_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
};

/**
 * Creates a Stripe Checkout session through a protected Cloud Function endpoint.
 * @param {Object} params - Checkout params.
 * @param {string} params.planName - Selected pricing plan name.
 * @returns {Promise<Object>} Function response payload.
 */
export const createCheckoutSession = ({ planName }) =>
  postJson(resolveFunctionUrl(STRIPE_CHECKOUT_URL, "createCheckoutSession"), {
    planName,
    successUrl: resolveAbonnementPageUrl(),
    cancelUrl: resolveAbonnementPageUrl(),
  });

/**
 * Creates a Stripe Billing Portal session through a protected Cloud Function endpoint.
 * @param {Object} params - Portal params.
 * @param {string} params.sessionId - Stripe checkout session id.
 * @returns {Promise<Object>} Function response payload.
 */
export const createPortalSession = ({ sessionId }) =>
  postJson(resolveFunctionUrl(STRIPE_PORTAL_URL, "createPortalSession"), {
    sessionId,
    returnUrl: resolveAbonnementPageUrl(),
  });
