const DEFAULT_ABONNEMENT_URL = "http://localhost:5173/management/abonnement";

const PLAN_CONFIG_BY_KEY = Object.freeze({
  hello: {
    label: "Hello",
    priceId: "price_1TE48nQOOE7teJemmxhitz2H",
  },
  freelance: {
    label: "Freelance",
    priceId: "price_1TE4K6QOOE7teJemPphifmKG",
  },
  startup: {
    label: "Startup",
    priceId: "price_1TE4L0QOOE7teJemR0hFkRZy",
  },
});

const CORS_HEADERS = Object.freeze({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
});

function setCorsHeaders(res) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.set(key, value);
  });
}

function sanitizeUrl(candidate, fallback = DEFAULT_ABONNEMENT_URL) {
  const input = String(candidate || "").trim();
  if (!input) return fallback;

  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

function buildRedirectUrl(baseUrl, queryParams = {}) {
  const url = new URL(baseUrl);

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function normalizePlanKey(planName) {
  return String(planName || "").trim().toLowerCase();
}

function getPlanConfig(planName) {
  const key = normalizePlanKey(planName);
  if (!key) return null;
  if (!Object.prototype.hasOwnProperty.call(PLAN_CONFIG_BY_KEY, key)) return null;

  return {
    key,
    ...PLAN_CONFIG_BY_KEY[key],
  };
}

function getPlanKeyByPriceId(priceId) {
  const normalizedPriceId = String(priceId || "").trim();
  if (!normalizedPriceId) return "";

  const matchedEntry = Object.entries(PLAN_CONFIG_BY_KEY).find(([, value]) =>
    String(value?.priceId || "").trim() === normalizedPriceId
  );

  return matchedEntry ? matchedEntry[0] : "";
}

module.exports = {
  DEFAULT_ABONNEMENT_URL,
  PLAN_CONFIG_BY_KEY,
  setCorsHeaders,
  sanitizeUrl,
  buildRedirectUrl,
  normalizePlanKey,
  getPlanConfig,
  getPlanKeyByPriceId,
};
