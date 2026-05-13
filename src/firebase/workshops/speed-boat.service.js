import { onValue, push, ref, runTransaction, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/speed-boat.service
 * @description Realtime persistence helpers for the Speed Boat workshop board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const SPEED_BOAT_MAX_STICKERS = 3;

/**
 * Returns current time in ISO format.
 * @returns {string} ISO datetime.
 */
const nowIso = () => new Date().toISOString();

/**
 * Builds the speed-boat root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} Speed Boat root path.
 */
const toSpeedBoatPath = (sessionId) => `workshopSessions/${sessionId}/speedBoat`;

/**
 * Subscribes to a Speed Boat session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session board data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const speedBoatRef = ref(database, toSpeedBoatPath(sessionId));

  return onValue(
    speedBoatRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Upserts a Speed Boat participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toSpeedBoatPath(sessionId)}/participants/${participant.id}`
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

  await runTransaction(ref(database, `${toSpeedBoatPath(sessionId)}/step1`), (current) => {
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
 * Sets step-2 objective for the session board.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} objective - Step objective text.
 * @param {{expectedPreviousObjective?:string}} [options={}] - Concurrency guards.
 * @returns {Promise<void>} Update completion.
 */
export const setStep2Objective = async (
  sessionId,
  participantId,
  objective,
  options = {}
) => {
  if (!sessionId) return;

  const nextObjective = String(objective ?? "");
  const hasExpectedPreviousObjective = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousObjective"
  );
  const expectedPreviousObjective = hasExpectedPreviousObjective
    ? String(options.expectedPreviousObjective ?? "")
    : null;

  await runTransaction(ref(database, `${toSpeedBoatPath(sessionId)}/step2`), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentObjective = String(currentData.objective ?? "");

    // Prevent non-empty objectives from being cleared by stale or implicit client writes.
    if (nextObjective === "" && currentObjective !== "") {
      return;
    }

    const shouldRejectStaleClear =
      nextObjective === "" &&
      expectedPreviousObjective !== null &&
      expectedPreviousObjective !== currentObjective &&
      currentObjective !== "";

    if (shouldRejectStaleClear) {
      return;
    }

    return {
      objective: nextObjective,
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    };
  });
};

/**
 * Creates a Speed Boat brake note in notesByType/brakes.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Brake note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createBrakeNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createBrakeNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/brakes`));
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
 * Updates a Speed Boat brake note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Brake note id.
 * @param {{text?:string}} [patch={}] - Brake note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateBrakeNote = async (sessionId, noteId, patch = {}) => {
  if (!sessionId || !noteId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  await update(
    ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/brakes/${noteId}`),
    payload
  );
};

/**
 * Removes a Speed Boat brake note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Brake note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeBrakeNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  await update(ref(database), {
    [`${toSpeedBoatPath(sessionId)}/notesByType/brakes/${noteId}`]: null,
  });
};

/**
 * Creates a Speed Boat lever note in notesByType/levers.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Lever note payload.
 * @returns {Promise<string>} Created note id.
 */
export const createLeverNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createLeverNote: sessionId ou authorId manquant");
  }

  const noteRef = push(ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/levers`));
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
 * Updates a Speed Boat lever note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Lever note id.
 * @param {{text?:string}} [patch={}] - Lever note patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateLeverNote = async (sessionId, noteId, patch = {}) => {
  if (!sessionId || !noteId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  await update(
    ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/levers/${noteId}`),
    payload
  );
};

/**
 * Removes a Speed Boat lever note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Lever note id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeLeverNote = async (sessionId, noteId) => {
  if (!sessionId || !noteId) return;

  await update(ref(database), {
    [`${toSpeedBoatPath(sessionId)}/notesByType/levers/${noteId}`]: null,
  });
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
 * Sets the position of a Speed Boat brake note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Brake note id.
 * @param {{x?:number,y?:number}} [position={}] - Next note position.
 * @returns {Promise<void>} Update completion.
 */
export const setBrakeNotePosition = async (sessionId, noteId, position = {}) => {
  if (!sessionId || !noteId) return;

  await update(
    ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/brakes/${noteId}`),
    {
      position: normalizePosition(position),
      updatedAt: nowIso(),
    }
  );
};

/**
 * Sets the position of a Speed Boat lever note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} noteId - Lever note id.
 * @param {{x?:number,y?:number}} [position={}] - Next note position.
 * @returns {Promise<void>} Update completion.
 */
export const setLeverNotePosition = async (sessionId, noteId, position = {}) => {
  if (!sessionId || !noteId) return;

  await update(
    ref(database, `${toSpeedBoatPath(sessionId)}/notesByType/levers/${noteId}`),
    {
      position: normalizePosition(position),
      updatedAt: nowIso(),
    }
  );
};

/**
 * Toggles a participant vote on a brake note with optional max-votes guard.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Participant id.
 * @param {string} noteId - Brake note id.
 * @param {{maxVotes?:number, validNoteIds?:Set<string>}} [options={}] - Voting options.
 * @returns {Promise<{committed:boolean, votes:Object}>} Transaction result and resulting votes.
 */
export const toggleBrakeVote = async (
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
    : SPEED_BOAT_MAX_STICKERS;
  const validNoteIds =
    options?.validNoteIds instanceof Set ? options.validNoteIds : null;

  const votesRef = ref(
    database,
    `${toSpeedBoatPath(sessionId)}/votesByParticipant/${participantId}`
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

/**
 * Sets the step-8 action text linked to a brake note.
 * @param {string} sessionId - Workshop session id.
 * @param {string} participantId - Editor participant id.
 * @param {string} brakeId - Brake note id.
 * @param {string} text - Action text.
 * @returns {Promise<void>} Update completion.
 */
export const setStep8BrakeAction = async (
  sessionId,
  participantId,
  brakeId,
  text
) => {
  if (!sessionId || !brakeId) return;

  await update(
    ref(database, `${toSpeedBoatPath(sessionId)}/step8ActionsByBrake/${brakeId}`),
    {
      text: String(text ?? ""),
      updatedAt: nowIso(),
      updatedBy: String(participantId || ""),
    }
  );
};
