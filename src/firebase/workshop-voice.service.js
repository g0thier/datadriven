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

const toVoicePath = (roomId) => `workshopSessions/${roomId}/voice`;
const nowIso = () => new Date().toISOString();

const toParticipantPayload = (participant = {}) => ({
  id: String(participant.id || "").trim(),
  name: String(participant.name || "").trim(),
  joinedAt: String(participant.joinedAt || "").trim(),
  lastSeenAt: nowIso(),
});

export const getWorkshopVoiceParticipantCount = async (roomId) => {
  if (!roomId) return 0;

  const snapshot = await get(ref(database, `${toVoicePath(roomId)}/participants`));
  if (!snapshot.exists()) return 0;

  const participants = snapshot.val() || {};
  return Object.keys(participants).length;
};

export const setWorkshopVoiceParticipant = async (roomId, participant = {}) => {
  const payload = toParticipantPayload(participant);
  if (!roomId || !payload.id) return;

  const participantRef = ref(database, `${toVoicePath(roomId)}/participants/${payload.id}`);

  await set(participantRef, {
    ...payload,
    joinedAt: payload.joinedAt || nowIso(),
  });
};

export const touchWorkshopVoiceParticipant = async (roomId, participantId) => {
  const cleanedParticipantId = String(participantId || "").trim();
  if (!roomId || !cleanedParticipantId) return;

  await update(ref(database, `${toVoicePath(roomId)}/participants/${cleanedParticipantId}`), {
    lastSeenAt: nowIso(),
  });
};

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

export const removeWorkshopVoiceParticipant = async (roomId, participantId) => {
  const cleanedParticipantId = String(participantId || "").trim();
  if (!roomId || !cleanedParticipantId) return;

  await remove(ref(database, `${toVoicePath(roomId)}/participants/${cleanedParticipantId}`));
  await remove(ref(database, `${toVoicePath(roomId)}/signals/${cleanedParticipantId}`));
};

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

export const ackWorkshopVoiceSignal = async (roomId, participantId, signalId) => {
  const cleanedParticipantId = String(participantId || "").trim();
  const cleanedSignalId = String(signalId || "").trim();

  if (!roomId || !cleanedParticipantId || !cleanedSignalId) return;

  await remove(
    ref(database, `${toVoicePath(roomId)}/signals/${cleanedParticipantId}/${cleanedSignalId}`)
  );
};
