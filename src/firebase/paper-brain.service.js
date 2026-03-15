import {
  get,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from "firebase/database";
import { database } from "./app";

const PAPER_BRAIN_MAX_STICKERS = 3;

const nowIso = () => new Date().toISOString();

const toPaperBrainPath = (sessionId) => `workshopSessions/${sessionId}/paperBrain`;

const normalizePosition = (position = {}, fallback = { x: 40, y: 40 }) => {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
};

export const subscribePaperBrainSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const paperBrainRef = ref(database, toPaperBrainPath(sessionId));
  return onValue(
    paperBrainRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

export const upsertPaperBrainParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toPaperBrainPath(sessionId)}/participants/${participant.id}`
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

export const setPaperBrainStep1Description = async (
  sessionId,
  participantId,
  description
) => {
  if (!sessionId) return;

  const now = nowIso();
  await update(ref(database, `${toPaperBrainPath(sessionId)}/step1`), {
    description: description ?? "",
    updatedAt: now,
    updatedBy: participantId || "",
  });
};

export const createPaperBrainNote = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createPaperBrainNote: sessionId ou authorId manquant");
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

export const updatePaperBrainNote = async (sessionId, noteId, patch = {}) => {
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

export const removePaperBrainNote = async (sessionId, noteId) => {
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

export const addPaperBrainComment = async (sessionId, noteId, payload = {}) => {
  if (!sessionId || !noteId || !payload?.authorId) {
    throw new Error("addPaperBrainComment: paramètres manquants");
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

export const updatePaperBrainComment = async (
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

export const removePaperBrainComment = async (sessionId, noteId, commentId) => {
  if (!sessionId || !noteId || !commentId) return;

  await remove(
    ref(
      database,
      `${toPaperBrainPath(sessionId)}/commentsByNote/${noteId}/${commentId}`
    )
  );
};

export const setPaperBrainNotePosition = async (sessionId, noteId, position) => {
  if (!sessionId || !noteId) return;

  await update(ref(database, `${toPaperBrainPath(sessionId)}/notes/${noteId}`), {
    position: normalizePosition(position),
    updatedAt: nowIso(),
  });
};

export const togglePaperBrainVote = async (
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
