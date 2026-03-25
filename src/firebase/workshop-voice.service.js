import {
  get,
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { database } from "./app";

/**
 * @module firebase/workshop-voice.service
 * @description Realtime voice-room presence and signaling helpers for workshops.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Builds the base voice path for a room id.
 * @param {string} roomId - Voice room id.
 * @returns {string} Voice root path.
 */
const toVoicePath = (roomId) => `workshopSessions/${roomId}/voice`;

/**
 * Returns current time in ISO format.
 * @returns {string} ISO datetime.
 */
const nowIso = () => new Date().toISOString();

/**
 * Normalizes participant payload for persistence.
 * @param {Object} [participant={}] - Participant payload.
 * @returns {{id:string, name:string, joinedAt:string, lastSeenAt:string}} Normalized participant.
 */
const toParticipantPayload = (participant = {}) => ({
  id: String(participant.id || "").trim(),
  name: String(participant.name || "").trim(),
  joinedAt: String(participant.joinedAt || "").trim(),
  lastSeenAt: nowIso(),
});

/**
 * Returns the number of voice participants currently in a room.
 * @param {string} roomId - Voice room id.
 * @returns {Promise<number>} Participant count.
 */
export const getWorkshopVoiceParticipantCount = async (roomId) => {
  if (!roomId) return 0;

  const snapshot = await get(ref(database, `${toVoicePath(roomId)}/participants`));
  if (!snapshot.exists()) return 0;

  const participants = snapshot.val() || {};
  return Object.keys(participants).length;
};

/**
 * Upserts a voice participant in a room.
 * @param {string} roomId - Voice room id.
 * @param {Object} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const setWorkshopVoiceParticipant = async (roomId, participant = {}) => {
  const payload = toParticipantPayload(participant);
  if (!roomId || !payload.id) return;

  const participantRef = ref(database, `${toVoicePath(roomId)}/participants/${payload.id}`);

  await set(participantRef, {
    ...payload,
    joinedAt: payload.joinedAt || nowIso(),
  });
};

/**
 * Updates a participant heartbeat timestamp.
 * @param {string} roomId - Voice room id.
 * @param {string} participantId - Participant id.
 * @returns {Promise<void>} Touch completion.
 */
export const touchWorkshopVoiceParticipant = async (roomId, participantId) => {
  const cleanedParticipantId = String(participantId || "").trim();
  if (!roomId || !cleanedParticipantId) return;

  await update(ref(database, `${toVoicePath(roomId)}/participants/${cleanedParticipantId}`), {
    lastSeenAt: nowIso(),
  });
};

/**
 * Registers participant auto-removal on disconnect and returns cancel handler.
 * @param {string} roomId - Voice room id.
 * @param {string} participantId - Participant id.
 * @returns {Promise<Function>} Cancel cleanup handler.
 */
export const registerWorkshopVoiceDisconnectCleanup = async (roomId, participantId) => {
  const cleanedParticipantId = String(participantId || "").trim();
  if (!roomId || !cleanedParticipantId) return () => {};

  const participantRef = ref(database, `${toVoicePath(roomId)}/participants/${cleanedParticipantId}`);
  const disconnector = onDisconnect(participantRef);
  await disconnector.remove();

  return async () => {
    try {
      await disconnector.cancel();
    } catch (error) {
      console.error("Impossible d'annuler onDisconnect voice:", error);
    }
  };
};

/**
 * Removes a participant and its pending signals.
 * @param {string} roomId - Voice room id.
 * @param {string} participantId - Participant id.
 * @returns {Promise<void>} Removal completion.
 */
export const removeWorkshopVoiceParticipant = async (roomId, participantId) => {
  const cleanedParticipantId = String(participantId || "").trim();
  if (!roomId || !cleanedParticipantId) return;

  await remove(ref(database, `${toVoicePath(roomId)}/participants/${cleanedParticipantId}`));
  await remove(ref(database, `${toVoicePath(roomId)}/signals/${cleanedParticipantId}`));
};

/**
 * Subscribes to room voice participants.
 * @param {string} roomId - Voice room id.
 * @param {Function} callback - Listener receiving participants list.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeWorkshopVoiceParticipants = (roomId, callback, onError = () => {}) => {
  const safeCallback = typeof callback === "function" ? callback : () => {};
  const safeOnError = typeof onError === "function" ? onError : () => {};

  if (!roomId) {
    safeCallback([]);
    return () => {};
  }

  const participantsRef = ref(database, `${toVoicePath(roomId)}/participants`);

  return onValue(
    participantsRef,
    (snapshot) => {
      const rawParticipants = snapshot.exists() ? snapshot.val() || {} : {};
      const participants = Object.entries(rawParticipants)
        .map(([id, data]) => ({
          id: String(data?.id || id || "").trim(),
          name: String(data?.name || "").trim(),
          joinedAt: String(data?.joinedAt || "").trim(),
          lastSeenAt: String(data?.lastSeenAt || "").trim(),
        }))
        .filter((participant) => participant.id)
        .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), "fr"));

      safeCallback(participants);
    },
    safeOnError
  );
};

/**
 * Sends a WebRTC signal to a target participant queue.
 * @param {string} roomId - Voice room id.
 * @param {string} targetParticipantId - Target participant id.
 * @param {{from:string, type:string, payload?:Object}} [signal={}] - Signal payload.
 * @returns {Promise<string|null>} Created signal id or `null`.
 */
export const sendWorkshopVoiceSignal = async (
  roomId,
  targetParticipantId,
  signal = {}
) => {
  const cleanedTargetParticipantId = String(targetParticipantId || "").trim();
  const from = String(signal.from || "").trim();
  const type = String(signal.type || "").trim();

  if (!roomId || !cleanedTargetParticipantId || !from || !type) return null;

  const signalsRef = ref(database, `${toVoicePath(roomId)}/signals/${cleanedTargetParticipantId}`);
  const signalRef = push(signalsRef);
  const signalId = signalRef.key;

  if (!signalId) {
    throw new Error("Impossible de générer un identifiant de signal WebRTC.");
  }

  await set(signalRef, {
    id: signalId,
    from,
    type,
    payload: signal.payload ?? null,
    createdAt: nowIso(),
  });

  return signalId;
};

/**
 * Subscribes to incoming WebRTC signals for one participant.
 * @param {string} roomId - Voice room id.
 * @param {string} participantId - Local participant id.
 * @param {Function} callback - Listener receiving signal payload.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeWorkshopVoiceSignals = (
  roomId,
  participantId,
  callback,
  onError = () => {}
) => {
  const safeCallback = typeof callback === "function" ? callback : () => {};
  const safeOnError = typeof onError === "function" ? onError : () => {};
  const cleanedParticipantId = String(participantId || "").trim();

  if (!roomId || !cleanedParticipantId) {
    return () => {};
  }

  const signalsRef = ref(database, `${toVoicePath(roomId)}/signals/${cleanedParticipantId}`);
  return onChildAdded(
    signalsRef,
    (snapshot) => {
      if (!snapshot.exists()) return;

      safeCallback({
        id: String(snapshot.key || "").trim(),
        ...(snapshot.val() || {}),
      });
    },
    safeOnError
  );
};

/**
 * Acknowledges and removes a consumed WebRTC signal.
 * @param {string} roomId - Voice room id.
 * @param {string} participantId - Local participant id.
 * @param {string} signalId - Signal id.
 * @returns {Promise<void>} Acknowledgement completion.
 */
export const ackWorkshopVoiceSignal = async (roomId, participantId, signalId) => {
  const cleanedParticipantId = String(participantId || "").trim();
  const cleanedSignalId = String(signalId || "").trim();

  if (!roomId || !cleanedParticipantId || !cleanedSignalId) return;

  await remove(
    ref(database, `${toVoicePath(roomId)}/signals/${cleanedParticipantId}/${cleanedSignalId}`)
  );
};
