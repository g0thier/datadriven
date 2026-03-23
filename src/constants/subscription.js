export const PLAN_LABEL_BY_KEY = Object.freeze({
  hello: "Hello",
  freelance: "Freelance",
  startup: "Startup",
});

export const SUBSCRIPTION_MODE_DIRECT_ACTIVATION = "direct_activation";

export const SUBSCRIPTION_ERRORS = Object.freeze({
  CHECKOUT_FAILED: "Impossible de lancer le checkout Stripe. Réessaie dans un instant.",
  MISSING_SESSION: "Aucune session Stripe disponible pour ouvrir le portail de facturation.",
  PORTAL_FAILED: "Impossible d'ouvrir le portail de facturation pour le moment.",
});
