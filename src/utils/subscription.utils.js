import {
  PLAN_LABEL_BY_KEY,
  SUBSCRIPTION_MODE_DIRECT_ACTIVATION,
} from "../constants/subscription.js";

export const resolvePlanLabel = (planKey) => {
  const normalizedPlanKey = String(planKey || "").trim().toLowerCase();
  if (!normalizedPlanKey) return "";
  return PLAN_LABEL_BY_KEY[normalizedPlanKey] || normalizedPlanKey;
};

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
