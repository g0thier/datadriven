import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, createQuizInvitation } from "../firebase";
import { QUIZZES, getQuiz } from "../pages/quiz/index.js";

import useCompanyTeam from "./useCompanyTeam";
import {
  normalizeDepartments,
  normalizeMembers,
  toggleInArray,
} from "../utils/workshopInvitationNormalizers";
import slugify from "../utils/string";

/**
 * @module hooks/useQuizInvitation
 * @description Hook to prepare quiz invitations and dispatch FCM notifications.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const SEND_QUIZ_INVITE_FCM_URL = import.meta.env.VITE_SEND_QUIZ_INVITE_FCM_URL;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTION_REGION;

const DEFAULT_QUIZ = Object.values(QUIZZES)[0] ?? { title: "Quiz Motivation" };

const resolveQuizId = (quiz) => {
  const candidateIds = [
    typeof quiz?.id === "string" ? quiz.id.trim() : "",
    typeof quiz?.slug === "string" ? quiz.slug.trim() : "",
    typeof quiz?.title === "string" ? slugify(quiz.title) : "",
  ].filter(Boolean);

  for (const candidate of candidateIds) {
    if (getQuiz(candidate)) return candidate;
  }

  return Object.keys(QUIZZES)[0] || "";
};

function buildDefaultFunctionUrl(functionName) {
  const projectId = String(FIREBASE_PROJECT_ID || "").trim();
  const region = String(FIREBASE_FUNCTION_REGION || "").trim();
  if (!projectId || !region) return "";
  return `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
}

function resolveQuizInviteFcmUrl() {
  const explicitUrl = String(SEND_QUIZ_INVITE_FCM_URL || "").trim();
  if (explicitUrl) return explicitUrl;
  return buildDefaultFunctionUrl("sendQuizInviteFcm");
}

function toPositiveInteger(value, fallback = 14) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;

  const floored = Math.floor(numeric);
  if (floored < 1) return 1;

  return floored;
}

function toDeadlineIso(days) {
  const totalDays = toPositiveInteger(days, 14);
  const deadline = new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000);
  return deadline.toISOString();
}

/**
 * Exposes quiz invitation state and actions (selection, scheduling, sending).
 * @returns {Object} Invitation form state, derived lists and sending handlers.
 */
