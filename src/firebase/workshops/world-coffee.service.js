import { onValue, push, ref, remove, runTransaction, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/world-coffee.service
 * @description Realtime persistence helpers for the World Cafe workshop.
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
 * Builds the world-cafe root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} World Cafe root path.
 */
const toWorldCoffeePath = (sessionId) => `workshopSessions/${sessionId}/worldCafe`;

/**
 * Subscribes to a World Cafe session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session workshop data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeWorldCoffeeSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const worldCoffeeRef = ref(database, toWorldCoffeePath(sessionId));
  return onValue(
    worldCoffeeRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a World Cafe participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertWorldCoffeeParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toWorldCoffeePath(sessionId)}/participants/${participant.id}`
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
 * Creates a World Cafe description line.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Description payload.
 * @returns {Promise<string>} Created description id.
 */
export const createWorldCoffeeDescription = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createWorldCoffeeDescription: sessionId ou authorId manquant");
  }

  const descriptionRef = push(ref(database, `${toWorldCoffeePath(sessionId)}/descriptions`));
  const descriptionId = descriptionRef.key;
  if (!descriptionId) {
    throw new Error("Impossible de generer descriptionId");
  }

  const now = nowIso();

  await set(descriptionRef, {
    id: descriptionId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    createdAt: now,
    updatedAt: now,
  });

  return descriptionId;
};

/**
 * Updates a World Cafe description line.
 * @param {string} sessionId - Workshop session id.
 * @param {string} descriptionId - Description id.
 * @param {{text?:string}} [patch={}] - Description patch.
 * @param {{expectedPreviousText?:string}} [options={}] - Optional concurrency guard.
 * @returns {Promise<void>} Update completion.
 */
export const updateWorldCoffeeDescription = async (
  sessionId,
  descriptionId,
  patch = {},
  options = {}
) => {
  if (!sessionId || !descriptionId) return;

  const hasTextPatch = Object.prototype.hasOwnProperty.call(patch, "text");
  if (!hasTextPatch) {
    await update(ref(database, `${toWorldCoffeePath(sessionId)}/descriptions/${descriptionId}`), {
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

  await runTransaction(
    ref(database, `${toWorldCoffeePath(sessionId)}/descriptions/${descriptionId}`),
    (current) => {
      const currentData = current && typeof current === "object" ? current : {};
      if (!currentData?.id) return current;

      const currentText = String(currentData.text ?? "");
      const shouldRejectStaleWrite =
        expectedPreviousText !== null && expectedPreviousText !== currentText;
      if (shouldRejectStaleWrite) return;

      return {
        ...currentData,
        text: nextText,
        updatedAt: nowIso(),
      };
    }
  );
};

/**
 * Removes a World Cafe description line.
 * @param {string} sessionId - Workshop session id.
 * @param {string} descriptionId - Description id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeWorldCoffeeDescription = async (sessionId, descriptionId) => {
  if (!sessionId || !descriptionId) return;

  await remove(ref(database, `${toWorldCoffeePath(sessionId)}/descriptions/${descriptionId}`));
};

