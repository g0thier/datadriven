import {
  push,
  ref,
  set,
  update,
} from "firebase/database";
import { database } from "../index";
import { normalizeHatId } from "../../pages/workshops/six-hats/sixHats.constants";
import {
  createSubscribeSession,
  createUpsertParticipant,
  nowIso,
  setTextFieldWithStaleClearGuard,
} from "./workshop-service.shared";

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

export const subscribeSession = createSubscribeSession(toSixHatsPath);

export const upsertParticipant = createUpsertParticipant(toSixHatsPath);

export const setDescription = async (
  sessionId,
  participantId,
  description,
  options = {}
) => {
  if (!sessionId) return;

  await setTextFieldWithStaleClearGuard({
    path: `${toSixHatsPath(sessionId)}/step1`,
    fieldName: "description",
    value: description,
    participantId,
    expectedPreviousValue: options?.expectedPreviousDescription,
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

  await setTextFieldWithStaleClearGuard({
    path: itemPath,
    fieldName: "text",
    value: patch.text,
    participantId: "",
    expectedPreviousValue: options?.expectedPreviousText,
    preserveCurrent: true,
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
