/**
 * @module workshops/design-thinking/useDesignThinkingCollaboration
 * @description Collaboration hook managing realtime Design Thinking workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addIdeationComment,
  createIdeationNote,
  createPrototypeFeedbackNote,
  createSharedNote,
  removeIdeationComment,
  removeIdeationNote,
  removePrototypeFeedbackNote as removePrototypeFeedbackNoteService,
  removeSharedNote as removeSharedNoteService,
  setConclusion as setConclusionService,
  setIdeationNotePosition,
  setProblemStatement as setProblemStatementService,
  setDescription as setDescriptionService,
  subscribeSession,
  toggleIdeationVote,
  updateIdeationComment,
  updateIdeationNote,
  updatePrototypeFeedbackNote,
  updateSharedNote,
  upsertParticipant,
} from "../../../firebase/workshops/design-thinking.service";
import {
  buildGridPosition,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  normalizePosition,
  sortByCreatedAt,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
import { useWorkshopParticipants } from "../useWorkshopParticipants.js";

const MAX_STICKERS = 3;
const GRID_POSITION_CONFIG = Object.freeze({
  columns: 5,
  startX: 40,
  startY: 40,
  gapX: 290,
  gapY: 220,
});
const PROTOTYPE_FEEDBACK_COLUMNS = Object.freeze([
  {
    id: "works",
    label: "Ce qui fonctionne",
    noteBgClass: "bg-green-100",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
  },
  {
    id: "problems",
    label: "Ce qui pose problème",
    noteBgClass: "bg-red-100",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
  },
  {
    id: "improvements",
    label: "Ce qui peut être amélioré",
    noteBgClass: "bg-blue-100",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
  },
]);
const PROTOTYPE_FEEDBACK_COLUMN_IDS_SET = new Set(
  PROTOTYPE_FEEDBACK_COLUMNS.map((column) => column.id)
);

const normalizePrototypeFeedbackColumnId = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return PROTOTYPE_FEEDBACK_COLUMN_IDS_SET.has(normalized) ? normalized : "";
};

/**
 * Provides realtime collaboration state and actions for Design Thinking sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Design Thinking behavior.
 * @returns {Object} Collaboration state (participant, step1, errors) and write actions.
 */
