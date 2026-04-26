/**
 * @module workshops/matrice-croisee/useMatriceCroiseeCollaboration
 * @description Collaboration hook managing realtime Matrice croisee workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../../firebase";
import {
  buildMatriceCroiseeCellKey,
  createMatriceCroiseeCellNote,
  createMatriceCroiseeColumnItem,
  createMatriceCroiseeRowItem,
  initializeMatriceCroiseeStructure,
  removeMatriceCroiseeCellNote,
  removeMatriceCroiseeColumnItem,
  removeMatriceCroiseeRowItem,
  setMatriceCroiseeConcept,
  setMatriceCroiseeStep1Description,
  subscribeMatriceCroiseeSession,
  toggleMatriceCroiseeVote,
  updateMatriceCroiseeCellNote,
  updateMatriceCroiseeColumnItem,
  updateMatriceCroiseeRowItem,
  upsertMatriceCroiseeParticipant,
} from "../../../firebase/workshops/matrice-croisee.service";

const MAX_STICKERS = 1;

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

const sortByCreatedAt = (a, b) => {
  const createdA = a?.createdAt || "";
  const createdB = b?.createdAt || "";

  if (createdA !== createdB) {
    return createdA.localeCompare(createdB);
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

const resolveGuestName = (guest = {}) => {
  const firstName = String(guest?.firstName || "").trim();
  const lastName = String(guest?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    String(guest?.name || "").trim() ||
    String(guest?.label || "").trim() ||
    String(guest?.email || "").trim() ||
    ""
  );
};

const makeParticipantFallbackLabel = (participantId) => {
  const id = String(participantId || "");
  const suffix = id.slice(-4).toUpperCase();
  return suffix ? `Participant ${suffix}` : "Participant";
};

const resolveParticipantIdentity = ({ sessionGuests, authUser }) => {
  const authUid = String(authUser?.uid || "").trim();
  if (!authUid) return null;

  const authEmail = String(authUser?.email || "").trim();
  const authDisplayName = String(authUser?.displayName || "").trim();

  const matchingGuest = sessionGuests.find((guest) => {
    if (!guest) return false;
    const guestId = String(guest.id || "").trim();
    const guestEmail = String(guest.email || "").trim().toLowerCase();

    if (guestId && guestId === authUid) return true;
    if (authEmail && guestEmail && guestEmail === authEmail.toLowerCase()) return true;
    return false;
  });

  return {
    id: authUid,
    name:
      resolveGuestName(matchingGuest) ||
      authDisplayName ||
      authEmail ||
      makeParticipantFallbackLabel(authUid),
    email: authEmail,
    isAuthenticated: true,
  };
};

/**
 * Provides realtime collaboration state and actions for Matrice croisee sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Matrice croisee behavior.
 * @returns {Object} Collaboration state and write actions.
 */