function useQuizInvitation() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateQuiz = location.state?.quiz;
  const quizIdFromState =
    typeof location.state?.quizId === "string" ? location.state.quizId.trim() : "";
  const quizId = useMemo(() => {
    if (quizIdFromState && getQuiz(quizIdFromState)) return quizIdFromState;
    return resolveQuizId(stateQuiz);
  }, [stateQuiz, quizIdFromState]);
  const quiz = getQuiz(quizId) ?? stateQuiz ?? DEFAULT_QUIZ;
  const { companyId, officeLocations, departments, teamMembers } = useCompanyTeam();

  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [responseDelayDays, setResponseDelayDays] = useState(14);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [inviteResultModal, setInviteResultModal] = useState({
    isOpen: false,
    variant: "success",
    title: "",
    lines: [],
  });

  const departmentsNormalized = useMemo(
    () => normalizeDepartments(departments ?? []),
    [departments]
  );

  const membersNormalized = useMemo(
    () => normalizeMembers(teamMembers ?? []),
    [teamMembers]
  );

  const inviter = useMemo(() => {
    const currentUser = auth.currentUser;
    const currentUserUid = currentUser?.uid;
    const currentUserEmail = (currentUser?.email || "").toLowerCase();
    const displayNameParts = String(currentUser?.displayName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const matchingMember = membersNormalized.find((member) => {
      if (currentUserUid && String(member.id) === String(currentUserUid)) return true;
      return (member.email || "").toLowerCase() === currentUserEmail;
    });

    const memberFirstName = matchingMember?.firstName || displayNameParts[0] || "";
    const memberLastName =
      matchingMember?.lastName || displayNameParts.slice(1).join(" ") || "";
    const memberName =
      [memberFirstName, memberLastName].filter(Boolean).join(" ") ||
      matchingMember?.name ||
      "";
    const memberEmail = matchingMember?.email || "";

    return {
      firstName: memberFirstName,
      lastName: memberLastName,
      name:
        memberName ||
        currentUser?.displayName ||
        currentUser?.email ||
        "Zzzbre.com",
      email: memberEmail || currentUser?.email || "",
    };
  }, [membersNormalized]);

  const inviterFullName = inviter.name;
  const inviterFirstName = inviter.firstName;
  const inviterLastName = inviter.lastName;
  const inviterEmail = inviter.email;

  const filteredDepartments = useMemo(() => {
    const query = departmentSearch.trim().toLowerCase();
    if (!query) return departmentsNormalized;

    return departmentsNormalized.filter((department) =>
      department.__label.toLowerCase().includes(query)
    );
  }, [departmentSearch, departmentsNormalized]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return membersNormalized;

    return membersNormalized.filter((member) =>
      member.__label.toLowerCase().includes(query)
    );
  }, [membersNormalized, search]);

  const selectedDepartments = useMemo(() => {
    const selectedSet = new Set(selectedDepartmentIds);
    return departmentsNormalized.filter((department) =>
      selectedSet.has(department.__id)
    );
  }, [departmentsNormalized, selectedDepartmentIds]);

  const selectedMembers = useMemo(() => {
    const selectedSet = new Set(selectedMemberIds);
    return membersNormalized.filter((member) => selectedSet.has(member.__id));
  }, [membersNormalized, selectedMemberIds]);

  const guestsFromSelectedDepartments = useMemo(() => {
    const selectedDepartmentIdSet = new Set(selectedDepartmentIds.map(String));

    return membersNormalized.filter((member) => {
      const memberDepartments = Array.isArray(member.departments) ? member.departments : [];
      return memberDepartments.some((departmentId) =>
        selectedDepartmentIdSet.has(String(departmentId))
      );
    });
  }, [membersNormalized, selectedDepartmentIds]);

  const totalUniqueGuestCount = useMemo(() => {
    const allGuestIds = new Set();

    guestsFromSelectedDepartments.forEach((member) => {
      allGuestIds.add(String(member.__id));
    });

    selectedMembers.forEach((member) => {
      allGuestIds.add(String(member.__id));
    });

    return allGuestIds.size;
  }, [guestsFromSelectedDepartments, selectedMembers]);

  const responseDeadline = useMemo(
    () => toDeadlineIso(responseDelayDays),
    [responseDelayDays]
  );

  const toggleDepartment = (id) => {
    setSelectedDepartmentIds((previous) => toggleInArray(previous, id));
  };

  const toggleMember = (id) => {
    setSelectedMemberIds((previous) => toggleInArray(previous, id));
  };

  const canSend =
    toPositiveInteger(responseDelayDays, 14) >= 1 &&
    (selectedDepartmentIds.length > 0 || selectedMemberIds.length > 0) &&
    !isSending;

  const updateResponseDelayDays = (value) => {
    setResponseDelayDays(toPositiveInteger(value, 14));
  };

  const closeInviteResultModal = () => {
    setInviteResultModal((previous) => ({ ...previous, isOpen: false }));
    navigate("/team/motivation");
  };

  const handleSendInvites = async () => {
    if (isSending || !canSend) return;

    const resolvedResponseDelayDays = toPositiveInteger(responseDelayDays, 14);
    const resolvedResponseDeadline = toDeadlineIso(resolvedResponseDelayDays);

    const recipientsById = new Map();
    const addRecipient = (member, source) => {
      const recipientId = String(member.__id);
      const existing = recipientsById.get(recipientId);
      if (existing) {
        existing.sources.add(source);
        return;
      }

      recipientsById.set(recipientId, {
        id: member.__id,
        uid: member.id ?? member.__id,
        label: member.__label,
        email: member.email ?? "",
        phone: member.phone ?? "",
        firstName: member.firstName ?? "",
        lastName: member.lastName ?? "",
        name: member.name ?? "",
        sources: new Set([source]),
      });
    };

    guestsFromSelectedDepartments.forEach((member) => addRecipient(member, "department"));
    selectedMembers.forEach((member) => addRecipient(member, "direct"));

    const allGuests = Array.from(recipientsById.values()).map((recipient) => ({
      ...recipient,
      sources: Array.from(recipient.sources),
    }));

    if (allGuests.length === 0) {
      alert("Aucun invité sélectionné.");
      return;
    }

    if (!companyId) {
      alert("Impossible de créer l'invitation: companyId introuvable.");
      return;
    }

    if (!quizId) {
      alert("Impossible de déterminer le quiz à lancer.");
      return;
    }

    const sendQuizInviteFcmUrl = resolveQuizInviteFcmUrl();
    if (!sendQuizInviteFcmUrl) {
      alert("URL d'envoi FCM introuvable. Configure VITE_SEND_QUIZ_INVITE_FCM_URL.");
      return;
    }

    setIsSending(true);

    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const normalizedIdToken = String(idToken || "").trim();
      if (!normalizedIdToken) {
        throw new Error("auth_required");
      }

      const { invitationId } = await createQuizInvitation(companyId, {
        quizId,
        quizTitle: quiz?.title || quiz?.titre || "Quiz Motivation",
        quizDescription: quiz?.description || "",
        responseDelayDays: resolvedResponseDelayDays,
        responseDeadline: resolvedResponseDeadline,
        inviter: {
          uid: auth.currentUser?.uid || "",
          firstName: inviterFirstName,
          lastName: inviterLastName,
          name: inviterFullName,
          email: inviterEmail,
        },
        selectedDepartments: selectedDepartments.map((department) => ({
          id: department.__id,
          label: department.__label,
        })),
        selectedGuests: selectedMembers.map((member) => ({
          id: member.__id,
          uid: member.id ?? member.__id,
          label: member.__label,
        })),
        guestsFromSelectedDepartments: guestsFromSelectedDepartments.map((member) => ({
          id: member.__id,
          uid: member.id ?? member.__id,
          label: member.__label,
        })),
        allGuests,
        officeLocations: officeLocations ?? [],
        totalGuestCount: totalUniqueGuestCount,
      });

      const response = await fetch(sendQuizInviteFcmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${normalizedIdToken}`,
        },
        body: JSON.stringify({
          invitationId,
          companyId,
          quizId,
          quizTitle: quiz?.title || quiz?.titre || "Quiz Motivation",
          responseDeadline: resolvedResponseDeadline,
          responseDelayDays: resolvedResponseDelayDays,
          recipients: allGuests.map((guest) => ({
            uid: String(guest.uid || guest.id || ""),
            id: String(guest.id || ""),
            label: guest.label || "",
            email: guest.email || "",
            firstName: guest.firstName || "",
            lastName: guest.lastName || "",
            name: guest.name || "",
            sources: Array.isArray(guest.sources) ? guest.sources : [],
          })),
          inviter: {
            uid: auth.currentUser?.uid || "",
            firstName: inviterFirstName,
            lastName: inviterLastName,
            email: inviterEmail,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || `HTTP ${response.status}`);
      }

      const sendResult = await response.json().catch(() => ({}));

      const sentCount = Number(sendResult?.sentCount || 0);
      const failedCount = Number(sendResult?.failedCount || 0);
      const skippedCount = Number(sendResult?.skippedCount || 0);

      if (failedCount === 0) {
        setInviteResultModal({
          isOpen: true,
          variant: "success",
          title: "Invitations envoyées",
          lines: [
            `${sentCount} notification(s) envoyée(s).`,
            skippedCount > 0 ? `${skippedCount} invité(s) ignoré(s) (sans token).` : "",
          ].filter(Boolean),
        });
      } else {
        setInviteResultModal({
          isOpen: true,
          variant: "warning",
          title: "Envoi terminé avec erreurs",
          lines: [
            `Succès: ${sentCount}`,
            `Échecs: ${failedCount}`,
            skippedCount > 0 ? `Ignorés: ${skippedCount}` : "",
          ].filter(Boolean),
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi des invitations quiz:", error);
      alert("Impossible d'envoyer les invitations quiz. Vérifie la fonction cloud et réessaie.");
    } finally {
      setIsSending(false);
    }
  };

  return {
    quiz,
    quizId,
    inviterEmail,
    responseDelayDays,
    responseDeadline,
    setResponseDelayDays: updateResponseDelayDays,
    departmentSearch,
    setDepartmentSearch,
    search,
    setSearch,
    departmentsNormalized,
    filteredDepartments,
    membersNormalized,
    filteredMembers,
    selectedDepartmentIds,
    selectedMemberIds,
    totalUniqueGuestCount,
    toggleDepartment,
    toggleMember,
    canSend,
    isSending,
    inviteResultModal,
    closeInviteResultModal,
    handleSendInvites,
  };
}

export default useQuizInvitation;
