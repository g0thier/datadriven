import { onValue, push, ref, runTransaction, set } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/matrice-croisee.service
 * @description Realtime persistence helpers for the Matrice croisee workshop board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Returns current time in ISO format.
 * @returns {string} ISO datetime.
 */
const nowIso = () => new Date().toISOString();
const STEP2_COLUMN_SEED_IDS = ["column-1", "column-2", "column-3"];
const STEP2_ROW_SEED_IDS = ["row-1", "row-2", "row-3"];

/**
 * Builds the matrice-croisee root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} Matrice croisee root path.
 */
const toMatriceCroiseePath = (sessionId) => `workshopSessions/${sessionId}/matriceCroisee`;
const toMatriceCroiseeStep2Path = (sessionId) => `${toMatriceCroiseePath(sessionId)}/step2`;
const toMatriceCroiseeItemsColumnsPath = (sessionId) =>
  `${toMatriceCroiseeStep2Path(sessionId)}/itemsColumns`;
const toMatriceCroiseeItemsRowsPath = (sessionId) => `${toMatriceCroiseeStep2Path(sessionId)}/itemsRows`;
const toMatriceCroiseeStep3Path = (sessionId) => `${toMatriceCroiseePath(sessionId)}/step3`;
const toMatriceCroiseeStep3NotesByCellPath = (sessionId) =>
  `${toMatriceCroiseeStep3Path(sessionId)}/notesByCell`;

const normalizeCellKeyPart = (value) =>
  String(value || "")
    .trim()
    .replace(/[.#$/[\]]/g, "-");

/**
 * Builds a deterministic Firebase-safe cell key from row and column ids.
 * @param {string} rowId - Row item id.
 * @param {string} columnId - Column item id.
 * @returns {string} Normalized cell key.
 */
export const buildMatriceCroiseeCellKey = (rowId, columnId) => {
  const normalizedRowId = normalizeCellKeyPart(rowId);
  const normalizedColumnId = normalizeCellKeyPart(columnId);

  if (!normalizedRowId || !normalizedColumnId) return "";
  return `${normalizedRowId}__${normalizedColumnId}`;
};

const makeSeedItems = (seedIds = [], participantId = "", now = nowIso()) => {
  return seedIds.reduce((accumulator, itemId) => {
    accumulator[itemId] = {
      id: itemId,
      text: "",
      createdAt: now,
      updatedAt: now,
      createdBy: participantId || "",
      updatedBy: participantId || "",
    };
    return accumulator;
  }, {});
};

const createMatriceCroiseeItem = async (sessionId, participantId, targetPath, text = "") => {
  if (!sessionId || !participantId) {
    throw new Error("createMatriceCroiseeItem: sessionId ou participantId manquant");
  }

  const itemRef = push(ref(database, targetPath(sessionId)));
  const itemId = itemRef.key;
  if (!itemId) {
    throw new Error("Impossible de générer itemId");
  }

  const now = nowIso();

  await set(itemRef, {
    id: itemId,
    text: String(text ?? ""),
    createdAt: now,
    updatedAt: now,
    createdBy: participantId,
    updatedBy: participantId,
  });

  return itemId;
};

const updateMatriceCroiseeItemText = async (
  sessionId,
  participantId,
  itemId,
  text,
  options = {},
  targetPath
) => {
  if (!sessionId || !itemId) return;

  const nextText = String(text ?? "");
  const hasExpectedPreviousText = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousText"
  );
  const expectedPreviousText = hasExpectedPreviousText
    ? String(options.expectedPreviousText ?? "")
    : null;

  await runTransaction(ref(database, `${targetPath(sessionId)}/${itemId}`), (current) => {
    if (!current || typeof current !== "object") return current;

    const currentData = current;
    const currentText = String(currentData.text ?? "");

    const shouldRejectStaleClear =
      nextText === "" &&
      expectedPreviousText !== null &&
      expectedPreviousText !== currentText &&
      currentText !== "";

    if (shouldRejectStaleClear) {
      return currentData;
    }

    return {
      ...currentData,
      id: String(currentData.id || itemId),
      text: nextText,
      updatedAt: nowIso(),
      updatedBy: participantId || String(currentData.updatedBy || ""),
      createdAt: String(currentData.createdAt || nowIso()),
      createdBy: String(currentData.createdBy || participantId || ""),
    };
  });
};

const removeMatriceCroiseeItem = async (sessionId, itemId, targetPath) => {
  if (!sessionId || !itemId) return;

  await runTransaction(ref(database, targetPath(sessionId)), (current) => {
    if (!current || typeof current !== "object") return current;

    const currentData = current;
    if (!currentData[itemId]) return currentData;

    const itemIds = Object.keys(currentData);
    if (itemIds.length <= 1) return currentData;

    const nextData = { ...currentData };
    delete nextData[itemId];

    return nextData;
  });
};

const toMatriceCroiseeCellNotesPath = (sessionId, rowId, columnId) => {
  const cellKey = buildMatriceCroiseeCellKey(rowId, columnId);
  if (!cellKey) return "";
  return `${toMatriceCroiseeStep3NotesByCellPath(sessionId)}/${cellKey}`;
};

/**
 * Subscribes to a Matrice croisee session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeMatriceCroiseeSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const matriceCroiseeRef = ref(database, toMatriceCroiseePath(sessionId));
  return onValue(
    matriceCroiseeRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Matrice croisee participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertMatriceCroiseeParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toMatriceCroiseePath(sessionId)}/participants/${participant.id}`
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
export const setMatriceCroiseeStep1Description = async (
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

  await runTransaction(ref(database, `${toMatriceCroiseePath(sessionId)}/step1`), (current) => {
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
 * Seeds the Matrice croisee structure (columns and rows) when missing.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id creating the seed.
 * @returns {Promise<void>} Seed completion.
 */
export const initializeMatriceCroiseeStructure = async (sessionId, participantId) => {
  if (!sessionId) return;

  await runTransaction(ref(database, toMatriceCroiseeStep2Path(sessionId)), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentItemsColumns =
      currentData?.itemsColumns && typeof currentData.itemsColumns === "object"
        ? currentData.itemsColumns
        : {};
    const currentItemsRows =
      currentData?.itemsRows && typeof currentData.itemsRows === "object"
        ? currentData.itemsRows
        : {};

    const hasColumns = Object.keys(currentItemsColumns).length > 0;
    const hasRows = Object.keys(currentItemsRows).length > 0;

    if (hasColumns && hasRows) {
      return current;
    }

    const now = nowIso();

    return {
      ...currentData,
      itemsColumns: hasColumns
        ? currentItemsColumns
        : makeSeedItems(STEP2_COLUMN_SEED_IDS, participantId, now),
      itemsRows: hasRows ? currentItemsRows : makeSeedItems(STEP2_ROW_SEED_IDS, participantId, now),
    };
  });
};

