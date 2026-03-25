import {
  PLAN_LABEL_BY_KEY,
  SUBSCRIPTION_MODE_DIRECT_ACTIVATION,
} from "../constants/subscription.js";

/**
 * @module utils/subscription
 * @description Utilities for subscription query parsing and status messaging.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Resolves a human-friendly plan label from a plan key.
 * @param {string} planKey - Raw plan key.
 * @returns {string} Localized plan label or normalized key.
 */
export const resolvePlanLabel = (planKey) => {
  const normalizedPlanKey = String(planKey || "").trim().toLowerCase();
  if (!normalizedPlanKey) return "";
  return PLAN_LABEL_BY_KEY[normalizedPlanKey] || normalizedPlanKey;
};

/**
 * Parses subscription checkout status values from a URL query string.
 * @param {string} [search=""] - Query string (with or without leading `?`).
 * @returns {{isSuccess:boolean, isCanceled:boolean, mode:string, sessionIdFromQuery:string, planLabel:string}} Parsed state.
 */
export const parseSubscriptionSearch = (search = "") => {
  const searchParams = new URLSearchParams(search);

  return {
    isSuccess: searchParams.get("success") === "true",
    isCanceled: searchParams.get("canceled") === "true",
    mode: String(searchParams.get("mode") || "").trim(),
    sessionIdFromQuery: String(searchParams.get("session_id") || "").trim(),
    planLabel: resolvePlanLabel(searchParams.get("plan")),
  };
};

/**
 * Builds UI feedback content for a subscription flow outcome.
 * @param {{isSuccess:boolean, isCanceled:boolean, mode:string, planLabel:string}} params - Status inputs.
 * @returns {{variant:string, title:string, message:string}|null} Message config or `null` if no status.
 */
export const buildSubscriptionStatusMessage = ({
  isSuccess,
  isCanceled,
  mode,
  planLabel,
}) => {
  if (isSuccess && mode === SUBSCRIPTION_MODE_DIRECT_ACTIVATION) {
    return {
      variant: "success",
      title: "Plan activé",
      message: `Le plan ${planLabel || "sélectionné"} a été activé sans Checkout Stripe.`,
    };
  }

  if (isSuccess) {
    return {
      variant: "success",
      title: "Paiement validé",
      message: planLabel
        ? `Ton abonnement ${planLabel} est actif.`
        : "Ton abonnement est actif.",
    };
  }

  if (isCanceled) {
    return {
      variant: "warning",
      title: "Paiement annulé",
      message: "Aucun débit n'a été effectué. Tu peux relancer quand tu veux.",
    };
  }

  return null;
};
