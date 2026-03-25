import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database, onAuthStateChangedListener } from "../firebase";
import { APP_ROLES, COLAB_DEFAULT_REDIRECT_PATH } from "../constants/routeAccess.js";
import {
  isRouteAllowedForRole,
  normalizeLeaderPageAccess,
  resolveAuthorizedTargetPath,
  resolveFirstAllowedPath,
} from "../utils/routeAccess.utils.js";
import { getCompanySubscriptionCapacity } from "../utils/subscriptionCapacity.utils.js";

const ROLE_SET = new Set([APP_ROLES.OWNER, APP_ROLES.LEADER, APP_ROLES.COLAB]);

function normalizeRole(role = "") {
  const normalizedRole = String(role || "").trim().toLowerCase();
  return ROLE_SET.has(normalizedRole) ? normalizedRole : APP_ROLES.COLAB;
}

export default function useRouteAuthorization() {
  const [user, setUser] = useState(undefined);
  const [role, setRole] = useState(APP_ROLES.COLAB);
  const [companyId, setCompanyId] = useState("");
  const [leaderPageAccess, setLeaderPageAccess] = useState([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isLeaderPermissionsLoading, setIsLeaderPermissionsLoading] = useState(false);
  const [isSubscriptionCapacityLoading, setIsSubscriptionCapacityLoading] = useState(false);
  const [isSubscriptionOverCapacity, setIsSubscriptionOverCapacity] = useState(false);
  const previousRoleRef = useRef(APP_ROLES.COLAB);
  const previousCompanyIdRef = useRef("");

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((currentUser) => {
      if (!currentUser) {
        previousRoleRef.current = APP_ROLES.COLAB;
        previousCompanyIdRef.current = "";
        setUser(null);
        setRole(APP_ROLES.COLAB);
        setCompanyId("");
        setLeaderPageAccess([]);
        setIsProfileLoading(false);
        setIsLeaderPermissionsLoading(false);
        setIsSubscriptionCapacityLoading(false);
        setIsSubscriptionOverCapacity(false);
        return;
      }

      previousRoleRef.current = APP_ROLES.COLAB;
      previousCompanyIdRef.current = "";
      setUser(currentUser);
      setIsProfileLoading(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      return () => {};
    }

    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(
      userRef,
      (snapshot) => {
        const userData = snapshot.exists() ? snapshot.val() || {} : {};
        const normalizedRole = normalizeRole(userData?.role);
        const nextCompanyId = String(userData?.companyId || "").trim();
        const previousRole = previousRoleRef.current;
        const previousCompanyId = previousCompanyIdRef.current;
        const hasCompanyChanged = previousCompanyId !== nextCompanyId;
        const wasLeaderWithCompany =
          previousRole === APP_ROLES.LEADER && Boolean(previousCompanyId);
        const isLeaderWithCompany =
          normalizedRole === APP_ROLES.LEADER && Boolean(nextCompanyId);

        setRole(normalizedRole);
        setCompanyId(nextCompanyId);
        if (nextCompanyId) {
          if (hasCompanyChanged) {
            setIsSubscriptionCapacityLoading(true);
          }
        } else {
          setIsSubscriptionCapacityLoading(false);
          setIsSubscriptionOverCapacity(false);
        }
        if (isLeaderWithCompany) {
          if (!wasLeaderWithCompany || hasCompanyChanged) {
            setIsLeaderPermissionsLoading(true);
          }
        } else {
          setLeaderPageAccess([]);
          setIsLeaderPermissionsLoading(false);
        }
        previousRoleRef.current = normalizedRole;
        previousCompanyIdRef.current = nextCompanyId;
        setIsProfileLoading(false);
      },
      (error) => {
        console.error("Impossible de charger le profil utilisateur pour les droits :", error);
        previousRoleRef.current = APP_ROLES.COLAB;
        previousCompanyIdRef.current = "";
        setRole(APP_ROLES.COLAB);
        setCompanyId("");
        setLeaderPageAccess([]);
        setIsLeaderPermissionsLoading(false);
        setIsSubscriptionCapacityLoading(false);
        setIsSubscriptionOverCapacity(false);
        setIsProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || role !== APP_ROLES.LEADER || !companyId) {
      return () => {};
    }

    const permissionsRef = ref(
      database,
      `companies/${companyId}/managerPermissions/${user.uid}/pageAccess`
    );
    const unsubscribe = onValue(
      permissionsRef,
      (snapshot) => {
        const value = snapshot.exists() ? snapshot.val() : [];
        setLeaderPageAccess(normalizeLeaderPageAccess(value));
        setIsLeaderPermissionsLoading(false);
      },
      (error) => {
        console.error("Impossible de charger les permissions du leader :", error);
        setLeaderPageAccess([]);
        setIsLeaderPermissionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId, role, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !companyId) {
      return () => {};
    }

    const companyRef = ref(database, `companies/${companyId}`);
    const unsubscribe = onValue(
      companyRef,
      (snapshot) => {
        const companyData = snapshot.exists() ? snapshot.val() || {} : {};
        const { isOverCapacity } = getCompanySubscriptionCapacity(companyData);
        setIsSubscriptionOverCapacity(isOverCapacity);
        setIsSubscriptionCapacityLoading(false);
      },
      (error) => {
        console.error("Impossible de charger la capacite d'abonnement :", error);
        setIsSubscriptionOverCapacity(false);
        setIsSubscriptionCapacityLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId, user?.uid]);

  const isLoading =
    user === undefined ||
    (Boolean(user) && isProfileLoading) ||
    (Boolean(user) && role === APP_ROLES.LEADER && isLeaderPermissionsLoading) ||
    (Boolean(user) && isSubscriptionCapacityLoading);

  const canAccessPath = useMemo(
    () =>
      (path) =>
        isRouteAllowedForRole({
          role,
          path,
          leaderPageAccess,
          isSubscriptionOverCapacity,
        }),
    [isSubscriptionOverCapacity, leaderPageAccess, role]
  );

  const resolveBestPath = useMemo(
    () => (candidatePaths, fallbackPath = COLAB_DEFAULT_REDIRECT_PATH) =>
      resolveFirstAllowedPath({
        candidatePaths,
        role,
        leaderPageAccess,
        isSubscriptionOverCapacity,
        fallbackPath,
      }),
    [isSubscriptionOverCapacity, leaderPageAccess, role]
  );

  const resolveTargetPath = useMemo(
    () => (
      targetPath,
      candidatePaths = [],
      fallbackPath = COLAB_DEFAULT_REDIRECT_PATH
    ) =>
      resolveAuthorizedTargetPath({
        targetPath,
        candidatePaths,
        role,
        leaderPageAccess,
        isSubscriptionOverCapacity,
        fallbackPath,
      }),
    [isSubscriptionOverCapacity, leaderPageAccess, role]
  );

  return {
    user,
    role,
    companyId,
    leaderPageAccess,
    isSubscriptionOverCapacity,
    isLoading,
    isAuthenticated: Boolean(user),
    canAccessPath,
    resolveBestPath,
    resolveTargetPath,
  };
}
