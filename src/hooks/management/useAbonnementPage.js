import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { PLANS } from "../../constants/managementPlans.js";
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

const DEFAULT_ROLE_COUNTS = Object.freeze({
  owner: 0,
  leader: 0,
  colab: 0,
});

const DEFAULT_PLAN_LIMITS = Object.freeze({
  managerLimit: 0,
  collaboratorLimit: 0,
});

const PLAN_LIMITS_BY_KEY = Object.freeze(
  (PLANS || []).reduce((accumulator, plan) => {
    const key = String(plan?.name || "").trim().toLowerCase();
    if (!key) return accumulator;

    accumulator[key] = {
      managerLimit: Number(plan?.managers || 0),
      collaboratorLimit: Number(plan?.collaborators || 0),
    };

    return accumulator;
  }, {})
);

function buildCompanyRoleCounts(companyEmployees = {}) {
  if (!companyEmployees || typeof companyEmployees !== "object") {
    return { ...DEFAULT_ROLE_COUNTS };
  }

  const counts = {
    owner: 0,
    leader: 0,
    colab: 0,
  };

  Object.values(companyEmployees).forEach((employeeData) => {
    if (!employeeData || typeof employeeData !== "object") return;
    if (employeeData.isActive === false) return;

    const role = String(employeeData.role || "").trim().toLowerCase();
    if (role === "owner") {
      counts.owner += 1;
      return;
    }

    if (role === "leader") {
      counts.leader += 1;
      return;
    }

    if (role === "colab") {
      counts.colab += 1;
    }
  });

  return counts;
}

export default function useAbonnementPage() {
  const location = useLocation();

  const [loadingPlanName, setLoadingPlanName] = useState("");
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [sessionId, setSessionId] = useState(() => readStripeLastSessionId());
  const [activePlanKey, setActivePlanKey] = useState("");
  const [companyRoleCounts, setCompanyRoleCounts] = useState(() => ({
    ...DEFAULT_ROLE_COUNTS,
  }));

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

  const { managerLimit, collaboratorLimit } = useMemo(() => {
    const normalizedPlanKey = String(activePlanKey || "").trim().toLowerCase();
    if (!normalizedPlanKey) return DEFAULT_PLAN_LIMITS;
    return PLAN_LIMITS_BY_KEY[normalizedPlanKey] || DEFAULT_PLAN_LIMITS;
  }, [activePlanKey]);

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeCompany = () => {};

    const resetCompanyMetrics = () => {
      setActivePlanKey("");
      setCompanyRoleCounts({ ...DEFAULT_ROLE_COUNTS });
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
              const nextPlanKey = String(
                companyData?.plan || companyData?.billing?.planKey || ""
              )
                .trim()
                .toLowerCase();

              setActivePlanKey(nextPlanKey);
              setCompanyRoleCounts(buildCompanyRoleCounts(companyData?.employees || {}));
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
    loadingPlanName,
    isPortalLoading,
    actionError,
    sessionId,
    statusMessage,
    companyRoleCounts,
    managerLimit,
    collaboratorLimit,
    handleStartCheckout,
    handleOpenBillingPortal,
  };
}
