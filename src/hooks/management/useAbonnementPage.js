import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { SUBSCRIPTION_ERRORS } from "../../constants/subscription.js";
import {
  createCheckoutSession,
  createPortalSession,
  persistStripeLastSessionId,
  readStripeLastSessionId,
} from "../../services/stripeService.js";
import {
  buildSubscriptionStatusMessage,
  parseSubscriptionSearch,
} from "../../utils/subscription.utils.js";

export default function useAbonnementPage() {
  const location = useLocation();

  const [loadingPlanName, setLoadingPlanName] = useState("");
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [sessionId, setSessionId] = useState(() => readStripeLastSessionId());

  const subscriptionSearch = useMemo(
    () => parseSubscriptionSearch(location.search),
    [location.search]
  );

  const { sessionIdFromQuery } = subscriptionSearch;

  useEffect(() => {
    if (!sessionIdFromQuery) return;
    persistStripeLastSessionId(sessionIdFromQuery);
    setSessionId(sessionIdFromQuery);
  }, [sessionIdFromQuery]);

  const statusMessage = useMemo(
    () => buildSubscriptionStatusMessage(subscriptionSearch),
    [subscriptionSearch]
  );

  const handleStartCheckout = useCallback(async (planName) => {
    setLoadingPlanName(planName);
    setActionError("");

    try {
      const response = await createCheckoutSession({ planName });
      const checkoutUrl = String(response?.url || "").trim();

      if (!checkoutUrl) {
        throw new Error("checkout_url_missing");
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error("Erreur createCheckoutSession:", error);
      setActionError(SUBSCRIPTION_ERRORS.CHECKOUT_FAILED);
      setLoadingPlanName("");
    }
  }, []);

  const handleOpenBillingPortal = useCallback(async () => {
    setActionError("");

    setIsPortalLoading(true);

    try {
      const response = await createPortalSession({ sessionId });
      const portalUrl = String(response?.url || "").trim();

      if (!portalUrl) {
        throw new Error("portal_url_missing");
      }

      window.location.assign(portalUrl);
    } catch (error) {
      console.error("Erreur createPortalSession:", error);
      setActionError(SUBSCRIPTION_ERRORS.PORTAL_FAILED);
      setIsPortalLoading(false);
    }
  }, [sessionId]);

  return {
    loadingPlanName,
    isPortalLoading,
    actionError,
    sessionId,
    statusMessage,
    handleStartCheckout,
    handleOpenBillingPortal,
  };
}
