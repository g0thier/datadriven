import { useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database, onAuthStateChangedListener } from "../firebase";

const EMPTY_PROFILE = {
  profilePicture: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
  emailAddress: "",
  phoneNumber: "",
  officeLocation: "",
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

const normalizeRoleLabel = (role = "") => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) return "";
  return ROLE_LABELS[normalizedRole] || normalizedRole;
};

const resolveOfficeLocation = (officeData = {}) => {
  const alias = String(officeData?.alias || "").trim();
  if (alias) return alias;

  const city = String(officeData?.city || "").trim();
  if (city) return city;

  return String(officeData?.address || "").trim();
};

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

export default function useCurrentUserProfile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const officeSubscriptionKeyRef = useRef("");

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeOffice = () => {};

    const resetProfile = () => {
      setProfile(EMPTY_PROFILE);
      setLoadError("");
      setIsLoading(false);
      officeSubscriptionKeyRef.current = "";
    };

    const unsubscribeAuth = onAuthStateChangedListener((currentUser) => {
      unsubscribeUser();
      unsubscribeUser = () => {};
      unsubscribeOffice();
      unsubscribeOffice = () => {};

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
            setIsLoading(false);
            return;
          }

          if (!hasSameOfficeSubscription) {
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
      unsubscribeAuth();
    };
  }, []);

  return { profile, isLoading, loadError };
}