/**
 * Creates a column item in Matrice croisee Step 2.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {{text?:string}} [payload={}] - Item payload.
 * @returns {Promise<string>} Created item id.
 */
export const createMatriceCroiseeColumnItem = async (
  sessionId,
  participantId,
  payload = {}
) => {
  return createMatriceCroiseeItem(
    sessionId,
    participantId,
    toMatriceCroiseeItemsColumnsPath,
    payload?.text
  );
};

/**
 * Updates a column item text in Matrice croisee Step 2.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} itemId - Column item id.
 * @param {string} text - New text.
 * @param {{expectedPreviousText?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const updateMatriceCroiseeColumnItem = async (
  sessionId,
  participantId,
  itemId,
  text,
  options = {}
) => {
  await updateMatriceCroiseeItemText(
    sessionId,
    participantId,
    itemId,
    text,
    options,
    toMatriceCroiseeItemsColumnsPath
  );
};

/**
 * Removes a column item in Matrice croisee Step 2 (keeps at least one).
 * @param {string} sessionId - Workshop session id.
 * @param {string} itemId - Column item id.
 * @returns {Promise<void>} Remove completion.
 */
export const removeMatriceCroiseeColumnItem = async (sessionId, itemId) => {
  await removeMatriceCroiseeItem(sessionId, itemId, toMatriceCroiseeItemsColumnsPath);
};

/**
 * Creates a row item in Matrice croisee Step 2.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {{text?:string}} [payload={}] - Item payload.
 * @returns {Promise<string>} Created item id.
 */
export const createMatriceCroiseeRowItem = async (
  sessionId,
  participantId,
  payload = {}
) => {
  return createMatriceCroiseeItem(
    sessionId,
    participantId,
    toMatriceCroiseeItemsRowsPath,
    payload?.text
  );
};

