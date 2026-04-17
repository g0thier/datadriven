import { onValue, ref, runTransaction } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/mind-mapping.service
 * @description Realtime persistence helpers for the Mind Mapping workshop board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const nowIso = () => new Date().toISOString();

const toMindMappingPath = (sessionId) => `workshopSessions/${sessionId}/mindMapping`;

/**
 * Subscribes to a Mind Mapping session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeMindMappingSession = (sessionId, callback, onError = () => {}) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const mindMappingRef = ref(database, toMindMappingPath(sessionId));
  return onValue(
    mindMappingRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Mind Mapping participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertMindMappingParticipant = async (sessionId, participant = {}) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toMindMappingPath(sessionId)}/participants/${participant.id}`
  );
  const now = nowIso();

  await runTransaction(participantRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};

    return {
      id: participant.id,
      name: participant.name || currentData.name || "",
      email: participant.email || currentData.email || "",
      isAuthenticated: Boolean(participant.isAuthenticated ?? currentData.isAuthenticated),
      joinedAt: currentData.joinedAt || now,
      lastSeenAt: now,
    };
  });
};

/**
 * Sets step-1 central topic description for the session board.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} description - Step description text.
 * @param {{expectedPreviousDescription?:string}} [options={}] - Optional stale-write protection.
 * @returns {Promise<void>} Update completion.
 */
export const setMindMappingStep1Description = async (
  sessionId,
  participantId,
  description,
  options = {}
) => {
  if (!sessionId) return;

  const nextDescription = String(description ?? "");
  const hasExpectedPreviousDescription = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousDescription"
  );
  const expectedPreviousDescription = hasExpectedPreviousDescription
    ? String(options.expectedPreviousDescription ?? "")
    : null;

  await runTransaction(ref(database, `${toMindMappingPath(sessionId)}/step1`), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentDescription = String(currentData.description ?? "");

    const shouldRejectStaleClear =
      nextDescription === "" &&
      expectedPreviousDescription !== null &&
      expectedPreviousDescription !== currentDescription &&
      currentDescription !== "";

    if (shouldRejectStaleClear) {
      return;
    }

    return {
      description: nextDescription,
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    };
  });
};