export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "design-thinking";

  const [lastNonEmptyDescription, setLastNonEmptyDescription] = useState("");
  const [lastNonEmptyProblemStatement, setLastNonEmptyProblemStatement] = useState("");
  const [lastNonEmptyConclusion, setLastNonEmptyConclusion] = useState("");
  const descriptionRestoreInFlightRef = useRef(false);
  const problemStatementRestoreInFlightRef = useRef(false);
  const conclusionRestoreInFlightRef = useRef(false);

  const {
    sessionGuests,
    participant,
    participantReady,
    syncError,
    syncErrorSessionId,
    setSessionError,
    activeState,
    lastSnapshotSessionId,
  } = useWorkshopCollaborationCore({
    sessionId,
    session,
    isEnabled,
    subscribeSession: subscribeSession,
    upsertParticipant: upsertParticipant,
    syncErrorMessage: "Impossible de se synchroniser avec le serveur.",
    participantErrorMessage: "Impossible d'enregistrer le participant.",
  });
  const rawDescription = String(activeState?.step1?.description || "");
  const rawProblemStatement = String(activeState?.problemStatement?.text || "");
  const rawConclusion = String(activeState?.conclusion?.text || "");

  useEffect(() => {
    setLastNonEmptyDescription("");
    setLastNonEmptyProblemStatement("");
    setLastNonEmptyConclusion("");
    descriptionRestoreInFlightRef.current = false;
    problemStatementRestoreInFlightRef.current = false;
    conclusionRestoreInFlightRef.current = false;
  }, [isEnabled, sessionId]);

  useEffect(() => {
    if (!rawDescription) return;

    setLastNonEmptyDescription((currentValue) =>
      currentValue === rawDescription ? currentValue : rawDescription
    );
  }, [rawDescription]);

  useEffect(() => {
    if (!rawProblemStatement) return;

    setLastNonEmptyProblemStatement((currentValue) =>
      currentValue === rawProblemStatement ? currentValue : rawProblemStatement
    );
  }, [rawProblemStatement]);

  useEffect(() => {
    if (!rawConclusion) return;

    setLastNonEmptyConclusion((currentValue) =>
      currentValue === rawConclusion ? currentValue : rawConclusion
    );
  }, [rawConclusion]);

  const remoteParticipants =
    activeState?.participants &&
    typeof activeState.participants === "object"
      ? activeState.participants
      : EMPTY_OBJECT;
  const rawSharedNotes =
    activeState?.sharedNotes &&
    typeof activeState.sharedNotes === "object"
      ? activeState.sharedNotes
      : EMPTY_OBJECT;
  const rawIdeationNotes =
    activeState?.ideation?.notes &&
    typeof activeState.ideation.notes === "object"
      ? activeState.ideation.notes
      : EMPTY_OBJECT;
  const rawIdeationCommentsByNote =
    activeState?.ideation?.commentsByNote &&
    typeof activeState.ideation.commentsByNote === "object"
      ? activeState.ideation.commentsByNote
      : EMPTY_OBJECT;
  const rawIdeationVotesByParticipant =
    activeState?.ideation?.votesByParticipant &&
    typeof activeState.ideation.votesByParticipant === "object"
      ? activeState.ideation.votesByParticipant
      : EMPTY_OBJECT;
  const rawPrototypeFeedbackNotes =
    activeState?.prototypeFeedback?.notes &&
    typeof activeState.prototypeFeedback.notes === "object"
      ? activeState.prototypeFeedback.notes
      : EMPTY_OBJECT;

  const sharedNotes = useMemo(() => {
    return Object.entries(rawSharedNotes)
      .map(([noteId, data]) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        createdAt: String(data?.createdAt || ""),
        updatedAt: String(data?.updatedAt || ""),
      }))
      .sort(sortByCreatedAt);
  }, [rawSharedNotes]);

  const sharedNotesById = useMemo(() => {
    return sharedNotes.reduce((accumulator, note) => {
      accumulator[note.id] = note;
      return accumulator;
    }, {});
  }, [sharedNotes]);

  const prototypeFeedbackNotes = useMemo(() => {
    return Object.entries(rawPrototypeFeedbackNotes)
      .map(([noteId, data]) => {
        const columnId = normalizePrototypeFeedbackColumnId(data?.columnId);
        if (!columnId) return null;

        return {
          id: String(data?.id || noteId),
          authorId: String(data?.authorId || ""),
          columnId,
          text: data?.text ?? "",
          createdAt: String(data?.createdAt || ""),
          updatedAt: String(data?.updatedAt || ""),
        };
      })
      .filter(Boolean)
      .sort(sortByCreatedAt);
  }, [rawPrototypeFeedbackNotes]);

  const prototypeFeedbackNotesById = useMemo(() => {
    return prototypeFeedbackNotes.reduce((accumulator, note) => {
      accumulator[note.id] = note;
      return accumulator;
    }, {});
  }, [prototypeFeedbackNotes]);

  const prototypeFeedbackNotesByColumn = useMemo(() => {
    const grouped = PROTOTYPE_FEEDBACK_COLUMNS.reduce((accumulator, column) => {
      accumulator[column.id] = [];
      return accumulator;
    }, {});

    prototypeFeedbackNotes.forEach((note) => {
      if (!grouped[note.columnId]) return;
      grouped[note.columnId].push(note);
    });

    return grouped;
  }, [prototypeFeedbackNotes]);

  const notes = useMemo(() => {
    return Object.entries(rawIdeationNotes)
      .map(([noteId, data], index) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        position: normalizePosition(
          data?.position,
          buildGridPosition(index, GRID_POSITION_CONFIG)
        ),
        createdAt: String(data?.createdAt || ""),
        updatedAt: String(data?.updatedAt || ""),
      }))
      .sort(sortByCreatedAt);
  }, [rawIdeationNotes]);

  const notesById = useMemo(() => {
    return notes.reduce((accumulator, note) => {
      accumulator[note.id] = note;
      return accumulator;
    }, {});
  }, [notes]);

  const commentsByNote = useMemo(() => {
    const normalizedComments = {};

    Object.entries(rawIdeationCommentsByNote).forEach(([noteId, comments]) => {
      if (!comments || typeof comments !== "object") return;

      normalizedComments[noteId] = Object.entries(comments)
        .map(([commentId, data]) => ({
          id: String(data?.id || commentId),
          authorId: String(data?.authorId || ""),
          text: data?.text ?? "",
          createdAt: String(data?.createdAt || ""),
          updatedAt: String(data?.updatedAt || ""),
        }))
        .sort(sortByCreatedAt);
    });

    return normalizedComments;
  }, [rawIdeationCommentsByNote]);

  const votesByParticipant = useMemo(() => {
    const normalizedVotes = {};

    Object.entries(rawIdeationVotesByParticipant).forEach(([participantId, votes]) => {
      if (!votes || typeof votes !== "object") return;

      const cleanedVotes = Object.entries(votes).reduce((accumulator, [noteId, enabled]) => {
        if (!enabled) return accumulator;
        accumulator[noteId] = true;
        return accumulator;
      }, {});

      if (Object.keys(cleanedVotes).length > 0) {
        normalizedVotes[participantId] = cleanedVotes;
      }
    });

    return normalizedVotes;
  }, [rawIdeationVotesByParticipant]);

  const noteIdsSet = useMemo(() => new Set(notes.map((note) => note.id)), [notes]);

  const votesByNote = useMemo(() => {
    const byNote = {};

    Object.entries(votesByParticipant).forEach(([participantId, votes]) => {
      Object.keys(votes).forEach((noteId) => {
        if (!noteIdsSet.has(noteId)) return;

        if (!byNote[noteId]) {
          byNote[noteId] = new Set();
        }

        byNote[noteId].add(participantId);
      });
    });

    return byNote;
  }, [noteIdsSet, votesByParticipant]);

  const authoredParticipantIds = useMemo(
    () => [
      ...sharedNotes.map((note) => note.authorId),
      ...prototypeFeedbackNotes.map((note) => note.authorId),
      ...notes.map((note) => note.authorId),
    ],
    [notes, prototypeFeedbackNotes, sharedNotes]
  );
  const { participants, getParticipantLabel } = useWorkshopParticipants({
    sessionGuests,
    remoteParticipants,
    currentParticipant: participant,
    authoredParticipantIds,
    variant: "default",
    mergeOrder: ["guests", "remote", "authored", "current"],
  });

  const currentParticipantId = participant?.id || "";
  const description = rawDescription || lastNonEmptyDescription;
  const problemStatement = rawProblemStatement || lastNonEmptyProblemStatement;
  const conclusion = rawConclusion || lastNonEmptyConclusion;
  const myNotes = useMemo(
    () => notes.filter((note) => note.authorId === currentParticipantId),
    [currentParticipantId, notes]
  );

  const myVotes =
    currentParticipantId && votesByParticipant[currentParticipantId]
      ? votesByParticipant[currentParticipantId]
      : EMPTY_OBJECT;

  const myVoteCount = useMemo(() => {
    return Object.keys(myVotes).reduce((count, noteId) => {
      if (!noteIdsSet.has(noteId)) return count;
      return count + 1;
    }, 0);
  }, [myVotes, noteIdsSet]);

  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

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

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
    if (rawProblemStatement || !lastNonEmptyProblemStatement) return;
    if (problemStatementRestoreInFlightRef.current) return;

    let cancelled = false;
    problemStatementRestoreInFlightRef.current = true;

    const restoreProblemStatement = async () => {
      try {
        await setProblemStatementService(
          sessionId,
          currentParticipantId,
          lastNonEmptyProblemStatement,
          { expectedPreviousStatement: "" }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer la problématique:", error);
      } finally {
        if (!cancelled) {
          problemStatementRestoreInFlightRef.current = false;
        }
      }
    };

    restoreProblemStatement();

    return () => {
      cancelled = true;
    };
  }, [
    currentParticipantId,
    isEnabled,
    lastNonEmptyProblemStatement,
    participantReady,
    rawProblemStatement,
    sessionId,
  ]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
    if (rawConclusion || !lastNonEmptyConclusion) return;
    if (conclusionRestoreInFlightRef.current) return;

    let cancelled = false;
    conclusionRestoreInFlightRef.current = true;

    const restoreConclusion = async () => {
      try {
        await setConclusionService(
          sessionId,
          currentParticipantId,
          lastNonEmptyConclusion,
          { expectedPreviousConclusion: "" }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer la conclusion:", error);
      } finally {
        if (!cancelled) {
          conclusionRestoreInFlightRef.current = false;
        }
      }
    };

    restoreConclusion();

    return () => {
      cancelled = true;
    };
  }, [
    currentParticipantId,
    isEnabled,
    lastNonEmptyConclusion,
    participantReady,
    rawConclusion,
    sessionId,
  ]);

  const setDescription = useCallback(
    async (description, previousDescription = description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setDescriptionService(sessionId, currentParticipantId, description, {
          expectedPreviousDescription: previousDescription,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour la description:", error);
        setSessionError("La description n'a pas pu être enregistrée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError
    ]
  );

  const setProblemStatement = useCallback(
    async (statement, previousStatement = problemStatement) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setProblemStatementService(sessionId, currentParticipantId, statement, {
          expectedPreviousStatement: previousStatement,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour la problématique:", error);
        setSessionError("La problématique n'a pas pu être enregistrée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      problemStatement,
      sessionId,
      setSessionError,
    ]
  );

  const setConclusion = useCallback(
    async (nextConclusion, previousConclusion = conclusion) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setConclusionService(
          sessionId,
          currentParticipantId,
          nextConclusion,
          {
            expectedPreviousConclusion: previousConclusion,
          }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la conclusion:", error);
        setSessionError("La conclusion n'a pas pu être enregistrée.");
      }
    },
    [
      conclusion,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const addSharedNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createSharedNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter la contribution:", error);
        setSessionError("La contribution n'a pas pu être ajoutée.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateSharedNoteText = useCallback(
    async (noteId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = sharedNotesById[noteId];
      if (!note) return;

      const currentText = String(note.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateSharedNote(
          sessionId,
          noteId,
          { text: nextText },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la contribution:", error);
        setSessionError("La contribution n'a pas pu être mise à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      sharedNotesById,
    ]
  );

  const removeSharedNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      if (!sharedNotesById[noteId]) return;

      try {
        await removeSharedNoteService(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer la contribution:", error);
        setSessionError("La contribution n'a pas pu être supprimée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      sharedNotesById,
    ]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const fallbackPosition = buildGridPosition(notes.length, GRID_POSITION_CONFIG);
      const position = normalizePosition(options?.position, fallbackPosition);
      const text = options?.text ?? "";

      try {
        return await createIdeationNote(sessionId, {
          authorId: currentParticipantId,
          text,
          position,
        });
      } catch (error) {
        console.error("Impossible d'ajouter la note:", error);
        setSessionError("La note n'a pas pu être ajoutée.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, notes.length, participantReady, sessionId, setSessionError]
  );

  const addPrototypeFeedbackNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const columnId = normalizePrototypeFeedbackColumnId(options?.columnId);
      if (!columnId) return null;

      try {
        return await createPrototypeFeedbackNote(sessionId, {
          authorId: currentParticipantId,
          columnId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le feedback prototype:", error);
        setSessionError("Le feedback prototype n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updatePrototypeFeedbackNoteText = useCallback(
    async (noteId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = prototypeFeedbackNotesById[noteId];
      if (!note) return;

      const currentText = String(note.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updatePrototypeFeedbackNote(
          sessionId,
          noteId,
          { text: nextText },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour le feedback prototype:", error);
        setSessionError("Le feedback prototype n'a pas pu être mis à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      prototypeFeedbackNotesById,
      sessionId,
      setSessionError,
    ]
  );

  const removePrototypeFeedbackNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      if (!prototypeFeedbackNotesById[noteId]) return;

      try {
        await removePrototypeFeedbackNoteService(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer le feedback prototype:", error);
        setSessionError("Le feedback prototype n'a pas pu être supprimé.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      prototypeFeedbackNotesById,
      sessionId,
      setSessionError,
    ]
  );

  const updateNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = notesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await updateIdeationNote(sessionId, noteId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour la note:", error);
        setSessionError("La note n'a pas pu être mise à jour.");
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
  );

  const removeNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = notesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await removeIdeationNote(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer la note:", error);
        setSessionError("La note n'a pas pu être supprimée.");
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
  );

  const addComment = useCallback(
    async (noteId, text = "") => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return null;
      }

      const note = notesById[noteId];
      if (!note || note.authorId === currentParticipantId) return null;

      try {
        return await addIdeationComment(sessionId, noteId, {
          authorId: currentParticipantId,
          text,
        });
      } catch (error) {
        console.error("Impossible d'ajouter le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
  );

  const updateCommentText = useCallback(
    async (noteId, commentId, text) => {
      if (
        !isEnabled ||
        !sessionId ||
        !participantReady ||
        !noteId ||
        !commentId ||
        !currentParticipantId
      ) {
        return;
      }

      const comment = (commentsByNote[noteId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );

      if (!comment || comment.authorId !== currentParticipantId) return;

      try {
        await updateIdeationComment(sessionId, noteId, commentId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être mis à jour.");
      }
    },
    [commentsByNote, currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const removeComment = useCallback(
    async (noteId, commentId) => {
      if (
        !isEnabled ||
        !sessionId ||
        !participantReady ||
        !noteId ||
        !commentId ||
        !currentParticipantId
      ) {
        return;
      }

      const comment = (commentsByNote[noteId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );

      if (!comment || comment.authorId !== currentParticipantId) return;

      try {
        await removeIdeationComment(sessionId, noteId, commentId);
      } catch (error) {
        console.error("Impossible de supprimer le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être supprimé.");
      }
    },
    [commentsByNote, currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const setNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setIdeationNotePosition(sessionId, noteId, position);
      } catch (error) {
        console.error("Impossible de déplacer la note:", error);
        setSessionError("La position de la note n'a pas pu être enregistrée.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const toggleVote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleIdeationVote(sessionId, currentParticipantId, noteId, {
          maxVotes: MAX_STICKERS,
          validNoteIds: noteIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier le vote:", error);
        setSessionError("Le vote n'a pas pu être enregistré.");
        return { committed: false, votes: {} };
      }
    },
    [
      currentParticipantId,
      isEnabled,
      noteIdsSet,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const actions = useMemo(
    () => ({
      setDescription,
      setProblemStatement,
      setConclusion,
      addSharedNote,
      updateSharedNoteText,
      removeSharedNote,
      addPrototypeFeedbackNote,
      updatePrototypeFeedbackNoteText,
      removePrototypeFeedbackNote,
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
      addPrototypeFeedbackNote,
      addSharedNote,
      removeComment,
      removeNote,
      removePrototypeFeedbackNote,
      removeSharedNote,
      setConclusion,
      setNotePosition,
      setProblemStatement,
      setDescription,
      toggleVote,
      updateCommentText,
      updateNoteText,
      updatePrototypeFeedbackNoteText,
      updateSharedNoteText,
    ]
  );

  const effectiveSyncError = isEnabled && syncErrorSessionId === sessionId ? syncError : "";
  const effectiveIsLoading =
    isEnabled &&
    (!participantReady || (lastSnapshotSessionId !== sessionId && !effectiveSyncError));

  return {
    isEnabled,
    participantReady,
    isLoading: effectiveIsLoading,
    syncError: effectiveSyncError,
    participant,
    participants,
    getParticipantLabel,
    description,
    sharedNotes,
    prototypeFeedbackColumns: PROTOTYPE_FEEDBACK_COLUMNS,
    prototypeFeedbackNotes,
    prototypeFeedbackNotesByColumn,
    problemStatement,
    conclusion,
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

export default useCollaboration;
