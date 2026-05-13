import { onValue, push, ref, runTransaction, set, update } from "firebase/database";
import { database } from "../auth/app";

export const nowIso = () => new Date().toISOString();

export const createSubscribeSession = (rootPathBuilder) => {
  return (sessionId, callback, onError = () => {}) => {
    if (!sessionId) {
      callback(null);
      return () => {};
    }

    const sessionRef = ref(database, rootPathBuilder(sessionId));
    return onValue(
      sessionRef,
      (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
      },
      onError
    );
  };
};

export const createUpsertParticipant = (rootPathBuilder) => {
  return async (sessionId, participant = {}) => {
    if (!sessionId || !participant?.id) return;

    const participantRef = ref(
      database,
      `${rootPathBuilder(sessionId)}/participants/${participant.id}`
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
};

export const setTextFieldWithStaleClearGuard = async ({
  path,
  fieldName,
  value,
  participantId,
  expectedPreviousValue,
  rejectWhenCurrentNonEmpty = false,
  preserveCurrent = false,
}) => {
  const normalizedFieldName = String(fieldName || "text").trim() || "text";
  const nextValue = String(value ?? "");
  const hasExpectedPreviousValue = expectedPreviousValue !== undefined;
  const normalizedExpectedPreviousValue = hasExpectedPreviousValue
    ? String(expectedPreviousValue ?? "")
    : null;

  await runTransaction(ref(database, path), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentValue = String(currentData?.[normalizedFieldName] ?? "");

    if (rejectWhenCurrentNonEmpty && nextValue === "" && currentValue !== "") {
      return;
    }

    const shouldRejectStaleClear =
      nextValue === "" &&
      normalizedExpectedPreviousValue !== null &&
      normalizedExpectedPreviousValue !== currentValue &&
      currentValue !== "";

    if (shouldRejectStaleClear) {
      return;
    }

    const nextPayload = {
      [normalizedFieldName]: nextValue,
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    };

    return preserveCurrent ? { ...currentData, ...nextPayload } : nextPayload;
  });
};

export const createTextEntity = async ({ path, payload = {} }) => {
  const entityRef = push(ref(database, path));
  const entityId = entityRef.key;

  if (!entityId) {
    throw new Error("Impossible de générer un identifiant");
  }

  const now = nowIso();

  await set(entityRef, {
    id: entityId,
    ...payload,
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  });

  return entityId;
};

export const updateTextEntity = async ({ path, patch = {} }) => {
  await update(ref(database, path), {
    ...patch,
    updatedAt: nowIso(),
  });
};

export const removeTextEntity = async ({ path }) => {
  await update(ref(database), {
    [path]: null,
  });
};
