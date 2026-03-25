import { useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database, onAuthStateChangedListener } from "../firebase";
import { resolvePlanLabel } from "../utils/subscription.utils";

/**
 * @module hooks/useCurrentUserProfile
 * @description Hook loading the current user profile and subscription view models from Firebase.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const EMPTY_PROFILE = {
  profilePicture: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
  emailAddress: "",
  phoneNumber: "",
  officeLocation: "",
};

const EMPTY_SUBSCRIPTION = {
  planKey: "",
  planLabel: "",
  status: "",
  currentPeriodEnd: "",
  cancelAtPeriodEnd: false,
  lastPaymentStatus: "",
};

export const PROFILE_FIELDS = [
  { id: "phoneNumber", key: "phoneNumber", label: "Téléphone :" },
  { id: "emailAddress", key: "emailAddress", label: "Email :" },
];

const ROLE_LABELS = {
  owner: "Propriétaire",
  leader: "Manager",
  colab: "Collaborateur",
};

/**
 * Splits a display name into first and last name parts.
 * @param {string} [displayName=""] - Display name string.
 * @returns {{firstName:string, lastName:string}} Name parts.
 */
const parseDisplayName = (displayName = "") => {
  const parts = String(displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { firstName: "", lastName: "" };

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

/**
 * Converts a role key to a localized profile label.
 * @param {string} [role=""] - Raw role value.
 * @returns {string} Localized role label or normalized role.
 */
const normalizeRoleLabel = (role = "") => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) return "";
  return ROLE_LABELS[normalizedRole] || normalizedRole;
};

/**
 * Resolves the best office location label from office data.
 * @param {Object} [officeData={}] - Office payload.
 * @returns {string} Office location label.
 */
const resolveOfficeLocation = (officeData = {}) => {
  const alias = String(officeData?.alias || "").trim();
  if (alias) return alias;

  const city = String(officeData?.city || "").trim();
  if (city) return city;

  return String(officeData?.address || "").trim();
};

/**
 * Maps user/company data to the profile view model consumed by the UI.
 * @param {Object} [userData={}] - User payload from database.
 * @param {Object|null} [currentUser=null] - Authenticated Firebase user.
 * @returns {{profilePicture:string, firstName:string, lastName:string, jobTitle:string, emailAddress:string, phoneNumber:string, officeLocation:string}} Profile view model.
 */
const toProfileViewModel = (userData = {}, currentUser = null) => {
  const fallbackName = parseDisplayName(currentUser?.displayName || "");

  return {
    profilePicture: String(userData?.photoURL || currentUser?.photoURL || "").trim(),
    firstName: String(userData?.firstName || fallbackName.firstName || "").trim(),
    lastName: String(userData?.lastName || fallbackName.lastName || "").trim(),
    jobTitle: normalizeRoleLabel(userData?.role),
    emailAddress: String(userData?.email || currentUser?.email || "").trim(),
    phoneNumber: String(userData?.phone || "").trim(),
    officeLocation: "",
  };
};

/**
 * Maps company billing data to the subscription view model consumed by the UI.
 * @param {Object} [companyData={}] - Company payload from database.
 * @returns {{planKey:string, planLabel:string, status:string, currentPeriodEnd:string, cancelAtPeriodEnd:boolean, lastPaymentStatus:string}} Subscription view model.
 */
const toSubscriptionViewModel = (companyData = {}) => {
  const billingData =
    companyData?.billing && typeof companyData.billing === "object"
      ? companyData.billing
      : {};
  const rawCurrentPeriodEnd =
    billingData?.currentPeriodEnd ?? billingData?.current_period_end ?? "";
  const planKey = String(companyData?.plan || billingData?.planKey || "")
    .trim()
    .toLowerCase();

  return {
    planKey,
    planLabel: resolvePlanLabel(planKey),
    status: String(companyData?.status || billingData?.status || "")
      .trim()
      .toLowerCase(),
    currentPeriodEnd: String(rawCurrentPeriodEnd || "").trim(),
    cancelAtPeriodEnd: Boolean(billingData?.cancelAtPeriodEnd),
    lastPaymentStatus: String(billingData?.lastPayment?.status || "")
      .trim()
      .toLowerCase(),
  };
};

