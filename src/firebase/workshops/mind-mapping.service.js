import { onValue, push, ref, remove, runTransaction, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/mind-mapping.service
 * @description Realtime persistence helpers for the Mind Mapping workshop board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const nowIso = () => new Date().toISOString();
const MIND_MAPPING_MAX_STICKERS = 3;

const toMindMappingPath = (sessionId) => `workshopSessions/${sessionId}/mindMapping`;

/**
 * Subscribes to a Mind Mapping session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeMindMappingSession = (sessionId, callback, onError = () => {}) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const mindMappingRef = ref(database, toMindMappingPath(sessionId));
  return onValue(
    mindMappingRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Mind Mapping participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertMindMappingParticipant = async (sessionId, participant = {}) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toMindMappingPath(sessionId)}/participants/${participant.id}`
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

/**
 * Sets step-1 central topic description for the session board.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} description - Step description text.
 * @param {{expectedPreviousDescription?:string}} [options={}] - Optional stale-write protection.
 * @returns {Promise<void>} Update completion.
 */
export const setMindMappingStep1Description = async (
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

  await runTransaction(ref(database, `${toMindMappingPath(sessionId)}/step1`), (current) => {
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

/**
 * Creates a Mind Mapping note.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createMindMappingNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createMindMappingNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toMindMappingPath(sessionId)}/notes`));
  const noteId = noteRef.key;
  if (!noteId) {
    throw new Error("Impossible de generer noteId");
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
 * Updates a Mind Mapping note text.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{text?:string}} [patch={}] - Note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateMindMappingNote = async (sessionId, noteId, patch = {}) => {
  if (!sessionId || !noteId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  await update(ref(database, `${toMindMappingPath(sessionId)}/notes/${noteId}`), payload);
};

/**
 * Removes a Mind Mapping note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeMindMappingNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  await remove(ref(database, `${toMindMappingPath(sessionId)}/notes/${noteId}`));
};

/**
 * Adds a sub-note (comment) to a note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Parent note id.
 * @param {{authorId:string, text?:string}} [payload={}] - Comment payload.
 * @returns {Promise<string>} Created comment id.
 */
export const addMindMappingComment = async (sessionId, noteId, payload = {}) => {
  if (!sessionId || !noteId || !payload?.authorId) {
    throw new Error("addMindMappingComment: sessionId, noteId ou authorId manquant");
  }

  const commentRef = push(ref(database, `${toMindMappingPath(sessionId)}/commentsByNote/${noteId}`));
  const commentId = commentRef.key;
  if (!commentId) {
    throw new Error("Impossible de generer commentId");
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
 * Updates a sub-note (comment) text.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Parent note id.
 * @param {string} commentId - Comment id.
 * @param {{text?:string}} [patch={}] - Comment patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateMindMappingComment = async (
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
    ref(database, `${toMindMappingPath(sessionId)}/commentsByNote/${noteId}/${commentId}`),
    payload
  );
};

/**
 * Removes a sub-note (comment).
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Parent note id.
 * @param {string} commentId - Comment id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeMindMappingComment = async (sessionId, noteId, commentId) => {
  if (!sessionId || !noteId || !commentId) return;

  await remove(ref(database, `${toMindMappingPath(sessionId)}/commentsByNote/${noteId}/${commentId}`));
};

const normalizeConceptEndpoint = (endpoint = {}) => ({
  noteId: String(endpoint?.noteId || "").trim(),
  ideaId: String(endpoint?.ideaId || "").trim(),
});

/**
 * Adds a concept link between two ideas.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, from:{noteId:string, ideaId:string}, to:{noteId:string, ideaId:string}, text?:string}} [payload={}] - Concept payload.
 * @returns {Promise<string>} Created concept id.
 */
export const addMindMappingConcept = async (sessionId, payload = {}) => {
  const from = normalizeConceptEndpoint(payload?.from);
  const to = normalizeConceptEndpoint(payload?.to);

  if (!sessionId || !payload?.authorId || !from.noteId || !from.ideaId || !to.noteId || !to.ideaId) {
    throw new Error("addMindMappingConcept: parametres manquants");
  }

  const conceptRef = push(ref(database, `${toMindMappingPath(sessionId)}/concepts`));
  const conceptId = conceptRef.key;
  if (!conceptId) {
    throw new Error("Impossible de generer conceptId");
  }

  const now = nowIso();

  await set(conceptRef, {
    id: conceptId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    from,
    to,
    createdAt: now,
    updatedAt: now,
  });

  return conceptId;
};

/**
 * Updates a concept text.
 * @param {string} sessionId - Workshop session id.
 * @param {string} conceptId - Concept id.
 * @param {{text?:string}} [patch={}] - Concept patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateMindMappingConcept = async (sessionId, conceptId, patch = {}) => {
  if (!sessionId || !conceptId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  await update(ref(database, `${toMindMappingPath(sessionId)}/concepts/${conceptId}`), payload);
};

/**
 * Removes a concept.
 * @param {string} sessionId - Workshop session id.
 * @param {string} conceptId - Concept id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeMindMappingConcept = async (sessionId, conceptId) => {
  if (!sessionId || !conceptId) return;

  await remove(ref(database, `${toMindMappingPath(sessionId)}/concepts/${conceptId}`));
};

/**
 * Sets the reformulation text associated with a concept.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} conceptId - Concept id.
 * @param {string} text - Reformulation text.
 * @returns {Promise<void>} Update completion.
 */
export const setReformulation = async (sessionId, participantId, conceptId, text) => {
  if (!sessionId || !conceptId) return;

  await update(ref(database, `${toMindMappingPath(sessionId)}/reformulationsByConcept/${conceptId}`), {
    text: text ?? "",
    updatedAt: nowIso(),
    updatedBy: participantId || "",
  });
};

/**
 * Toggles a participant vote on a concept with optional max-votes guard.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} conceptId - Concept id.
 * @param {{maxVotes?:number, validConceptIds?:Set<string>}} [options={}] - Voting options.
 * @returns {Promise<{committed:boolean, votes:Object}>} Transaction result and resulting votes.
 */
export const toggleMindMappingConceptVote = async (
  sessionId,
  participantId,
  conceptId,
  options = {}
) => {
  if (!sessionId || !participantId || !conceptId) {
    return { committed: false, votes: {} };
  }

  const maxVotes = Number.isFinite(options?.maxVotes)
    ? options.maxVotes
    : MIND_MAPPING_MAX_STICKERS;
  const validConceptIds =
    options?.validConceptIds instanceof Set ? options.validConceptIds : null;

  const votesRef = ref(
    database,
    `${toMindMappingPath(sessionId)}/votesByParticipant/${participantId}`
  );

  const result = await runTransaction(votesRef, (current) => {
    const nextVotes = current && typeof current === "object" ? { ...current } : {};

    if (nextVotes[conceptId]) {
      delete nextVotes[conceptId];
      return Object.keys(nextVotes).length > 0 ? nextVotes : null;
    }

    const usedVotes = Object.entries(nextVotes).reduce((count, [id, enabled]) => {
      if (!enabled) return count;
      if (validConceptIds && !validConceptIds.has(id)) return count;
      return count + 1;
    }, 0);

    if (usedVotes >= maxVotes) {
      return;
    }

    nextVotes[conceptId] = true;
    return nextVotes;
  });

  return {
    committed: result.committed,
    votes: result.snapshot.exists() ? result.snapshot.val() : {},
  };
};
