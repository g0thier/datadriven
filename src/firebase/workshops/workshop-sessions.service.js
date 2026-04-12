import { get, onValue, push, ref, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshop-sessions.service
 * @description Workshop session creation, lookup and user-session subscriptions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Normalizes guests payload for session persistence.
 * @param {Object[]} [guests=[]] - Guests list.
 * @returns {Object[]} Normalized guests list.
 */
const normalizeGuests = (guests = []) =>
  guests.map((guest) => ({
    id: guest?.id ?? "",
    label: guest?.label ?? "",
    email: guest?.email ?? "",
    phone: guest?.phone ?? "",
    firstName: guest?.firstName ?? "",
    lastName: guest?.lastName ?? "",
    name: guest?.name ?? "",
    sources: Array.isArray(guest?.sources) ? guest.sources : [],
  }));

/**
 * Normalizes workshop schedule payload.
 * @param {Object} [schedule={}] - Structured schedule object.
 * @param {Object} [payload={}] - Flat payload fallback.
 * @returns {{date:string, time:string, timezone:string}} Normalized schedule.
 */
const normalizeWorkshopSchedule = (schedule = {}, payload = {}) => ({
  date: schedule?.date ?? payload?.workshopDate ?? "",
  time: schedule?.time ?? payload?.workshopTime ?? "",
  timezone: schedule?.timezone ?? payload?.workshopTimezone ?? "UTC+01:00",
});

/**
 * Normalizes a potential user id.
 * @param {string} value - Raw id value.
 * @returns {string} Trimmed id.
 */
const normalizeUserId = (value) => String(value || "").trim();

/**
 * Converts a date value to timestamp for sorting.
 * @param {string} value - Date-like value.
 * @returns {number} Unix timestamp or `0` when invalid.
 */
const toTimestamp = (value) => {
  const time = new Date(String(value || "")).getTime();
  return Number.isFinite(time) ? time : 0;
};

/**
 * Creates a workshop session and links it to company and participant users.
 * @param {string} companyId - Company id.
 * @param {Object} [payload={}] - Session creation payload.
 * @returns {Promise<{sessionId:string, companySessionSummary:Object, sessionDetails:Object}>} Persisted session payload.
 */
export const createWorkshopSession = async (companyId, payload = {}) => {
  if (!companyId) {
    throw new Error("createWorkshopSession: companyId manquant");
  }

  const now = new Date().toISOString();
  const sessionRef = push(ref(database, "workshopSessions"));
  const sessionId = sessionRef.key;

  if (!sessionId) {
    throw new Error("Impossible de générer sessionId");
  }

  const sessionDetails = {
    sessionId,
    companyId,
    workshopId: payload.workshopId || "",
    workshopTitle: payload.workshopTitle || "",
    workshopSchedule: normalizeWorkshopSchedule(payload.workshopSchedule, payload),
    workshopDateTime: payload.workshopDateTime || "",
    workshopDuration: payload.workshopDuration || "",
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
    status: payload.status || "scheduled",
    createdAt: now,
    updatedAt: now,
  };

  const companySessionSummary = {
    sessionId,
    workshopId: sessionDetails.workshopId,
    workshopTitle: sessionDetails.workshopTitle,
    workshopDateTime: sessionDetails.workshopDateTime,
    status: sessionDetails.status,
    createdAt: now,
    updatedAt: now,
  };

  const updates = {};
  updates[`companies/${companyId}/workshopSessions/${sessionId}`] = companySessionSummary;
  updates[`workshopSessions/${sessionId}`] = sessionDetails;

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
    updates[`users/${userId}/workshopSessions/${sessionId}`] = companySessionSummary;
  });

  await update(ref(database), updates);

  return { sessionId, companySessionSummary, sessionDetails };
};

/**
 * Fetches a workshop session by id.
 * @param {string} sessionId - Session id.
 * @returns {Promise<Object|null>} Session payload or `null`.
 */
export const getWorkshopSession = async (sessionId) => {
  if (!sessionId) return null;

  const snapshot = await get(ref(database, `workshopSessions/${sessionId}`));
  if (!snapshot.exists()) return null;

  return { id: sessionId, ...snapshot.val() };
};

/**
 * Subscribes to sessions linked to a user.
 * @param {string} userId - User id.
 * @param {Function} callback - Listener receiving session summaries.
 * @param {Function} [onError] - Optional error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeUserWorkshopSessions = (userId, callback, onError) => {
  const safeCallback = typeof callback === "function" ? callback : () => {};
  const safeOnError = typeof onError === "function" ? onError : null;

  if (!userId) {
    safeCallback([]);
    return () => {};
  }

  const userSessionsRef = ref(database, `users/${userId}/workshopSessions`);
  return onValue(
    userSessionsRef,
    (snapshot) => {
      const sessionsRaw = snapshot.val() || {};
      const sessions = Object.entries(sessionsRaw)
        .map(([id, data]) => ({
          id,
          sessionId: data?.sessionId || id,
          workshopId: data?.workshopId || "",
          workshopTitle: data?.workshopTitle || "",
          workshopDateTime: data?.workshopDateTime || "",
          status: data?.status || "",
          createdAt: data?.createdAt || "",
          updatedAt: data?.updatedAt || "",
        }))
        .sort(
          (a, b) =>
            toTimestamp(b.workshopDateTime || b.createdAt) -
            toTimestamp(a.workshopDateTime || a.createdAt)
        );

      safeCallback(sessions);
    },
    (error) => {
      console.error("Impossible de charger les sessions utilisateur :", error);
      if (safeOnError) {
        safeOnError(error);
        return;
      }
      safeCallback([]);
    }
  );
};
