import { get, onValue, push, ref, update } from "firebase/database";
import { database } from "./app";

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

const normalizeWorkshopSchedule = (schedule = {}, payload = {}) => ({
  date: schedule?.date ?? payload?.workshopDate ?? "",
  time: schedule?.time ?? payload?.workshopTime ?? "",
  timezone: schedule?.timezone ?? payload?.workshopTimezone ?? "UTC+01:00",
});

const normalizeUserId = (value) => String(value || "").trim();

const toTimestamp = (value) => {
  const time = new Date(String(value || "")).getTime();
  return Number.isFinite(time) ? time : 0;
};

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

export const getWorkshopSession = async (sessionId) => {
  if (!sessionId) return null;

  const snapshot = await get(ref(database, `workshopSessions/${sessionId}`));
  if (!snapshot.exists()) return null;

  return { id: sessionId, ...snapshot.val() };
};

export const subscribeUserWorkshopSessions = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const userSessionsRef = ref(database, `users/${userId}/workshopSessions`);
  return onValue(userSessionsRef, (snapshot) => {
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

    callback(sessions);
  });
};
