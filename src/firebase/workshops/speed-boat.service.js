import { onValue, push, ref, runTransaction, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/speed-boat.service
 * @description Realtime persistence helpers for the Speed Boat workshop board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Returns current time in ISO format.
 * @returns {string} ISO datetime.
 */
const nowIso = () => new Date().toISOString();

/**
 * Builds the speed-boat root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} Speed Boat root path.
 */
const toSpeedBoatPath = (sessionId) => `workshopSessions/${sessionId}/speedBoat`;

/**
 * Subscribes to a Speed Boat session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeSpeedBoatSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const speedBoatRef = ref(database, toSpeedBoatPath(sessionId));

  return onValue(
    speedBoatRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Speed Boat participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertSpeedBoatParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toSpeedBoatPath(sessionId)}/participants/${participant.id}`
  );
  const now = nowIso();

  await runTransaction(participantRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};

    return {
      id: participant.id,
      name: participant.name || currentData.name || "",
      email: participant.email || currentData.email || "",
      isAuthenticated: Boolean(
        participant.isAuthenticated ?? currentData.isAuthenticated
      ),
      joinedAt: currentData.joinedAt || now,
      lastSeenAt: now,
    };
  });
};

/**
 * Sets step-1 challenge description for the session board.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} description - Step description text.
 * @param {{expectedPreviousDescription?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const setSpeedBoatStep1Description = async (
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

  await runTransaction(ref(database, `${toSpeedBoatPath(sessionId)}/step1`), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentDescription = String(currentData.description ?? "");

    // Prevent non-empty descriptions from being cleared by stale or implicit client writes.
    if (nextDescription === "" && currentDescription !== "") {
      return;
    }

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
 * Sets step-2 objective for the session board.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} objective - Step objective text.
 * @param {{expectedPreviousObjective?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const setSpeedBoatStep2Objective = async (
  sessionId,
  participantId,
  objective,
  options = {}
) => {
  if (!sessionId) return;

  const nextObjective = String(objective ?? "");
  const hasExpectedPreviousObjective = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousObjective"
  );
  const expectedPreviousObjective = hasExpectedPreviousObjective
    ? String(options.expectedPreviousObjective ?? "")
    : null;

  await runTransaction(ref(database, `${toSpeedBoatPath(sessionId)}/step2`), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentObjective = String(currentData.objective ?? "");

    // Prevent non-empty objectives from being cleared by stale or implicit client writes.
    if (nextObjective === "" && currentObjective !== "") {
      return;
    }

    const shouldRejectStaleClear =
      nextObjective === "" &&
      expectedPreviousObjective !== null &&
      expectedPreviousObjective !== currentObjective &&
      currentObjective !== "";

    if (shouldRejectStaleClear) {
      return;
    }

    return {
      objective: nextObjective,
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    };
  });
};

/**
 * Creates a Speed Boat brake note in notesByType/brakes.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Brake note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createSpeedBoatBrakeNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createSpeedBoatBrakeNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/brakes`));
  const noteId = noteRef.key;
  if (!noteId) {
    throw new Error("Impossible de générer noteId");
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
 * Updates a Speed Boat brake note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Brake note id.
 * @param {{text?:string}} [patch={}] - Brake note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateSpeedBoatBrakeNote = async (sessionId, noteId, patch = {}) => {
  if (!sessionId || !noteId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  await update(
    ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/brakes/${noteId}`),
    payload
  );
};

/**
 * Removes a Speed Boat brake note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Brake note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeSpeedBoatBrakeNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  await update(ref(database), {
    [`${toSpeedBoatPath(sessionId)}/notesByType/brakes/${noteId}`]: null,
  });
};
