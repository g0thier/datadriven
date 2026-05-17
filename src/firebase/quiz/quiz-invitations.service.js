import { push, ref, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/quiz/quiz-invitations.service
 * @description Quiz invitation creation helpers for motivation quizzes.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const normalizeGuests = (guests = []) =>
  guests.map((guest) => ({
    id: guest?.id ?? "",
    uid: guest?.uid ?? guest?.id ?? "",
    label: guest?.label ?? "",
    email: guest?.email ?? "",
    phone: guest?.phone ?? "",
    firstName: guest?.firstName ?? "",
    lastName: guest?.lastName ?? "",
    name: guest?.name ?? "",
    sources: Array.isArray(guest?.sources) ? guest.sources : [],
  }));

const normalizeUserId = (value) => String(value || "").trim();

/**
 * Creates a quiz invitation and links it to company and participant users.
 * @param {string} companyId - Company id.
 * @param {Object} [payload={}] - Invitation creation payload.
 * @returns {Promise<{invitationId:string, companyInvitationSummary:Object, invitationDetails:Object}>}
 */
export const createQuizInvitation = async (companyId, payload = {}) => {
  if (!companyId) {
    throw new Error("createQuizInvitation: companyId manquant");
  }

  const now = new Date().toISOString();
  const invitationRef = push(ref(database, "quizInvitations"));
  const invitationId = invitationRef.key;

  if (!invitationId) {
    throw new Error("Impossible de générer invitationId");
  }

  const invitationDetails = {
    invitationId,
    companyId,
    quizId: payload.quizId || "",
    quizTitle: payload.quizTitle || "",
    quizDescription: payload.quizDescription || "",
    responseDelayDays:
      typeof payload.responseDelayDays === "number" ? payload.responseDelayDays : 14,
    responseDeadline: payload.responseDeadline || "",
    inviter: {
      uid: payload.inviter?.uid || "",
      name: payload.inviter?.name || "",
      email: payload.inviter?.email || "",
    },
    selectedDepartments: Array.isArray(payload.selectedDepartments)
      ? payload.selectedDepartments
      : [],
    selectedGuests: Array.isArray(payload.selectedGuests) ? payload.selectedGuests : [],
    guestsFromSelectedDepartments: Array.isArray(payload.guestsFromSelectedDepartments)
      ? payload.guestsFromSelectedDepartments
      : [],
    allGuests: normalizeGuests(payload.allGuests),
    totalGuestCount:
      typeof payload.totalGuestCount === "number" ? payload.totalGuestCount : 0,
    status: payload.status || "invited",
    createdAt: now,
    updatedAt: now,
  };

  const companyInvitationSummary = {
    invitationId,
    quizId: invitationDetails.quizId,
    quizTitle: invitationDetails.quizTitle,
    responseDeadline: invitationDetails.responseDeadline,
    responseDelayDays: invitationDetails.responseDelayDays,
    status: invitationDetails.status,
    createdAt: now,
    updatedAt: now,
  };

  const updates = {};
  updates[`companies/${companyId}/quizInvitations/${invitationId}`] = companyInvitationSummary;
  updates[`quizInvitations/${invitationId}`] = invitationDetails;

  const participantUserIds = new Set();
  const inviterUid = normalizeUserId(invitationDetails?.inviter?.uid);
  if (inviterUid) {
    participantUserIds.add(inviterUid);
  }

  [invitationDetails.allGuests, invitationDetails.selectedGuests, invitationDetails.guestsFromSelectedDepartments]
    .filter(Array.isArray)
    .forEach((guests) => {
      guests.forEach((guest) => {
        const guestUserId = normalizeUserId(guest?.id || guest?.uid);
        if (guestUserId) {
          participantUserIds.add(guestUserId);
        }
      });
    });

  participantUserIds.forEach((userId) => {
    updates[`users/${userId}/quizInvitations/${invitationId}`] = companyInvitationSummary;
  });

  await update(ref(database), updates);

  return { invitationId, companyInvitationSummary, invitationDetails };
};
