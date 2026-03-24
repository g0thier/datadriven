import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { SUBSCRIPTION_ERRORS } from "../../constants/subscription.js";
import { database, onAuthStateChangedListener } from "../../firebase";
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
import { getCompanySubscriptionCapacity } from "../../utils/subscriptionCapacity.utils.js";

export default function useAbonnementPage() {
  const location = useLocation();

  const [loadingPlanName, setLoadingPlanName] = useState("");
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [sessionId, setSessionId] = useState(() => readStripeLastSessionId());
  const [subscriptionCapacity, setSubscriptionCapacity] = useState(() =>
    getCompanySubscriptionCapacity({})
  );

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

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeCompany = () => {};

    const resetCompanyMetrics = () => {
      setSubscriptionCapacity(getCompanySubscriptionCapacity({}));
    };

    const unsubscribeAuth = onAuthStateChangedListener((currentUser) => {
      unsubscribeUser();
      unsubscribeUser = () => {};
      unsubscribeCompany();
      unsubscribeCompany = () => {};

      if (!currentUser?.uid) {
        resetCompanyMetrics();
        return;
      }

      const userRef = ref(database, `users/${currentUser.uid}`);
      unsubscribeUser = onValue(
        userRef,
        (userSnapshot) => {
          const userData = userSnapshot.exists() ? userSnapshot.val() || {} : {};
          const companyId = String(userData?.companyId || "").trim();

          unsubscribeCompany();
          unsubscribeCompany = () => {};

          if (!companyId) {
            resetCompanyMetrics();
            return;
          }

          const companyRef = ref(database, `companies/${companyId}`);
          unsubscribeCompany = onValue(
            companyRef,
            (companySnapshot) => {
              const companyData = companySnapshot.exists() ? companySnapshot.val() || {} : {};
              setSubscriptionCapacity(getCompanySubscriptionCapacity(companyData));
            },
            (error) => {
              console.error("Impossible de charger les données company pour l'abonnement :", error);
              resetCompanyMetrics();
            }
          );
        },
        (error) => {
          console.error("Impossible de charger l'utilisateur pour l'abonnement :", error);
          resetCompanyMetrics();
        }
      );
    });

    return () => {
      unsubscribeUser();
      unsubscribeCompany();
      unsubscribeAuth();
    };
  }, []);

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
    ...subscriptionCapacity,
    loadingPlanName,
    isPortalLoading,
    actionError,
    sessionId,
    statusMessage,
    handleStartCheckout,
    handleOpenBillingPortal,
  };
}
