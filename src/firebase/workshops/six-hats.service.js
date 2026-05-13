import {
  onValue,
  push,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";
import { database } from "../index";
import { normalizeHatId } from "../../pages/workshops/six-hats/sixHats.constants";

const nowIso = () => new Date().toISOString();

const toSixHatsPath = (sessionId) => `workshopSessions/${sessionId}/sixHats`;

const normalizeTextPatch = (patch = {}) => {
  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  return payload;
};

export const subscribeSession = (sessionId, callback, onError = () => {}) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const sixHatsRef = ref(database, toSixHatsPath(sessionId));

  return onValue(
    sixHatsRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

export const upsertParticipant = async (sessionId, participant = {}) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toSixHatsPath(sessionId)}/participants/${participant.id}`
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

export const setStep1Description = async (
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

  await runTransaction(ref(database, `${toSixHatsPath(sessionId)}/step1`), (current) => {
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

export const createItem = async (sessionId, hatId, payload = {}) => {
  const normalizedHatId = normalizeHatId(hatId);

  if (!sessionId || !normalizedHatId || !payload?.authorId) {
    throw new Error("createItem: parametres manquants");
  }

  const itemsRef = ref(database, `${toSixHatsPath(sessionId)}/itemsByHat/${normalizedHatId}`);
  const itemRef = push(itemsRef);
  const itemId = itemRef.key;

  if (!itemId) {
    throw new Error("Impossible de generer itemId");
  }

  const now = nowIso();

  await set(itemRef, {
    id: itemId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    createdAt: now,
    updatedAt: now,
  });

  return itemId;
};

export const updateItem = async (
  sessionId,
  hatId,
  itemId,
  patch = {},
  options = {}
) => {
  const normalizedHatId = normalizeHatId(hatId);

  if (!sessionId || !normalizedHatId || !itemId) return;

  const itemPath = `${toSixHatsPath(sessionId)}/itemsByHat/${normalizedHatId}/${itemId}`;

  const hasNextText = Object.prototype.hasOwnProperty.call(patch, "text");
  if (!hasNextText) {
    await update(ref(database, itemPath), normalizeTextPatch(patch));
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

  await runTransaction(ref(database, itemPath), (current) => {
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

export const removeItem = async (sessionId, hatId, itemId) => {
  const normalizedHatId = normalizeHatId(hatId);

  if (!sessionId || !normalizedHatId || !itemId) return;

  const basePath = toSixHatsPath(sessionId);
  await update(ref(database), {
    [`${basePath}/itemsByHat/${normalizedHatId}/${itemId}`]: null,
  });
};

export const setBlueConclusion = async (sessionId, participantId, text) => {
  if (!sessionId) return;

  await update(ref(database, `${toSixHatsPath(sessionId)}/step7/blueConclusion`), {
    text: text ?? "",
    updatedAt: nowIso(),
    updatedBy: participantId || "",
  });
};