/**
 * Exposes reactive profile and subscription data for the current authenticated user.
 * @returns {{profile:Object, subscription:Object, isLoading:boolean, loadError:string}} Profile state for UI rendering.
 */
export default function useCurrentUserProfile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [subscription, setSubscription] = useState(EMPTY_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const officeSubscriptionKeyRef = useRef("");
  const companySubscriptionKeyRef = useRef("");

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeOffice = () => {};
    let unsubscribeCompany = () => {};

    const resetProfile = () => {
      setProfile(EMPTY_PROFILE);
      setSubscription(EMPTY_SUBSCRIPTION);
      setLoadError("");
      setIsLoading(false);
      officeSubscriptionKeyRef.current = "";
      companySubscriptionKeyRef.current = "";
    };

    const unsubscribeAuth = onAuthStateChangedListener((currentUser) => {
      unsubscribeUser();
      unsubscribeUser = () => {};
      unsubscribeOffice();
      unsubscribeOffice = () => {};
      unsubscribeCompany();
      unsubscribeCompany = () => {};

      if (!currentUser) {
        resetProfile();
        return;
      }

      setIsLoading(true);
      setLoadError("");

      const userRef = ref(database, `users/${currentUser.uid}`);
      unsubscribeUser = onValue(
        userRef,
        (snapshot) => {
          const userData = snapshot.exists() ? snapshot.val() || {} : {};
          const companyId = String(userData?.companyId || "").trim();
          const officeId = String(userData?.officeId || "").trim();
          const nextOfficeSubscriptionKey =
            companyId && officeId ? `${companyId}/${officeId}` : "";
          const hasSameCompanySubscription =
            companyId && companyId === companySubscriptionKeyRef.current;
          const hasSameOfficeSubscription =
            nextOfficeSubscriptionKey &&
            nextOfficeSubscriptionKey === officeSubscriptionKeyRef.current;

          setProfile((previousProfile) => {
            const nextProfile = toProfileViewModel(userData, currentUser);

            if (hasSameOfficeSubscription) {
              nextProfile.officeLocation = previousProfile.officeLocation;
            }

            return nextProfile;
          });

          if (!nextOfficeSubscriptionKey) {
            unsubscribeOffice();
            unsubscribeOffice = () => {};
            officeSubscriptionKeyRef.current = "";
          }

          if (nextOfficeSubscriptionKey && !hasSameOfficeSubscription) {
            unsubscribeOffice();
            unsubscribeOffice = () => {};
            officeSubscriptionKeyRef.current = nextOfficeSubscriptionKey;

            const officeRef = ref(database, `companies/${companyId}/addresses/${officeId}`);
            unsubscribeOffice = onValue(
              officeRef,
              (officeSnapshot) => {
                const officeData = officeSnapshot.exists() ? officeSnapshot.val() || {} : {};
                setProfile((previousProfile) => ({
                  ...previousProfile,
                  officeLocation: resolveOfficeLocation(officeData),
                }));
              },
              (error) => {
                console.error("Impossible de charger le bureau utilisateur :", error);
              }
            );
          }

          if (!companyId) {
            unsubscribeCompany();
            unsubscribeCompany = () => {};
            companySubscriptionKeyRef.current = "";
            setSubscription(EMPTY_SUBSCRIPTION);
          }

          if (companyId && !hasSameCompanySubscription) {
            unsubscribeCompany();
            unsubscribeCompany = () => {};
            companySubscriptionKeyRef.current = companyId;

            const companyRef = ref(database, `companies/${companyId}`);
            unsubscribeCompany = onValue(
              companyRef,
              (companySnapshot) => {
                const companyData = companySnapshot.exists() ? companySnapshot.val() || {} : {};
                setSubscription(toSubscriptionViewModel(companyData));
              },
              (error) => {
                console.error("Impossible de charger l'abonnement entreprise :", error);
              }
            );
          }

          setIsLoading(false);
        },
        (error) => {
          console.error("Impossible de charger le profil utilisateur :", error);
          setLoadError("Impossible de charger le profil.");
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribeUser();
      unsubscribeOffice();
      unsubscribeCompany();
      unsubscribeAuth();
    };
  }, []);

  return { profile, subscription, isLoading, loadError };
}