export function useMatriceCroiseeCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "matrice-croisee";

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [matriceCroiseeState, setMatriceCroiseeState] = useState(null);
  const [lastSnapshotSessionId, setLastSnapshotSessionId] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncErrorSessionId, setSyncErrorSessionId] = useState("");
  const [lastNonEmptyStep1Description, setLastNonEmptyStep1Description] = useState("");
  const step1RestoreInFlightRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((nextAuthUser) => {
      setAuthUser(nextAuthUser);
      setIsAuthResolved(true);
    });

    return unsubscribe;
  }, []);

  const sessionGuests = useMemo(
    () => (Array.isArray(session?.allGuests) ? session.allGuests : EMPTY_ARRAY),
    [session?.allGuests]
  );

  const participant = useMemo(
    () => (isAuthResolved ? resolveParticipantIdentity({ sessionGuests, authUser }) : null),
    [authUser, isAuthResolved, sessionGuests]
  );
  const participantReady = Boolean(isEnabled && isAuthResolved && participant?.id);

  const setSessionError = useCallback(
    (message) => {
      setSyncError(message);
      setSyncErrorSessionId(sessionId || "");
    },
    [sessionId]
  );

  useEffect(() => {
    if (!isEnabled || !sessionId) return () => {};

    const unsubscribe = subscribeMatriceCroiseeSession(
      sessionId,
      (nextState) => {
        setMatriceCroiseeState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation Matrice croisee:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activeMatriceCroiseeState =
    isEnabled && lastSnapshotSessionId === sessionId ? matriceCroiseeState : null;
  const rawStep1Description = String(activeMatriceCroiseeState?.step1?.description || "");
  const rawConcept = String(activeMatriceCroiseeState?.step5?.concept?.text || "");
  const rawColumnItems =
    activeMatriceCroiseeState?.step2?.itemsColumns &&
    typeof activeMatriceCroiseeState.step2.itemsColumns === "object"
      ? activeMatriceCroiseeState.step2.itemsColumns
      : EMPTY_OBJECT;
  const rawRowItems =
    activeMatriceCroiseeState?.step2?.itemsRows &&
    typeof activeMatriceCroiseeState.step2.itemsRows === "object"
      ? activeMatriceCroiseeState.step2.itemsRows
      : EMPTY_OBJECT;
  const rawCellNotesByCell =
    activeMatriceCroiseeState?.step3?.notesByCell &&
    typeof activeMatriceCroiseeState.step3.notesByCell === "object"
      ? activeMatriceCroiseeState.step3.notesByCell
      : EMPTY_OBJECT;
  const rawVotesByParticipant =
    activeMatriceCroiseeState?.votesByParticipant &&
    typeof activeMatriceCroiseeState.votesByParticipant === "object"
      ? activeMatriceCroiseeState.votesByParticipant
      : EMPTY_OBJECT;

  useEffect(() => {
    setLastNonEmptyStep1Description("");
    step1RestoreInFlightRef.current = false;
  }, [isEnabled, sessionId]);

  useEffect(() => {
    if (!rawStep1Description) return;

    setLastNonEmptyStep1Description((currentValue) =>
      currentValue === rawStep1Description ? currentValue : rawStep1Description
    );
  }, [rawStep1Description]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertMatriceCroiseeParticipant(sessionId, participant);
      } catch (error) {
        if (isCancelled) return;
        console.error("Impossible d'enregistrer le participant:", error);
      }
    };

    syncParticipant();
    const intervalId = setInterval(syncParticipant, 30_000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isEnabled, participant, participantReady, sessionId]);

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

  const columnItemsById = useMemo(
    () =>
      columnItems.reduce((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [columnItems]
  );

  const rowItemsById = useMemo(
    () =>
      rowItems.reduce((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [rowItems]
  );

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

  const votesByParticipant = useMemo(() => {
    const normalizedVotes = {};

    Object.entries(rawVotesByParticipant).forEach(([participantId, votes]) => {
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
  }, [rawVotesByParticipant]);

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

  const selectedTopIdea = useMemo(() => {
    const rankedNotes = [];

    rowItems.forEach((rowItem, rowIndex) => {
      columnItems.forEach((columnItem, columnIndex) => {
        const cellKey = buildMatriceCroiseeCellKey(rowItem.id, columnItem.id);
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

  const remoteParticipants =
    activeMatriceCroiseeState?.participants &&
    typeof activeMatriceCroiseeState.participants === "object"
      ? activeMatriceCroiseeState.participants
      : EMPTY_OBJECT;

  const participants = useMemo(() => {
    const participantMap = new Map();

    const addParticipant = (id, data = {}) => {
      const participantId = String(id || "").trim();
      if (!participantId) return;

      const current = participantMap.get(participantId) || {
        id: participantId,
        name: "",
        email: "",
        isAuthenticated: false,
      };

      const resolvedName = String(data?.name || "").trim();
      const resolvedEmail = String(data?.email || "").trim();

      participantMap.set(participantId, {
        id: participantId,
        name: resolvedName || current.name || makeParticipantFallbackLabel(participantId),
        email: resolvedEmail || current.email,
        isAuthenticated: Boolean(data?.isAuthenticated ?? current.isAuthenticated),
      });
    };

    sessionGuests.forEach((guest) => {
      const guestId = String(guest?.id || guest?.email || "").trim();
      if (!guestId) return;

      addParticipant(guestId, {
        name: resolveGuestName(guest),
        email: guest?.email || "",
      });
    });

    Object.entries(remoteParticipants).forEach(([participantId, data]) => {
      addParticipant(participantId, {
        name: data?.name || "",
        email: data?.email || "",
        isAuthenticated: Boolean(data?.isAuthenticated),
      });
    });

    if (participant?.id) {
      addParticipant(participant.id, participant);
    }

    return Array.from(participantMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr")
    );
  }, [participant, remoteParticipants, sessionGuests]);

  const participantById = useMemo(() => {
    return participants.reduce((accumulator, currentParticipant) => {
      accumulator[currentParticipant.id] = currentParticipant;
      return accumulator;
    }, {});
  }, [participants]);

  const getParticipantLabel = useCallback(
    (participantId) => {
      if (!participantId) return "Participant";

      return (
        participantById[participantId]?.name ||
        makeParticipantFallbackLabel(participantId)
      );
    },
    [participantById]
  );

  const currentParticipantId = participant?.id || "";
  const step1Description = rawStep1Description || lastNonEmptyStep1Description;
  const concept = rawConcept;
  const myVotes = useMemo(() => {
    if (!currentParticipantId) return EMPTY_OBJECT;
    return votesByParticipant[currentParticipantId] || EMPTY_OBJECT;
  }, [currentParticipantId, votesByParticipant]);
  const myVoteCount = useMemo(() => {
    return Object.entries(myVotes).reduce((count, [noteId, enabled]) => {
      if (!enabled) return count;
      if (!noteIdsSet.has(noteId)) return count;
      return count + 1;
    }, 0);
  }, [myVotes, noteIdsSet]);
  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return () => {};

    let cancelled = false;

    const seedStructure = async () => {
      try {
        await initializeMatriceCroiseeStructure(sessionId, currentParticipantId);
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
    if (rawStep1Description || !lastNonEmptyStep1Description) return;
    if (step1RestoreInFlightRef.current) return;

    let cancelled = false;
    step1RestoreInFlightRef.current = true;

    const restoreStep1Description = async () => {
      try {
        await setMatriceCroiseeStep1Description(
          sessionId,
          currentParticipantId,
          lastNonEmptyStep1Description,
          { expectedPreviousDescription: "" }
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer la description:", error);
      } finally {
        if (!cancelled) {
          step1RestoreInFlightRef.current = false;
        }
      }
    };

    restoreStep1Description();

    return () => {
      cancelled = true;
    };
  }, [
    currentParticipantId,
    isEnabled,
    lastNonEmptyStep1Description,
    participantReady,
    rawStep1Description,
    sessionId,
  ]);

  const setStep1Description = useCallback(
    async (description, previousDescription = step1Description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setMatriceCroiseeStep1Description(sessionId, currentParticipantId, description, {
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
      setSessionError,
      step1Description,
    ]
  );

  const setConcept = useCallback(
    async (text) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setMatriceCroiseeConcept(sessionId, currentParticipantId, text);
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
      await initializeMatriceCroiseeStructure(sessionId, currentParticipantId);
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
        return await createMatriceCroiseeColumnItem(sessionId, currentParticipantId, {
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
        await updateMatriceCroiseeColumnItem(
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
        await removeMatriceCroiseeColumnItem(sessionId, itemId);
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
        return await createMatriceCroiseeRowItem(sessionId, currentParticipantId, {
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
        await updateMatriceCroiseeRowItem(sessionId, currentParticipantId, itemId, nextText, {
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
        await removeMatriceCroiseeRowItem(sessionId, itemId);
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
        return await createMatriceCroiseeCellNote(
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

      const cellKey = buildMatriceCroiseeCellKey(rowId, columnId);
      const currentNotes = Array.isArray(cellNotesByKey[cellKey]) ? cellNotesByKey[cellKey] : EMPTY_ARRAY;
      const currentText = String(
        currentNotes.find((note) => String(note?.id || "") === String(noteId))?.text || ""
      );
      const nextText = String(text ?? "");

      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === undefined ? currentText : String(previousText ?? "");

      try {
        await updateMatriceCroiseeCellNote(
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
        await removeMatriceCroiseeCellNote(sessionId, rowId, columnId, noteId);
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
        return await toggleMatriceCroiseeVote(sessionId, currentParticipantId, noteId, {
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
      setStep1Description,
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
      setStep1Description,
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
    step1Description,
    concept,
    columnItems,
    rowItems,
    cellNotesByKey,
    votesByParticipant,
    votesByNote,
    selectedTopIdea,
    remainingVotes,
    maxStickers: MAX_STICKERS,
    buildCellKey: buildMatriceCroiseeCellKey,
    actions,
  };
}

/**
 * Default export alias for useMatriceCroiseeCollaboration.
 *
 * @type {typeof useMatriceCroiseeCollaboration}
 */
export default useMatriceCroiseeCollaboration;
