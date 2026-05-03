import { get, onValue, push, ref, runTransaction, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/design-thinking.service
 * @description Realtime persistence helpers for the Design Thinking workshop.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Returns current time in ISO format.
 * @returns {string} ISO datetime.
 */
const nowIso = () => new Date().toISOString();
const DESIGN_THINKING_IDEATION_MAX_STICKERS = 3;

/**
 * Builds the design-thinking root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} Design Thinking root path.
 */
const toDesignThinkingPath = (sessionId) => `workshopSessions/${sessionId}/designThinking`;
const toDesignThinkingIdeationPath = (sessionId) => `${toDesignThinkingPath(sessionId)}/ideation`;

const normalizePosition = (position = {}, fallback = { x: 40, y: 40 }) => {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
};

/**
 * Subscribes to a Design Thinking session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeDesignThinkingSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const designThinkingRef = ref(database, toDesignThinkingPath(sessionId));

  return onValue(
    designThinkingRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Design Thinking participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertDesignThinkingParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toDesignThinkingPath(sessionId)}/participants/${participant.id}`
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
export const setDesignThinkingStep1Description = async (
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

  await runTransaction(ref(database, `${toDesignThinkingPath(sessionId)}/step1`), (current) => {
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
 * Creates a Design Thinking shared note.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Shared note payload.
 * @returns {Promise<string>} Created shared note id.
 */
export const createDesignThinkingSharedNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createDesignThinkingSharedNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toDesignThinkingPath(sessionId)}/sharedNotes`));
  const noteId = noteRef.key;
  if (!noteId) {
    throw new Error("Impossible de générer noteId");
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
 * Updates a Design Thinking shared note text.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Shared note id.
 * @param {{text?:string}} [patch={}] - Shared note patch.
 * @param {{expectedPreviousText?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const updateDesignThinkingSharedNote = async (
  sessionId,
  noteId,
  patch = {},
  options = {}
) => {
  if (!sessionId || !noteId) return;

  const notePath = `${toDesignThinkingPath(sessionId)}/sharedNotes/${noteId}`;
  const hasNextText = Object.prototype.hasOwnProperty.call(patch, "text");

  if (!hasNextText) {
    await update(ref(database, notePath), {
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

  await runTransaction(ref(database, notePath), (current) => {
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

/**
 * Removes a Design Thinking shared note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Shared note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeDesignThinkingSharedNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  const basePath = toDesignThinkingPath(sessionId);
  await update(ref(database), {
    [`${basePath}/sharedNotes/${noteId}`]: null,
  });
};

/**
 * Sets shared problem statement for the session board.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} statement - Problem statement text.
 * @param {{expectedPreviousStatement?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const setDesignThinkingProblemStatement = async (
  sessionId,
  participantId,
  statement,
  options = {}
) => {
  if (!sessionId) return;

  const nextStatement = String(statement ?? "");
  const hasExpectedPreviousStatement = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousStatement"
  );
  const expectedPreviousStatement = hasExpectedPreviousStatement
    ? String(options.expectedPreviousStatement ?? "")
    : null;

  await runTransaction(ref(database, `${toDesignThinkingPath(sessionId)}/problemStatement`), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentStatement = String(currentData.text ?? "");

    // Prevent non-empty statements from being cleared by stale or implicit client writes.
    if (nextStatement === "" && currentStatement !== "") {
      return;
    }

    const shouldRejectStaleClear =
      nextStatement === "" &&
      expectedPreviousStatement !== null &&
      expectedPreviousStatement !== currentStatement &&
      currentStatement !== "";

    if (shouldRejectStaleClear) {
      return;
    }

    return {
      text: nextStatement,
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    };
  });
};

/**
 * Creates a Design Thinking ideation note.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string, position?:{x?:number,y?:number}}} [payload={}] - Note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createDesignThinkingIdeationNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createDesignThinkingIdeationNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toDesignThinkingIdeationPath(sessionId)}/notes`));
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
 * Updates a Design Thinking ideation note content or position.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{text?:string, position?:{x?:number,y?:number}}} [patch={}] - Note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateDesignThinkingIdeationNote = async (sessionId, noteId, patch = {}) => {
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

  await update(ref(database, `${toDesignThinkingIdeationPath(sessionId)}/notes/${noteId}`), payload);
};

/**
 * Removes an ideation note and associated comments/votes.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeDesignThinkingIdeationNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  const basePath = toDesignThinkingIdeationPath(sessionId);
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
 * Adds a comment to an ideation note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{authorId:string, text?:string}} [payload={}] - Comment payload.
 * @returns {Promise<string>} Created comment id.
 */
export const addDesignThinkingIdeationComment = async (sessionId, noteId, payload = {}) => {
  if (!sessionId || !noteId || !payload?.authorId) {
    throw new Error("addDesignThinkingIdeationComment: paramètres manquants");
  }

  const commentRef = push(
    ref(database, `${toDesignThinkingIdeationPath(sessionId)}/commentsByNote/${noteId}`)
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
 * Updates an ideation note comment.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {string} commentId - Comment id.
 * @param {{text?:string}} [patch={}] - Comment patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateDesignThinkingIdeationComment = async (
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
      `${toDesignThinkingIdeationPath(sessionId)}/commentsByNote/${noteId}/${commentId}`
    ),
    payload
  );
};

/**
 * Removes an ideation note comment.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {string} commentId - Comment id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeDesignThinkingIdeationComment = async (sessionId, noteId, commentId) => {
  if (!sessionId || !noteId || !commentId) return;

  await update(ref(database), {
    [`${toDesignThinkingIdeationPath(sessionId)}/commentsByNote/${noteId}/${commentId}`]: null,
  });
};

/**
 * Updates only an ideation note position.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Note id.
 * @param {{x?:number, y?:number}} position - Target position.
 * @returns {Promise<void>} Update completion.
 */
export const setDesignThinkingIdeationNotePosition = async (sessionId, noteId, position) => {
  if (!sessionId || !noteId) return;

  await update(ref(database, `${toDesignThinkingIdeationPath(sessionId)}/notes/${noteId}`), {
    position: normalizePosition(position),
    updatedAt: nowIso(),
  });
};

/**
 * Toggles a participant vote on an ideation note with optional max-votes guard.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} noteId - Note id.
 * @param {{maxVotes?:number, validNoteIds?:Set<string>}} [options={}] - Voting options.
 * @returns {Promise<{committed:boolean, votes:Object}>} Transaction result and resulting votes.
 */
export const toggleDesignThinkingIdeationVote = async (
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
    : DESIGN_THINKING_IDEATION_MAX_STICKERS;
  const validNoteIds =
    options?.validNoteIds instanceof Set ? options.validNoteIds : null;

  const votesRef = ref(
    database,
    `${toDesignThinkingIdeationPath(sessionId)}/votesByParticipant/${participantId}`
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
