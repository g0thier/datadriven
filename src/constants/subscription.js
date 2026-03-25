/**
 * @module constants/subscription
 * @description Subscription constants for plan labels, flow modes and user-facing error messages.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Human-readable labels by normalized subscription plan key.
 * @type {{hello:string, freelance:string, startup:string}}
 */
export const PLAN_LABEL_BY_KEY = Object.freeze({
  hello: "Hello",
  freelance: "Freelance",
  startup: "Startup",
});

/**
 * Subscription mode value used for direct (non-checkout) activation.
 * @type {string}
 */
export const SUBSCRIPTION_MODE_DIRECT_ACTIVATION = "direct_activation";

/**
 * User-facing error messages for subscription actions.
 * @type {{CHECKOUT_FAILED:string, MISSING_SESSION:string, PORTAL_FAILED:string}}
 */
export const SUBSCRIPTION_ERRORS = Object.freeze({
  CHECKOUT_FAILED: "Impossible de lancer le checkout Stripe. Réessaie dans un instant.",
  MISSING_SESSION: "Aucune session Stripe disponible pour ouvrir le portail de facturation.",
  PORTAL_FAILED: "Impossible d'ouvrir le portail de facturation pour le moment.",
});
