/**
 * @module workshops/paper-brain/usePaperBrainCollaboration
 * @description Collaboration hook managing realtime Paper Brain workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addComment as addCommentService,
  createNote,
  removeComment as removeCommentService,
  removeNote as removeNoteService,
  setNotePosition as setNotePositionService,
  setDescription as setDescriptionService,
  subscribeSession,
  toggleVote as toggleVoteService,
  updateComment,
  updateNote,
  upsertParticipant,
} from "../../../firebase/workshops/paper-brain.service";
import {
  asObject,
  buildVotesByItem,
  buildGridPosition,
  countVotes,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  normalizeVotesByParticipant,
  normalizePosition,
  sortByCreatedAt,
  toById,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
import { useWorkshopGuardedAction } from "../useWorkshopGuardedAction.js";
import { useWorkshopParticipants } from "../useWorkshopParticipants.js";

const MAX_STICKERS = 3;
const GRID_POSITION_CONFIG = Object.freeze({
  columns: 5,
  startX: 40,
  startY: 40,
  gapX: 290,
  gapY: 220,
});

/**
 * Provides realtime collaboration state and actions for Paper Brain sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Paper Brain behavior.
 * @returns {Object} Collaboration state (notes, comments, votes, participant, errors) and write actions.
 *
 * @example
 * import { usePaperBrainCollaboration } from "./paper-brain/useCollaboration.js";
 *
 * // Real usage reference: src/pages/workshops/WorkshopRunner.jsx
 * const collaboration = usePaperBrainCollaboration({
 *   sessionId,
 *   session,
 *   workshopId: resolvedWorkshopId,
 * });
 */
