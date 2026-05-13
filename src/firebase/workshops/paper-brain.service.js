import {
  get,
  push,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from "firebase/database";
import { database } from "../index";
import {
  createSubscribeSession,
  createUpsertParticipant,
  nowIso,
  setTextFieldWithStaleClearGuard,
} from "./workshop-service.shared";

/**
 * @module firebase/paper-brain.service
 * @description Realtime persistence helpers for the Paper Brain workshop board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const PAPER_BRAIN_MAX_STICKERS = 3;

/**
 * Builds the paper-brain root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} Paper Brain root path.
 */
const toPaperBrainPath = (sessionId) => `workshopSessions/${sessionId}/paperBrain`;

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
 * Subscribes to a Paper Brain session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeSession = createSubscribeSession(toPaperBrainPath);

/**
 * Upserts a Paper Brain participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertParticipant = createUpsertParticipant(toPaperBrainPath);

/**
 * Sets step-1 challenge description for the session board.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} description - Step description text.
 * @returns {Promise<void>} Update completion.
 */
export const setDescription = async (
  sessionId,
  participantId,
  description,
  options = {}
) => {
  if (!sessionId) return;

  await setTextFieldWithStaleClearGuard({
    path: `${toPaperBrainPath(sessionId)}/step1`,
    fieldName: "description",
    value: description,
    participantId,
    expectedPreviousValue: options?.expectedPreviousDescription,
    rejectWhenCurrentNonEmpty: true,
  });
};

/**
 * Creates a Paper Brain note.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string, position?:{x?:number,y?:number}}} [payload={}] - Note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toPaperBrainPath(sessionId)}/notes`));
  const noteId = noteRef.key;
  if (!noteId) {
    throw new Error("Impossible de générer noteId");
  }

  const now = nowIso();

  await set(noteRef, {
    id: noteId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    position: normalizePosition(payload.position),
    createdAt: now,
    updatedAt: now,
  });

  return noteId;
};

/**
 * Updates a Paper Brain note content or position.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{text?:string, position?:{x?:number,y?:number}}} [patch={}] - Note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateNote = async (sessionId, noteId, patch = {}) => {
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

  await update(ref(database, `${toPaperBrainPath(sessionId)}/notes/${noteId}`), payload);
};

/**
 * Removes a note and associated comments/votes.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  const basePath = toPaperBrainPath(sessionId);
  const updates = {
    [`${basePath}/notes/${noteId}`]: null,
    [`${basePath}/commentsByNote/${noteId}`]: null,
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
 * Adds a comment to a note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{authorId:string, text?:string}} [payload={}] - Comment payload.
 * @returns {Promise<string>} Created comment id.
 */
export const addComment = async (sessionId, noteId, payload = {}) => {
  if (!sessionId || !noteId || !payload?.authorId) {
    throw new Error("addComment: paramètres manquants");
  }

  const commentRef = push(
    ref(database, `${toPaperBrainPath(sessionId)}/commentsByNote/${noteId}`)
  );
  const commentId = commentRef.key;
  if (!commentId) {
    throw new Error("Impossible de générer commentId");
  }

  const now = nowIso();

  await set(commentRef, {
    id: commentId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    createdAt: now,
    updatedAt: now,
  });

  return commentId;
};

/**
 * Updates a note comment.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {string} commentId - Comment id.
 * @param {{text?:string}} [patch={}] - Comment patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateComment = async (
  sessionId,
  noteId,
  commentId,
  patch = {}
) => {
  if (!sessionId || !noteId || !commentId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  await update(
    ref(
      database,
      `${toPaperBrainPath(sessionId)}/commentsByNote/${noteId}/${commentId}`
    ),
    payload
  );
};

/**
 * Removes a note comment.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {string} commentId - Comment id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeComment = async (sessionId, noteId, commentId) => {
  if (!sessionId || !noteId || !commentId) return;

  await remove(
    ref(
      database,
      `${toPaperBrainPath(sessionId)}/commentsByNote/${noteId}/${commentId}`
    )
  );
};

/**
 * Updates only a note position.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{x?:number, y?:number}} position - Target position.
 * @returns {Promise<void>} Update completion.
 */
export const setNotePosition = async (sessionId, noteId, position) => {
  if (!sessionId || !noteId) return;

  await update(ref(database, `${toPaperBrainPath(sessionId)}/notes/${noteId}`), {
    position: normalizePosition(position),
    updatedAt: nowIso(),
  });
};

/**
 * Toggles a participant vote on a note with optional max-votes guard.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} noteId - Note id.
 * @param {{maxVotes?:number, validNoteIds?:Set<string>}} [options={}] - Voting options.
 * @returns {Promise<{committed:boolean, votes:Object}>} Transaction result and resulting votes.
 */
export const toggleVote = async (
  sessionId,
  participantId,
  noteId,
  options = {}
) => {
  if (!sessionId || !participantId || !noteId) {
    return { committed: false, votes: {} };
  }

  const maxVotes = Number.isFinite(options?.maxVotes)
    ? options.maxVotes
    : PAPER_BRAIN_MAX_STICKERS;
  const validNoteIds =
    options?.validNoteIds instanceof Set ? options.validNoteIds : null;

  const votesRef = ref(
    database,
    `${toPaperBrainPath(sessionId)}/votesByParticipant/${participantId}`
  );

  const result = await runTransaction(votesRef, (current) => {
    const nextVotes = current && typeof current === "object" ? { ...current } : {};

    if (nextVotes[noteId]) {
      delete nextVotes[noteId];
      return Object.keys(nextVotes).length > 0 ? nextVotes : null;
    }

    const usedVotes = Object.entries(nextVotes).reduce((count, [id, enabled]) => {
      if (!enabled) return count;
      if (validNoteIds && !validNoteIds.has(id)) return count;
      return count + 1;
    }, 0);

    if (usedVotes >= maxVotes) {
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
