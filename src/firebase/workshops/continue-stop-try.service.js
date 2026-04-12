import {
  get,
  onValue,
  push,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/continue-stop-try.service
 * @description Realtime persistence helpers for the Continue Stop Try workshop board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const WORKSHOP_MAX_STICKERS_PER_COLUMN = 3;

const VALID_COLUMN_IDS = new Set(["continue", "stop", "try"]);

/**
 * Returns current time in ISO format.
 * @returns {string} ISO datetime.
 */
const nowIso = () => new Date().toISOString();

/**
 * Builds the continue-stop-try root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} Continue Stop Try root path.
 */
const toContinueStopTryPath = (sessionId) => `workshopSessions/${sessionId}/continueArreteTente`;

/**
 * Validates and normalizes a column id.
 * @param {string} columnId - Raw column id.
 * @returns {"continue"|"stop"|"try"|""} Normalized column id or empty string if invalid.
 */
const normalizeColumnId = (columnId) => {
  const normalized = String(columnId || "").trim().toLowerCase();
  return VALID_COLUMN_IDS.has(normalized) ? normalized : "";
};

/**
 * Normalizes note position with numeric fallback coordinates.
 * @param {{x?:number, y?:number}} [position={}] - Raw position.
 * @param {{x:number, y:number}} [fallback={x:40,y:40}] - Fallback coordinates.
 * @returns {{x:number, y:number}} Normalized position.
 */
const normalizePosition = (position = {}, fallback = { x: 40, y: 40 }) => {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
};

/**
 * Subscribes to a Continue Stop Try session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeContinueStopTrySession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const continueStopTryRef = ref(database, toContinueStopTryPath(sessionId));
  return onValue(
    continueStopTryRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Continue Stop Try participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertContinueStopTryParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toContinueStopTryPath(sessionId)}/participants/${participant.id}`
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
 * @returns {Promise<void>} Update completion.
 */
export const setContinueStopTryStep1Description = async (
  sessionId,
  participantId,
  description
) => {
  if (!sessionId) return;

  const now = nowIso();
  await update(ref(database, `${toContinueStopTryPath(sessionId)}/step1`), {
    description: description ?? "",
    updatedAt: now,
    updatedBy: participantId || "",
  });
};

/**
 * Sets step-5 editable placeholder text for a column.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {"continue"|"stop"|"try"} columnId - Column id.
 * @param {string} text - Placeholder value.
 * @returns {Promise<void>} Update completion.
 */
export const setContinueStopTryStep5Placeholder = async (
  sessionId,
  participantId,
  columnId,
  text
) => {
  if (!sessionId) return;

  const normalizedColumnId = normalizeColumnId(columnId);
  if (!normalizedColumnId) return;

  await update(
    ref(
      database,
      `${toContinueStopTryPath(sessionId)}/step5Placeholders/${normalizedColumnId}`
    ),
    {
      text: text ?? "",
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    }
  );
};

/**
 * Creates a Continue Stop Try note.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, columnId:"continue"|"stop"|"try", text?:string, position?:{x?:number,y?:number}}} [payload={}] - Note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createContinueStopTryNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createContinueStopTryNote: sessionId ou authorId manquant");
  }

  const normalizedColumnId = normalizeColumnId(payload?.columnId);
  if (!normalizedColumnId) {
    throw new Error("createContinueStopTryNote: columnId invalide");
  }

  const noteRef = push(ref(database, `${toContinueStopTryPath(sessionId)}/notes`));
  const noteId = noteRef.key;
  if (!noteId) {
    throw new Error("Impossible de générer noteId");
  }

  const now = nowIso();

  await set(noteRef, {
    id: noteId,
    authorId: payload.authorId,
    columnId: normalizedColumnId,
    text: payload.text ?? "",
    position: normalizePosition(payload.position),
    createdAt: now,
    updatedAt: now,
  });

  return noteId;
};

/**
 * Updates a Continue Stop Try note content or position.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{text?:string, position?:{x?:number,y?:number}, columnId?:"continue"|"stop"|"try"}} [patch={}] - Note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateContinueStopTryNote = async (sessionId, noteId, patch = {}) => {
  if (!sessionId || !noteId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "position")) {
    payload.position = normalizePosition(patch.position);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "columnId")) {
    const normalizedColumnId = normalizeColumnId(patch.columnId);
    if (!normalizedColumnId) {
      throw new Error("updateContinueStopTryNote: columnId invalide");
    }
    payload.columnId = normalizedColumnId;
  }

  await update(ref(database, `${toContinueStopTryPath(sessionId)}/notes/${noteId}`), payload);
};

/**
 * Removes a note and associated votes.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeContinueStopTryNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  const basePath = toContinueStopTryPath(sessionId);
  const updates = {
    [`${basePath}/notes/${noteId}`]: null,
  };

  const votesSnapshot = await get(ref(database, `${basePath}/votesByParticipant`));
  if (votesSnapshot.exists()) {
    const votesByParticipant = votesSnapshot.val() || {};
    Object.keys(votesByParticipant).forEach((participantId) => {
      if (votesByParticipant?.[participantId]?.[noteId]) {
        updates[`${basePath}/votesByParticipant/${participantId}/${noteId}`] = null;
      }
    });
  }

  await update(ref(database), updates);
};

/**
 * Updates only a note position.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{x?:number, y?:number}} position - Target position.
 * @returns {Promise<void>} Update completion.
 */
export const setContinueStopTryNotePosition = async (sessionId, noteId, position) => {
  if (!sessionId || !noteId) return;

  await update(ref(database, `${toContinueStopTryPath(sessionId)}/notes/${noteId}`), {
    position: normalizePosition(position),
    updatedAt: nowIso(),
  });
};

/**
 * Toggles a participant vote on a note with per-column max-votes guard.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} noteId - Note id.
 * @param {{maxVotesPerColumn?:number, validNoteIds?:Set<string>, noteColumnsById?:Object<string,string>}} [options={}] - Voting options.
 * @returns {Promise<{committed:boolean, votes:Object}>} Transaction result and resulting votes.
 */
export const toggleContinueStopTryVote = async (
  sessionId,
  participantId,
  noteId,
  options = {}
) => {
  if (!sessionId || !participantId || !noteId) {
    return { committed: false, votes: {} };
  }

  const maxVotesPerColumn = Number.isFinite(options?.maxVotesPerColumn)
    ? options.maxVotesPerColumn
    : WORKSHOP_MAX_STICKERS_PER_COLUMN;
  const validNoteIds =
    options?.validNoteIds instanceof Set ? options.validNoteIds : null;
  const noteColumnsById =
    options?.noteColumnsById && typeof options.noteColumnsById === "object"
      ? options.noteColumnsById
      : {};

  const targetColumnId = normalizeColumnId(noteColumnsById[noteId]);
  if (!targetColumnId) {
    return { committed: false, votes: {} };
  }

  const votesRef = ref(
    database,
    `${toContinueStopTryPath(sessionId)}/votesByParticipant/${participantId}`
  );

  const result = await runTransaction(votesRef, (current) => {
    const nextVotes = current && typeof current === "object" ? { ...current } : {};

    if (nextVotes[noteId]) {
      delete nextVotes[noteId];
      return Object.keys(nextVotes).length > 0 ? nextVotes : null;
    }

    const usedVotesForColumn = Object.entries(nextVotes).reduce((count, [id, enabled]) => {
      if (!enabled) return count;
      if (validNoteIds && !validNoteIds.has(id)) return count;

      const columnId = normalizeColumnId(noteColumnsById[id]);
      if (!columnId || columnId !== targetColumnId) return count;

      return count + 1;
    }, 0);

    if (usedVotesForColumn >= maxVotesPerColumn) {
      return;
    }

    nextVotes[noteId] = true;
    return nextVotes;
  });

  return {
    committed: result.committed,
    votes: result.snapshot.exists() ? result.snapshot.val() : {},
  };
};
