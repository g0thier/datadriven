import { onValue, push, ref, runTransaction, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/design-thinking.service
 * @description Realtime persistence helpers for the Design Thinking workshop.
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
 * Builds the design-thinking root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} Design Thinking root path.
 */
const toDesignThinkingPath = (sessionId) => `workshopSessions/${sessionId}/designThinking`;

/**
 * Subscribes to a Design Thinking session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeDesignThinkingSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const designThinkingRef = ref(database, toDesignThinkingPath(sessionId));

  return onValue(
    designThinkingRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Design Thinking participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertDesignThinkingParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toDesignThinkingPath(sessionId)}/participants/${participant.id}`
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
export const setDesignThinkingStep1Description = async (
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

  await runTransaction(ref(database, `${toDesignThinkingPath(sessionId)}/step1`), (current) => {
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
 * Creates a Design Thinking shared note.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Shared note payload.
 * @returns {Promise<string>} Created shared note id.
 */
export const createDesignThinkingSharedNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createDesignThinkingSharedNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toDesignThinkingPath(sessionId)}/sharedNotes`));
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
 * Updates a Design Thinking shared note text.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Shared note id.
 * @param {{text?:string}} [patch={}] - Shared note patch.
 * @param {{expectedPreviousText?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const updateDesignThinkingSharedNote = async (
  sessionId,
  noteId,
  patch = {},
  options = {}
) => {
  if (!sessionId || !noteId) return;

  const notePath = `${toDesignThinkingPath(sessionId)}/sharedNotes/${noteId}`;
  const hasNextText = Object.prototype.hasOwnProperty.call(patch, "text");

  if (!hasNextText) {
    await update(ref(database, notePath), {
      updatedAt: nowIso(),
    });
    return;
  }

  const nextText = String(patch.text ?? "");
  const hasExpectedPreviousText = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousText"
  );
  const expectedPreviousText = hasExpectedPreviousText
    ? String(options.expectedPreviousText ?? "")
    : null;

  await runTransaction(ref(database, notePath), (current) => {
    if (!current || typeof current !== "object") return current;

    const currentText = String(current.text ?? "");

    const shouldRejectStaleClear =
      nextText === "" &&
      expectedPreviousText !== null &&
      expectedPreviousText !== currentText &&
      currentText !== "";

    if (shouldRejectStaleClear) {
      return;
    }

    return {
      ...current,
      text: nextText,
      updatedAt: nowIso(),
    };
  });
};

/**
 * Removes a Design Thinking shared note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Shared note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeDesignThinkingSharedNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  const basePath = toDesignThinkingPath(sessionId);
  await update(ref(database), {
    [`${basePath}/sharedNotes/${noteId}`]: null,
  });
};
