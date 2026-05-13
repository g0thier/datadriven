/**
 * @module workshops/continue-stop-try/useContinueStopTryCollaboration
 * @description Collaboration hook managing realtime Continue / Stop / Try workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createNote,
  removeNote as removeNoteService,
  setNotePosition as setNotePositionService,
  setDescription as setDescriptionService,
  setPlaceholder as setPlaceholderService,
  subscribeSession,
  toggleVote as toggleVoteService,
  updateNote,
  upsertParticipant,
} from "../../../firebase/workshops/continue-stop-try.service";
import {
  asObject,
  buildVotesByItem,
  buildGridPosition,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  normalizeVotesByParticipant,
  normalizePosition,
  sortByCreatedAt,
  toById,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
import { useWorkshopParticipants } from "../useWorkshopParticipants.js";

const COLUMN_CONFIG = [
  {
    id: "continue",
    label: "On continue",
    noteBgClass: "bg-green-100",
    noteMutedBgClass: "bg-green-50",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
    indicatorClass: "bg-green-500",
    indicatorSoftClass: "bg-green-200",
  },
  {
    id: "stop",
    label: "On arrête",
    noteBgClass: "bg-red-100",
    noteMutedBgClass: "bg-red-50",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
    indicatorClass: "bg-red-500",
    indicatorSoftClass: "bg-red-200",
  },
  {
    id: "try",
    label: "On tente",
    noteBgClass: "bg-blue-100",
    noteMutedBgClass: "bg-blue-50",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
    indicatorClass: "bg-blue-500",
    indicatorSoftClass: "bg-blue-200",
  },
];

const COLUMN_IDS = COLUMN_CONFIG.map((column) => column.id);
const COLUMN_IDS_SET = new Set(COLUMN_IDS);
const MAX_STICKERS_PER_COLUMN = 3;
const GRID_POSITION_CONFIG = Object.freeze({
  columns: 2,
  startX: 24,
  startY: 24,
  gapX: 220,
  gapY: 170,
});

const normalizeColumnId = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return COLUMN_IDS_SET.has(normalized) ? normalized : "";
};

const makeEmptyByColumn = (initialValueFactory) => {
  return COLUMN_IDS.reduce((accumulator, columnId) => {
    accumulator[columnId] = initialValueFactory(columnId);
    return accumulator;
  }, {});
};

/**
 * Provides realtime collaboration state and actions for Continue / Stop / Try sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Continue / Stop / Try behavior.
 * @returns {Object} Collaboration state and write actions.
 */