export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "paper-brain";

  const [lastNonEmptyDescription, setLastNonEmptyDescription] = useState("");
  const descriptionRestoreInFlightRef = useRef(false);

  const {
    sessionGuests,
    participant,
    participantReady,
    setSessionError,
    activeState,
    effectiveIsLoading,
    effectiveSyncError,
  } = useWorkshopCollaborationCore({
    sessionId,
    session,
    isEnabled,
    subscribeSession: subscribeSession,
    upsertParticipant: upsertParticipant,
  });
  const rawDescription = String(activeState?.step1?.description || "");

  useEffect(() => {
    setLastNonEmptyDescription("");
    descriptionRestoreInFlightRef.current = false;
  }, [isEnabled, sessionId]);

  useEffect(() => {
    if (!rawDescription) return;

    setLastNonEmptyDescription((currentValue) =>
      currentValue === rawDescription ? currentValue : rawDescription
    );
  }, [rawDescription]);

  const rawNotes = asObject(activeState?.notes);

  const notes = useMemo(() => {
    return Object.entries(rawNotes)
      .map(([noteId, data], index) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        position: normalizePosition(
          data?.position,
          buildGridPosition(index, GRID_POSITION_CONFIG)
        ),
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .sort(sortByCreatedAt);
  }, [rawNotes]);

  const notesById = useMemo(() => toById(notes), [notes]);

  const rawCommentsByNote = asObject(activeState?.commentsByNote);

  const commentsByNote = useMemo(() => {
    const normalizedComments = {};

    Object.entries(rawCommentsByNote).forEach(([noteId, comments]) => {
      if (!comments || typeof comments !== "object") return;

      normalizedComments[noteId] = Object.entries(comments)
        .map(([commentId, data]) => ({
          id: String(data?.id || commentId),
          authorId: String(data?.authorId || ""),
          text: data?.text ?? "",
          createdAt: data?.createdAt || "",
          updatedAt: data?.updatedAt || "",
        }))
        .sort(sortByCreatedAt);
    });

    return normalizedComments;
  }, [rawCommentsByNote]);

  const rawVotesByParticipant = asObject(activeState?.votesByParticipant);
  const votesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawVotesByParticipant),
    [rawVotesByParticipant]
  );

  const noteIdsSet = useMemo(() => new Set(notes.map((note) => note.id)), [notes]);

  const votesByNote = useMemo(
    () => buildVotesByItem(votesByParticipant, { validIdsSet: noteIdsSet }),
    [noteIdsSet, votesByParticipant]
  );

  const remoteParticipants = asObject(activeState?.participants);

  const authoredParticipantIds = useMemo(
    () => notes.map((note) => note.authorId),
    [notes]
  );
  const { participants, getParticipantLabel } = useWorkshopParticipants({
    sessionGuests,
    remoteParticipants,
    currentParticipant: participant,
    authoredParticipantIds,
  });

  const currentParticipantId = participant?.id || "";
  const description = rawDescription || lastNonEmptyDescription;
  const { runGuardedAction } = useWorkshopGuardedAction({
    isEnabled,
    sessionId,
    participantReady,
    participantId: currentParticipantId,
    setSessionError,
  });

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
    if (rawDescription || !lastNonEmptyDescription) return;
    if (descriptionRestoreInFlightRef.current) return;

    let cancelled = false;
    descriptionRestoreInFlightRef.current = true;

    const restoreDescription = async () => {
      try {
        await setDescriptionService(
          sessionId,
          currentParticipantId,
          lastNonEmptyDescription,
          { expectedPreviousDescription: "" }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer la description:", error);
      } finally {
        if (!cancelled) {
          descriptionRestoreInFlightRef.current = false;
        }
      }
    };

    restoreDescription();

    return () => {
      cancelled = true;
    };
  }, [
    currentParticipantId,
    isEnabled,
    lastNonEmptyDescription,
    participantReady,
    rawDescription,
    sessionId,
  ]);

  const myNotes = useMemo(
    () => notes.filter((note) => note.authorId === currentParticipantId),
    [currentParticipantId, notes]
  );

  const myVotes =
    currentParticipantId && votesByParticipant[currentParticipantId]
      ? votesByParticipant[currentParticipantId]
      : EMPTY_OBJECT;

  const myVoteCount = useMemo(() => countVotes(myVotes, noteIdsSet), [myVotes, noteIdsSet]);

  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

  const setDescription = useCallback(
    async (description, previousDescription = description) => {
      await runGuardedAction({
        errorLog: "Impossible de mettre à jour la description:",
        errorMessage: "La description n'a pas pu être enregistrée.",
        execute: () =>
          setDescriptionService(sessionId, currentParticipantId, description, {
          expectedPreviousDescription: previousDescription,
          }),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
  );

  const addNote = useCallback(
    async (options = {}) => {
      const fallbackPosition = buildGridPosition(notes.length, GRID_POSITION_CONFIG);
      const position = normalizePosition(options?.position, fallbackPosition);
      const text = options?.text ?? "";

      return runGuardedAction({
        errorLog: "Impossible d'ajouter la note:",
        errorMessage: "La note n'a pas pu être ajoutée.",
        fallback: null,
        execute: () =>
          createNote(sessionId, {
          authorId: currentParticipantId,
          text,
          position,
          }),
      });
    },
    [currentParticipantId, notes.length, runGuardedAction, sessionId]
  );

  const updateNoteText = useCallback(
    async (noteId, text) => {
      if (!noteId) {
        return;
      }

      const note = notesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de mettre à jour la note:",
        errorMessage: "La note n'a pas pu être mise à jour.",
        execute: () => updateNote(sessionId, noteId, { text }),
      });
    },
    [currentParticipantId, notesById, runGuardedAction, sessionId]
  );

  const removeNote = useCallback(
    async (noteId) => {
      if (!noteId) {
        return;
      }

      const note = notesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de supprimer la note:",
        errorMessage: "La note n'a pas pu être supprimée.",
        execute: () => removeNoteService(sessionId, noteId),
      });
    },
    [currentParticipantId, notesById, runGuardedAction, sessionId]
  );

  const addComment = useCallback(
    async (noteId, text = "") => {
      if (!noteId) {
        return null;
      }

      const note = notesById[noteId];
      if (!note || note.authorId === currentParticipantId) return null;

      return runGuardedAction({
        errorLog: "Impossible d'ajouter le commentaire:",
        errorMessage: "Le commentaire n'a pas pu être ajouté.",
        fallback: null,
        execute: () =>
          addCommentService(sessionId, noteId, {
          authorId: currentParticipantId,
          text,
          }),
      });
    },
    [currentParticipantId, notesById, runGuardedAction, sessionId]
  );

  const updateCommentText = useCallback(
    async (noteId, commentId, text) => {
      if (!noteId || !commentId) {
        return;
      }

      const comment = (commentsByNote[noteId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );

      if (!comment || comment.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de mettre à jour le commentaire:",
        errorMessage: "Le commentaire n'a pas pu être mis à jour.",
        execute: () => updateComment(sessionId, noteId, commentId, { text }),
      });
    },
    [commentsByNote, currentParticipantId, runGuardedAction, sessionId]
  );

  const removeComment = useCallback(
    async (noteId, commentId) => {
      if (!noteId || !commentId) {
        return;
      }

      const comment = (commentsByNote[noteId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );

      if (!comment || comment.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de supprimer le commentaire:",
        errorMessage: "Le commentaire n'a pas pu être supprimé.",
        execute: () => removeCommentService(sessionId, noteId, commentId),
      });
    },
    [commentsByNote, currentParticipantId, runGuardedAction, sessionId]
  );

  const setNotePosition = useCallback(
    async (noteId, position) => {
      if (!noteId) return;

      await runGuardedAction({
        errorLog: "Impossible de déplacer la note:",
        errorMessage: "La position de la note n'a pas pu être enregistrée.",
        execute: () => setNotePositionService(sessionId, noteId, position),
      });
    },
    [runGuardedAction, sessionId]
  );

  const toggleVote = useCallback(
    async (noteId) => {
      if (!noteId) {
        return { committed: false, votes: {} };
      }

      return runGuardedAction({
        errorLog: "Impossible de modifier le vote:",
        errorMessage: "Le vote n'a pas pu être enregistré.",
        fallback: { committed: false, votes: {} },
        execute: () =>
          toggleVoteService(sessionId, currentParticipantId, noteId, {
          maxVotes: MAX_STICKERS,
          validNoteIds: noteIdsSet,
          }),
      });
    },
    [
      currentParticipantId,
      noteIdsSet,
      runGuardedAction,
      sessionId,
    ]
  );

  const actions = useMemo(
    () => ({
      setDescription,
      addNote,
      updateNoteText,
      removeNote,
      addComment,
      updateCommentText,
      removeComment,
      setNotePosition,
      toggleVote,
    }),
    [
      addComment,
      addNote,
      removeComment,
      removeNote,
      setNotePosition,
      setDescription,
      toggleVote,
      updateCommentText,
      updateNoteText,
    ]
  );

  return {
    isEnabled,
    participantReady,
    isLoading: effectiveIsLoading,
    syncError: effectiveSyncError,
    participant,
    participants,
    getParticipantLabel,
    description,
    notes,
    myNotes,
    commentsByNote,
    votesByParticipant,
    votesByNote,
    myVoteCount,
    remainingVotes,
    maxStickers: MAX_STICKERS,
    actions,
  };
}

/**
 * Default export alias for usePaperBrainCollaboration.
 *
 * @type {typeof usePaperBrainCollaboration}
 * @example
 * import { usePaperBrainCollaboration } from "./paper-brain/useCollaboration.js";
 *
 * // Real usage reference (named import): src/pages/workshops/WorkshopRunner.jsx
 * const collaboration = usePaperBrainCollaboration({ sessionId, session, workshopId });
 */
export default useCollaboration;