/**
 * Updates a row item text in Matrice croisee Step 2.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} itemId - Row item id.
 * @param {string} text - New text.
 * @param {{expectedPreviousText?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const updateMatriceCroiseeRowItem = async (
  sessionId,
  participantId,
  itemId,
  text,
  options = {}
) => {
  await updateMatriceCroiseeItemText(
    sessionId,
    participantId,
    itemId,
    text,
    options,
    toMatriceCroiseeItemsRowsPath
  );
};

/**
 * Removes a row item in Matrice croisee Step 2 (keeps at least one).
 * @param {string} sessionId - Workshop session id.
 * @param {string} itemId - Row item id.
 * @returns {Promise<void>} Remove completion.
 */
export const removeMatriceCroiseeRowItem = async (sessionId, itemId) => {
  await removeMatriceCroiseeItem(sessionId, itemId, toMatriceCroiseeItemsRowsPath);
};

/**
 * Creates a note in a Matrice croisee Step 3 matrix cell.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} rowId - Row id.
 * @param {string} columnId - Column id.
 * @param {{text?:string}} [payload={}] - Note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createMatriceCroiseeCellNote = async (
  sessionId,
  participantId,
  rowId,
  columnId,
  payload = {}
) => {
  if (!sessionId || !participantId || !rowId || !columnId) {
    throw new Error("createMatriceCroiseeCellNote: paramètres manquants");
  }

  const cellNotesPath = toMatriceCroiseeCellNotesPath(sessionId, rowId, columnId);
  if (!cellNotesPath) {
    throw new Error("createMatriceCroiseeCellNote: cellule invalide");
  }

  const noteRef = push(ref(database, cellNotesPath));
  const noteId = noteRef.key;
  if (!noteId) {
    throw new Error("Impossible de générer noteId");
  }

  const now = nowIso();

  await set(noteRef, {
    id: noteId,
    text: String(payload?.text ?? ""),
    createdAt: now,
    updatedAt: now,
    createdBy: participantId,
    updatedBy: participantId,
  });

  return noteId;
};

/**
 * Updates a note text in a Matrice croisee Step 3 matrix cell.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} rowId - Row id.
 * @param {string} columnId - Column id.
 * @param {string} noteId - Note id.
 * @param {string} text - New text.
 * @param {{expectedPreviousText?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const updateMatriceCroiseeCellNote = async (
  sessionId,
  participantId,
  rowId,
  columnId,
  noteId,
  text,
  options = {}
) => {
  if (!sessionId || !noteId || !rowId || !columnId) return;

  const cellNotesPath = toMatriceCroiseeCellNotesPath(sessionId, rowId, columnId);
  if (!cellNotesPath) return;

  const nextText = String(text ?? "");
  const hasExpectedPreviousText = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousText"
  );
  const expectedPreviousText = hasExpectedPreviousText
    ? String(options.expectedPreviousText ?? "")
    : null;

  await runTransaction(ref(database, `${cellNotesPath}/${noteId}`), (current) => {
    if (!current || typeof current !== "object") return current;

    const currentData = current;
    const currentText = String(currentData.text ?? "");

    const shouldRejectStaleClear =
      nextText === "" &&
      expectedPreviousText !== null &&
      expectedPreviousText !== currentText &&
      currentText !== "";

    if (shouldRejectStaleClear) {
      return currentData;
    }

    return {
      ...currentData,
      id: String(currentData.id || noteId),
      text: nextText,
      updatedAt: nowIso(),
      updatedBy: participantId || String(currentData.updatedBy || ""),
      createdAt: String(currentData.createdAt || nowIso()),
      createdBy: String(currentData.createdBy || participantId || ""),
    };
  });
};

/**
 * Removes a note from a Matrice croisee Step 3 matrix cell.
 * @param {string} sessionId - Workshop session id.
 * @param {string} rowId - Row id.
 * @param {string} columnId - Column id.
 * @param {string} noteId - Note id.
 * @returns {Promise<void>} Remove completion.
 */
export const removeMatriceCroiseeCellNote = async (
  sessionId,
  rowId,
  columnId,
  noteId
) => {
  if (!sessionId || !rowId || !columnId || !noteId) return;

  const cellNotesPath = toMatriceCroiseeCellNotesPath(sessionId, rowId, columnId);
  if (!cellNotesPath) return;

  await set(ref(database, `${cellNotesPath}/${noteId}`), null);
};