export function useCollaboration({ sessionId, session, workshopId }) {
  const isContinueStopTryWorkshop = workshopId === "continue-arrete-tente";
  const isEnabled = Boolean(sessionId) && isContinueStopTryWorkshop;

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
      .map(([noteId, data], index) => {
        const columnId = normalizeColumnId(data?.columnId);
        if (!columnId) return null;

        return {
          id: String(data?.id || noteId),
          authorId: String(data?.authorId || ""),
          columnId,
          text: data?.text ?? "",
          position: normalizePosition(
            data?.position,
            buildGridPosition(index, GRID_POSITION_CONFIG)
          ),
          createdAt: data?.createdAt || "",
          updatedAt: data?.updatedAt || "",
        };
      })
      .filter(Boolean)
      .sort(sortByCreatedAt);
  }, [rawNotes]);

  const notesByColumn = useMemo(() => {
    const grouped = makeEmptyByColumn(() => []);

    notes.forEach((note) => {
      grouped[note.columnId].push(note);
    });

    return grouped;
  }, [notes]);

  const notesById = useMemo(() => toById(notes), [notes]);

  const noteIdsSet = useMemo(() => new Set(notes.map((note) => note.id)), [notes]);

  const noteColumnsById = useMemo(() => {
    return notes.reduce((accumulator, note) => {
      accumulator[note.id] = note.columnId;
      return accumulator;
    }, {});
  }, [notes]);

  const rawVotesByParticipant = asObject(activeState?.votesByParticipant);
  const votesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawVotesByParticipant, { validIdsSet: noteIdsSet }),
    [noteIdsSet, rawVotesByParticipant]
  );

  const votesByNote = useMemo(
    () => buildVotesByItem(votesByParticipant, { validIdsSet: noteIdsSet }),
    [noteIdsSet, votesByParticipant]
  );

  const myVotes = useMemo(() => {
    const currentParticipantId = participant?.id || "";
    if (!currentParticipantId) return EMPTY_OBJECT;

    return votesByParticipant[currentParticipantId] || EMPTY_OBJECT;
  }, [participant?.id, votesByParticipant]);

  const myVoteCountByColumn = useMemo(() => {
    const countByColumn = makeEmptyByColumn(() => 0);

    Object.keys(myVotes).forEach((noteId) => {
      const columnId = noteColumnsById[noteId];
      if (!COLUMN_IDS_SET.has(columnId)) return;
      countByColumn[columnId] += 1;
    });

    return countByColumn;
  }, [myVotes, noteColumnsById]);

  const remainingVotesByColumn = useMemo(() => {
    return makeEmptyByColumn((columnId) =>
      Math.max(0, MAX_STICKERS_PER_COLUMN - (myVoteCountByColumn[columnId] || 0))
    );
  }, [myVoteCountByColumn]);

  const rankedNotesByColumn = useMemo(() => {
    return makeEmptyByColumn((columnId) => {
      const notesForColumn = notesByColumn[columnId] || EMPTY_ARRAY;

      return notesForColumn
        .map((note) => {
          const stickerSet = votesByNote[note.id];
          const stickerCount = stickerSet instanceof Set ? stickerSet.size : 0;
          return {
            ...note,
            stickerCount,
          };
        })
        .filter((note) => note.stickerCount > 0)
        .sort((a, b) => {
          if (b.stickerCount !== a.stickerCount) {
            return b.stickerCount - a.stickerCount;
          }

          if (a.createdAt !== b.createdAt) {
            return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
          }

          return String(a.id || "").localeCompare(String(b.id || ""));
        });
    });
  }, [notesByColumn, votesByNote]);

  const rawPlaceholders = asObject(activeState?.step5Placeholders);

  const placeholdersByColumn = useMemo(() => {
    return makeEmptyByColumn((columnId) => String(rawPlaceholders?.[columnId]?.text || ""));
  }, [rawPlaceholders]);

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

  const myNotesByColumn = useMemo(() => {
    const grouped = makeEmptyByColumn(() => []);

    myNotes.forEach((note) => {
      grouped[note.columnId].push(note);
    });

    return grouped;
  }, [myNotes]);
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

  const setPlaceholder = useCallback(
    async (columnId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      const normalizedColumnId = normalizeColumnId(columnId);
      if (!normalizedColumnId) return;

      try {
        await setPlaceholderService(
          sessionId,
          currentParticipantId,
          normalizedColumnId,
          text
        );
      } catch (error) {
        console.error("Impossible de mettre à jour le placeholder:", error);
        setSessionError("Le texte d'engagement n'a pas pu être enregistré.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const addNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const columnId = normalizeColumnId(options?.columnId);
      if (!columnId) return null;

      const fallbackPosition = buildGridPosition(
        (notesByColumn[columnId] || EMPTY_ARRAY).length,
        GRID_POSITION_CONFIG
      );
      const position = normalizePosition(options?.position, fallbackPosition);
      const text = options?.text ?? "";

      try {
        return await createNote(sessionId, {
          authorId: currentParticipantId,
          columnId,
          text,
          position,
        });
      } catch (error) {
        console.error("Impossible d'ajouter la note:", error);
        setSessionError("La note n'a pas pu être ajoutée.");
        return null;
      }
    },
    [
      currentParticipantId,
      isEnabled,
      notesByColumn,
      participantReady,
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
        await updateNote(sessionId, noteId, { text });
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
        await removeNoteService(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer la note:", error);
        setSessionError("La note n'a pas pu être supprimée.");
      }
    },
    [currentParticipantId, isEnabled, notesById, participantReady, sessionId, setSessionError]
  );

  const setNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setNotePositionService(sessionId, noteId, position);
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
        return await toggleVoteService(sessionId, currentParticipantId, noteId, {
          maxVotesPerColumn: MAX_STICKERS_PER_COLUMN,
          validNoteIds: noteIdsSet,
          noteColumnsById,
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
      noteColumnsById,
      noteIdsSet,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const actions = useMemo(
    () => ({
      setDescription,
      setPlaceholder,
      addNote,
      updateNoteText,
      removeNote,
      setNotePosition,
      toggleVote,
    }),
    [
      addNote,
      removeNote,
      setNotePosition,
      setDescription,
      setPlaceholder,
      toggleVote,
      updateNoteText,
    ]
  );

  const myVoteCount = Object.values(myVoteCountByColumn).reduce((sum, count) => sum + count, 0);
  const remainingVotes = Object.values(remainingVotesByColumn).reduce(
    (sum, count) => sum + count,
    0
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
    columns: COLUMN_CONFIG,
    placeholdersByColumn,
    notes,
    notesByColumn,
    rankedNotesByColumn,
    myNotes,
    myNotesByColumn,
    votesByParticipant,
    votesByNote,
    myVoteCount,
    myVoteCountByColumn,
    remainingVotes,
    remainingVotesByColumn,
    maxStickers: MAX_STICKERS_PER_COLUMN,
    actions,
  };
}

/**
 * Default export alias for useContinueStopTryCollaboration.
 *
 * @type {typeof useContinueStopTryCollaboration}
 */
export default useCollaboration;
