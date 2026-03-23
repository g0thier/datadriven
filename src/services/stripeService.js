const DEFAULT_FUNCTION_REGION = "europe-west1";
const ABONNEMENT_PATH = "/management/abonnement";

const STRIPE_CHECKOUT_URL = import.meta.env.VITE_STRIPE_CREATE_CHECKOUT_SESSION_URL;
const STRIPE_PORTAL_URL = import.meta.env.VITE_STRIPE_CREATE_PORTAL_SESSION_URL;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const STRIPE_LAST_SESSION_STORAGE_KEY = "stripe_last_checkout_session_id";

const buildDefaultFunctionUrl = (functionName) => {
  if (!FIREBASE_PROJECT_ID) return "";

  return `https://${DEFAULT_FUNCTION_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net/${functionName}`;
};

const resolveFunctionUrl = (envUrl, functionName) => {
  const candidateUrl = String(envUrl || "").trim();
  if (candidateUrl) return candidateUrl;
  return buildDefaultFunctionUrl(functionName);
};

const postJson = async (url, payload) => {
  if (!url) {
    throw new Error("URL de fonction Stripe manquante.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || `HTTP ${response.status}`);
  }

  return body || {};
};

const resolveAbonnementPageUrl = () =>
  new URL(ABONNEMENT_PATH, window.location.origin).toString();

export const persistStripeLastSessionId = (sessionId) => {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) return;

  try {
    window.localStorage.setItem(STRIPE_LAST_SESSION_STORAGE_KEY, normalizedSessionId);
  } catch {
    // Ignore storage errors (private mode / quota).
  }
};

export const readStripeLastSessionId = () => {
  try {
    return String(window.localStorage.getItem(STRIPE_LAST_SESSION_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
};

export const createCheckoutSession = ({ planName }) =>
  postJson(resolveFunctionUrl(STRIPE_CHECKOUT_URL, "createCheckoutSession"), {
    planName,
    successUrl: resolveAbonnementPageUrl(),
    cancelUrl: resolveAbonnementPageUrl(),
  });

export const createPortalSession = ({ sessionId }) =>
  postJson(resolveFunctionUrl(STRIPE_PORTAL_URL, "createPortalSession"), {
    sessionId,
    returnUrl: resolveAbonnementPageUrl(),
  });
