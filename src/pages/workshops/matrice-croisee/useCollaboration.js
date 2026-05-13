/**
 * @module workshops/matrice-croisee/useMatriceCroiseeCollaboration
 * @description Collaboration hook managing realtime Matrice croisee workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildCellKey,
  createCellNote,
  createColumnItem,
  createRowItem,
  initializeStructure as initializeStructureService,
  removeCellNote as removeCellNoteService,
  removeColumnItem as removeColumnItemService,
  removeRowItem as removeRowItemService,
  setConcept as setConceptService,
  setDescription as setDescriptionService,
  subscribeSession,
  toggleVote as toggleVoteService,
  updateCellNote,
  updateColumnItem,
  updateRowItem,
  upsertParticipant,
} from "../../../firebase/workshops/matrice-croisee.service";
import {
  asObject,
  buildVotesByItem,
  countVotes,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  normalizeVotesByParticipant,
  sortByCreatedAt,
  toById,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
import { useWorkshopParticipants } from "../useWorkshopParticipants.js";

const MAX_STICKERS = 1;

/**
 * Provides realtime collaboration state and actions for Matrice croisee sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Matrice croisee behavior.
 * @returns {Object} Collaboration state and write actions.
 */
export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "matrice-croisee";

  const [lastNonEmptyDescription, setLastNonEmptyDescription] = useState("");
  const descriptionRestoreInFlightRef = useRef(false);

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
  const rawConcept = String(activeState?.step5?.concept?.text || "");
  const rawColumnItems = asObject(activeState?.step2?.itemsColumns);
  const rawRowItems = asObject(activeState?.step2?.itemsRows);
  const rawCellNotesByCell = asObject(activeState?.step3?.notesByCell);
  const rawVotesByParticipant = asObject(activeState?.votesByParticipant);

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

  const columnItems = useMemo(() => {
    return Object.entries(rawColumnItems)
      .map(([itemId, data]) => ({
        id: String(data?.id || itemId),
        text: data?.text ?? "",
        createdAt: String(data?.createdAt || ""),
        updatedAt: String(data?.updatedAt || ""),
        createdBy: String(data?.createdBy || ""),
        updatedBy: String(data?.updatedBy || ""),
      }))
      .sort(sortByCreatedAt);
  }, [rawColumnItems]);

  const rowItems = useMemo(() => {
    return Object.entries(rawRowItems)
      .map(([itemId, data]) => ({
        id: String(data?.id || itemId),
        text: data?.text ?? "",
        createdAt: String(data?.createdAt || ""),
        updatedAt: String(data?.updatedAt || ""),
        createdBy: String(data?.createdBy || ""),
        updatedBy: String(data?.updatedBy || ""),
      }))
      .sort(sortByCreatedAt);
  }, [rawRowItems]);

  const columnItemsById = useMemo(() => toById(columnItems), [columnItems]);

  const rowItemsById = useMemo(() => toById(rowItems), [rowItems]);

  const cellNotesByKey = useMemo(() => {
    const normalizedByKey = {};

    Object.entries(rawCellNotesByCell).forEach(([cellKey, notes]) => {
      if (!notes || typeof notes !== "object") return;

      const normalizedNotes = Object.entries(notes)
        .map(([noteId, data]) => ({
          id: String(data?.id || noteId),
          text: data?.text ?? "",
          createdAt: String(data?.createdAt || ""),
          updatedAt: String(data?.updatedAt || ""),
          createdBy: String(data?.createdBy || ""),
          updatedBy: String(data?.updatedBy || ""),
        }))
        .sort(sortByCreatedAt);

      normalizedByKey[cellKey] = normalizedNotes;
    });

    return normalizedByKey;
  }, [rawCellNotesByCell]);

  const votesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawVotesByParticipant),
    [rawVotesByParticipant]
  );

  const noteIdsSet = useMemo(() => {
    const ids = new Set();

    Object.values(cellNotesByKey).forEach((notes) => {
      if (!Array.isArray(notes)) return;

      notes.forEach((note) => {
        const noteId = String(note?.id || "");
        if (!noteId) return;
        ids.add(noteId);
      });
    });

    return ids;
  }, [cellNotesByKey]);

  const votesByNote = useMemo(
    () => buildVotesByItem(votesByParticipant, { validIdsSet: noteIdsSet }),
    [noteIdsSet, votesByParticipant]
  );

  const selectedTopIdea = useMemo(() => {
    const rankedNotes = [];

    rowItems.forEach((rowItem, rowIndex) => {
      columnItems.forEach((columnItem, columnIndex) => {
        const cellKey = buildCellKey(rowItem.id, columnItem.id);
        if (!cellKey) return;

        const notes = Array.isArray(cellNotesByKey[cellKey]) ? cellNotesByKey[cellKey] : EMPTY_ARRAY;

        notes.forEach((note, noteIndex) => {
          const noteId = String(note?.id || "").trim();
          if (!noteId) return;

          const voteSet = votesByNote[noteId];
          const voteCount = voteSet instanceof Set ? voteSet.size : 0;
          if (voteCount <= 0) return;

          rankedNotes.push({
            noteId,
            noteText: String(note?.text || ""),
            rowId: rowItem.id,
            rowText: String(rowItem?.text || ""),
            columnId: columnItem.id,
            columnText: String(columnItem?.text || ""),
            voteCount,
            rowIndex,
            columnIndex,
            noteIndex,
          });
        });
      });
    });

    if (rankedNotes.length === 0) return null;

    rankedNotes.sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }

      if (a.rowIndex !== b.rowIndex) {
        return a.rowIndex - b.rowIndex;
      }

      if (a.columnIndex !== b.columnIndex) {
        return a.columnIndex - b.columnIndex;
      }

      if (a.noteIndex !== b.noteIndex) {
        return a.noteIndex - b.noteIndex;
      }

      return a.noteId.localeCompare(b.noteId);
    });

    const winner = rankedNotes[0];

    return {
      noteId: winner.noteId,
      noteText: winner.noteText,
      rowId: winner.rowId,
      rowText: winner.rowText,
      rowIndex: winner.rowIndex,
      columnId: winner.columnId,
      columnText: winner.columnText,
      columnIndex: winner.columnIndex,
      voteCount: winner.voteCount,
    };
  }, [cellNotesByKey, columnItems, rowItems, votesByNote]);

  const remoteParticipants = asObject(activeState?.participants);

  const { participants, getParticipantLabel } = useWorkshopParticipants({
    sessionGuests,
    remoteParticipants,
    currentParticipant: participant,
    authoredParticipantIds: EMPTY_ARRAY,
    variant: "default",
    mergeOrder: ["guests", "remote", "authored", "current"],
  });

  const currentParticipantId = participant?.id || "";
  const description = rawDescription || lastNonEmptyDescription;
  const concept = rawConcept;
  const myVotes = useMemo(() => {
    if (!currentParticipantId) return EMPTY_OBJECT;
    return votesByParticipant[currentParticipantId] || EMPTY_OBJECT;
  }, [currentParticipantId, votesByParticipant]);
  const myVoteCount = useMemo(() => countVotes(myVotes, noteIdsSet), [myVotes, noteIdsSet]);
  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return () => {};

    let cancelled = false;

    const seedStructure = async () => {
      try {
        await initializeStructureService(sessionId, currentParticipantId);
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible d'initialiser la matrice:", error);
        setSessionError("La matrice n'a pas pu être initialisée.");
      }
    };

    seedStructure();

    return () => {
      cancelled = true;
    };
  }, [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]);

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

  const setConcept = useCallback(
    async (text) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setConceptService(sessionId, currentParticipantId, text);
      } catch (error) {
        console.error("Impossible d'enregistrer le concept:", error);
        setSessionError("Le concept n'a pas pu être enregistré.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const initializeStructure = useCallback(async () => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) {
      return false;
    }

    try {
      await initializeStructureService(sessionId, currentParticipantId);
      return true;
    } catch (error) {
      console.error("Impossible d'initialiser la matrice:", error);
      setSessionError("La matrice n'a pas pu être initialisée.");
      return false;
    }
  }, [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]);

  const addColumnItem = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createColumnItem(sessionId, currentParticipantId, {
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter une colonne:", error);
        setSessionError("La colonne n'a pas pu être ajoutée.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateColumnItemText = useCallback(
    async (itemId, text, previousText) => {
      if (!isEnabled || !sessionId || !participantReady || !itemId || !currentParticipantId) {
        return;
      }

      const currentText = String(columnItemsById[itemId]?.text || "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === undefined ? currentText : String(previousText ?? "");

      try {
        await updateColumnItem(
          sessionId,
          currentParticipantId,
          itemId,
          nextText,
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la colonne:", error);
        setSessionError("La colonne n'a pas pu être mise à jour.");
      }
    },
    [
      columnItemsById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeColumnItem = useCallback(
    async (itemId) => {
      if (!isEnabled || !sessionId || !participantReady || !itemId) return;
      if (columnItems.length <= 1) return;

      try {
        await removeColumnItemService(sessionId, itemId);
      } catch (error) {
        console.error("Impossible de supprimer la colonne:", error);
        setSessionError("La colonne n'a pas pu être supprimée.");
      }
    },
    [columnItems.length, isEnabled, participantReady, sessionId, setSessionError]
  );

  const addRowItem = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createRowItem(sessionId, currentParticipantId, {
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter un rang:", error);
        setSessionError("Le rang n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateRowItemText = useCallback(
    async (itemId, text, previousText) => {
      if (!isEnabled || !sessionId || !participantReady || !itemId || !currentParticipantId) {
        return;
      }

      const currentText = String(rowItemsById[itemId]?.text || "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === undefined ? currentText : String(previousText ?? "");

      try {
        await updateRowItem(sessionId, currentParticipantId, itemId, nextText, {
          expectedPreviousText,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour le rang:", error);
        setSessionError("Le rang n'a pas pu être mis à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      rowItemsById,
      sessionId,
      setSessionError,
    ]
  );

  const removeRowItem = useCallback(
    async (itemId) => {
      if (!isEnabled || !sessionId || !participantReady || !itemId) return;
      if (rowItems.length <= 1) return;

      try {
        await removeRowItemService(sessionId, itemId);
      } catch (error) {
        console.error("Impossible de supprimer le rang:", error);
        setSessionError("Le rang n'a pas pu être supprimé.");
      }
    },
    [isEnabled, participantReady, rowItems.length, sessionId, setSessionError]
  );

  const addCellNote = useCallback(
    async (rowId, columnId, options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;
      if (!rowId || !columnId) return null;

      try {
        return await createCellNote(
          sessionId,
          currentParticipantId,
          rowId,
          columnId,
          { text: options?.text ?? "" }
        );
      } catch (error) {
        console.error("Impossible d'ajouter un post-it:", error);
        setSessionError("Le post-it n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateCellNoteText = useCallback(
    async (rowId, columnId, noteId, text, previousText) => {
      if (
        !isEnabled ||
        !sessionId ||
        !participantReady ||
        !currentParticipantId ||
        !rowId ||
        !columnId ||
        !noteId
      ) {
        return;
      }

      const cellKey = buildCellKey(rowId, columnId);
      const currentNotes = Array.isArray(cellNotesByKey[cellKey]) ? cellNotesByKey[cellKey] : EMPTY_ARRAY;
      const currentText = String(
        currentNotes.find((note) => String(note?.id || "") === String(noteId))?.text || ""
      );
      const nextText = String(text ?? "");

      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === undefined ? currentText : String(previousText ?? "");

      try {
        await updateCellNote(
          sessionId,
          currentParticipantId,
          rowId,
          columnId,
          noteId,
          nextText,
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour le post-it:", error);
        setSessionError("Le post-it n'a pas pu être mis à jour.");
      }
    },
    [
      cellNotesByKey,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeCellNote = useCallback(
    async (rowId, columnId, noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !rowId || !columnId || !noteId) {
        return;
      }

      try {
        await removeCellNoteService(sessionId, rowId, columnId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer le post-it:", error);
        setSessionError("Le post-it n'a pas pu être supprimé.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const toggleVote = useCallback(
    async (noteId) => {
      if (
        !isEnabled ||
        !sessionId ||
        !participantReady ||
        !currentParticipantId ||
        !noteId ||
        !noteIdsSet.has(noteId)
      ) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleVoteService(sessionId, currentParticipantId, noteId, {
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
      initializeStructure,
      setDescription,
      setConcept,
      addColumnItem,
      updateColumnItemText,
      removeColumnItem,
      addRowItem,
      updateRowItemText,
      removeRowItem,
      addCellNote,
      updateCellNoteText,
      removeCellNote,
      toggleVote,
    }),
    [
      addCellNote,
      addColumnItem,
      addRowItem,
      initializeStructure,
      removeCellNote,
      removeColumnItem,
      removeRowItem,
      setConcept,
      setDescription,
      toggleVote,
      updateCellNoteText,
      updateColumnItemText,
      updateRowItemText,
    ]
  );

  const effectiveSyncError = isEnabled && syncErrorSessionId === sessionId ? syncError : "";
  const effectiveIsLoading =
    isEnabled && (!participantReady || (lastSnapshotSessionId !== sessionId && !effectiveSyncError));

  return {
    isEnabled,
    participantReady,
    isLoading: effectiveIsLoading,
    syncError: effectiveSyncError,
    participant,
    participants,
    getParticipantLabel,
    description,
    concept,
    columnItems,
    rowItems,
    cellNotesByKey,
    votesByParticipant,
    votesByNote,
    selectedTopIdea,
    remainingVotes,
    maxStickers: MAX_STICKERS,
    buildCellKey: buildCellKey,
    actions,
  };
}

/**
 * Default export alias for useMatriceCroiseeCollaboration.
 *
 * @type {typeof useMatriceCroiseeCollaboration}
 */
export default useCollaboration;
