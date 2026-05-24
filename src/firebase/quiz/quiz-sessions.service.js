import { onValue, push, ref, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/quiz/quiz-sessions.service
 * @description Quiz session creation helpers for motivation quizzes.
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

const toTimestamp = (value) => {
  const time = new Date(String(value || "")).getTime();
  return Number.isFinite(time) ? time : 0;
};

const normalizeSessionSummary = (id, data = {}) => ({
  id,
  sessionId: data?.sessionId || id,
  quizId: data?.quizId || "",
  responseDeadline: data?.responseDeadline || "",
  status: data?.status || "",
  createdAt: data?.createdAt || "",
  updatedAt: data?.updatedAt || "",
});

/**
 * Creates a quiz session and links it to company and participant users.
 * @param {string} companyId - Company id.
 * @param {Object} [payload={}] - Session creation payload.
 * @returns {Promise<{sessionId:string, companySessionSummary:Object, sessionDetails:Object}>}
 */
export const createQuizSession = async (companyId, payload = {}) => {
  if (!companyId) {
    throw new Error("createQuizSession: companyId manquant");
  }

  const now = new Date().toISOString();
  const sessionRef = push(ref(database, "quizSessions"));
  const sessionId = sessionRef.key;

  if (!sessionId) {
    throw new Error("Impossible de générer sessionId");
  }

  const sessionDetails = {
    sessionId,
    companyId,
    quizId: payload.quizId || "",
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

  const companySessionSummary = {
    sessionId,
    quizId: sessionDetails.quizId,
    responseDeadline: sessionDetails.responseDeadline,
    status: sessionDetails.status,
    createdAt: now,
    updatedAt: now,
  };

  const updates = {};
  updates[`companies/${companyId}/quizSessions/${sessionId}`] = companySessionSummary;
  updates[`quizSessions/${sessionId}`] = sessionDetails;

  const participantUserIds = new Set();
  const inviterUid = normalizeUserId(sessionDetails?.inviter?.uid);
  if (inviterUid) {
    participantUserIds.add(inviterUid);
  }

  [sessionDetails.allGuests, sessionDetails.selectedGuests, sessionDetails.guestsFromSelectedDepartments]
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
    updates[`users/${userId}/quizSessions/${sessionId}`] = companySessionSummary;
  });

  await update(ref(database), updates);

  return { sessionId, companySessionSummary, sessionDetails };
};

/**
 * Subscribes to quiz sessions linked to a user.
 * @param {string} userId - User id.
 * @param {Function} callback - Listener receiving session summaries.
 * @param {Function} [onError] - Optional error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeUserQuizSessions = (userId, callback, onError) => {
  const safeCallback = typeof callback === "function" ? callback : () => {};
  const safeOnError = typeof onError === "function" ? onError : null;

  if (!userId) {
    safeCallback([]);
    return () => {};
  }

  const userSessionsRef = ref(database, `users/${userId}/quizSessions`);
  return onValue(
    userSessionsRef,
    (snapshot) => {
      const sessionsRaw = snapshot.val() || {};
      const sessions = Object.entries(sessionsRaw)
        .map(([id, data]) => normalizeSessionSummary(id, data))
        .sort(
          (a, b) =>
            toTimestamp(b.responseDeadline || b.createdAt) -
            toTimestamp(a.responseDeadline || a.createdAt)
        );

      safeCallback(sessions);
    },
    (error) => {
      console.error("Impossible de charger les sessions quiz utilisateur :", error);
      if (safeOnError) {
        safeOnError(error);
        return;
      }
      safeCallback([]);
    }
  );
};

/**
 * Subscribes to a single quiz session linked to a user.
 * @param {string} userId - User id.
 * @param {string} sessionId - Session id.
 * @param {Function} callback - Listener receiving session summary or null.
 * @param {Function} [onError] - Optional error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeUserQuizSession = (userId, sessionId, callback, onError) => {
  const safeCallback = typeof callback === "function" ? callback : () => {};
  const safeOnError = typeof onError === "function" ? onError : null;
  const normalizedUserId = normalizeUserId(userId);
  const normalizedSessionId = normalizeUserId(sessionId);

  if (!normalizedUserId || !normalizedSessionId) {
    safeCallback(null);
    return () => {};
  }

  const sessionRef = ref(
    database,
    `users/${normalizedUserId}/quizSessions/${normalizedSessionId}`
  );
  return onValue(
    sessionRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        safeCallback(null);
        return;
      }

      safeCallback(normalizeSessionSummary(normalizedSessionId, snapshot.val() || {}));
    },
    (error) => {
      console.error("Impossible de charger la session quiz utilisateur :", error);
      if (safeOnError) {
        safeOnError(error);
        return;
      }
      safeCallback(null);
    }
  );
};
