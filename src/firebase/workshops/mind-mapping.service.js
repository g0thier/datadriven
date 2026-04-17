import { onValue, push, ref, remove, runTransaction, set, update } from "firebase/database";
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

/**
 * Creates a Mind Mapping note.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createMindMappingNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createMindMappingNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toMindMappingPath(sessionId)}/notes`));
  const noteId = noteRef.key;
  if (!noteId) {
    throw new Error("Impossible de generer noteId");
  }

  const now = nowIso();

  await set(noteRef, {
    id: noteId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    createdAt: now,
    updatedAt: now,
  });

  return noteId;
};

/**
 * Updates a Mind Mapping note text.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{text?:string}} [patch={}] - Note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateMindMappingNote = async (sessionId, noteId, patch = {}) => {
  if (!sessionId || !noteId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  await update(ref(database, `${toMindMappingPath(sessionId)}/notes/${noteId}`), payload);
};

/**
 * Removes a Mind Mapping note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeMindMappingNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  await remove(ref(database, `${toMindMappingPath(sessionId)}/notes/${noteId}`));
};
