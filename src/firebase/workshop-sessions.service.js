import { get, push, ref, update } from "firebase/database";
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

export const createWorkshopSession = async (companyId, payload = {}) => {
  if (!companyId) {
    throw new Error("createWorkshopSession: companyId manquant");
  }

  const now = new Date().toISOString();
  const sessionsRef = ref(database, `companies/${companyId}/workshopSessions`);
  const sessionRef = push(sessionsRef);
  const sessionId = sessionRef.key;

  if (!sessionId) {
    throw new Error("Impossible de générer sessionId");
  }

  const privateSession = {
    sessionId,
    companyId,
    workshopId: payload.workshopId || "",
    workshopTitle: payload.workshopTitle || "",
    workshopSchedule: normalizeWorkshopSchedule(payload.workshopSchedule, payload),
    workshopDateTime: payload.workshopDateTime || "",
    workshopDuration: payload.workshopDuration || "",
    workshopLocation: payload.workshopLocation || "En ligne",
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
    officeLocations: Array.isArray(payload.officeLocations) ? payload.officeLocations : [],
    totalGuestCount:
      typeof payload.totalGuestCount === "number" ? payload.totalGuestCount : 0,
    status: payload.status || "scheduled",
    createdAt: now,
    updatedAt: now,
  };

  const publicSession = {
    sessionId,
    companyId,
    workshopId: privateSession.workshopId,
    workshopTitle: privateSession.workshopTitle,
    workshopSchedule: privateSession.workshopSchedule,
    workshopDateTime: privateSession.workshopDateTime,
    workshopDuration: privateSession.workshopDuration,
    workshopLocation: privateSession.workshopLocation,
    inviterName: privateSession.inviter.name,
    inviterEmail: privateSession.inviter.email,
    totalGuestCount: privateSession.totalGuestCount,
    status: privateSession.status,
    createdAt: now,
    updatedAt: now,
  };

  const updates = {};
  updates[`companies/${companyId}/workshopSessions/${sessionId}`] = privateSession;
  updates[`workshopSessions/${sessionId}`] = publicSession;

  await update(ref(database), updates);

  return { sessionId, publicSession, privateSession };
};

export const getWorkshopSession = async (sessionId) => {
  if (!sessionId) return null;

  const snapshot = await get(ref(database, `workshopSessions/${sessionId}`));
  if (!snapshot.exists()) return null;

  return { id: sessionId, ...snapshot.val() };
};
