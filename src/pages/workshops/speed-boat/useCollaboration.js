/**
 * @module workshops/speed-boat/useSpeedBoatCollaboration
 * @description Collaboration hook managing realtime Speed Boat workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useMemo } from "react";
import {
  createBrakeNote,
  createLeverNote,
  removeBrakeNote as removeBrakeNoteService,
  removeLeverNote as removeLeverNoteService,
  setBrakeNotePosition as setBrakeNotePositionService,
  setLeverNotePosition as setLeverNotePositionService,
  setBrakeAction as setBrakeActionService,
  setDescription as setDescriptionService,
  setObjective as setObjectiveService,
  subscribeSession,
  toggleBrakeVote as toggleBrakeVoteService,
  updateBrakeNote,
  updateLeverNote,
  upsertParticipant,
} from "../../../firebase/workshops/speed-boat.service";
import {
  asObject,
  buildVotesByItem,
  buildGridPosition,
  countVotes,
  EMPTY_OBJECT,
  normalizeVotesByParticipant,
  normalizePosition,
  sortByCreatedAt,
  toById,
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

/**
 * Provides realtime collaboration state and actions for Speed Boat sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Speed Boat behavior.
 * @returns {Object} Collaboration state and write actions.
 */
export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "speed-boat";

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
  const rawObjective = String(activeState?.step2?.objective || "");
  const rawBrakeNotes = asObject(activeState?.notesByType?.brakes);
  const rawLeverNotes = asObject(activeState?.notesByType?.levers);
  const rawVotesByParticipant = asObject(activeState?.votesByParticipant);
  const rawActionsByBrake = asObject(activeState?.actionsByBrake);

  const remoteParticipants = asObject(activeState?.participants);

  const brakeNotes = useMemo(() => {
    return Object.entries(rawBrakeNotes)
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
  }, [rawBrakeNotes]);

  const leverNotes = useMemo(() => {
    return Object.entries(rawLeverNotes)
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
  }, [rawLeverNotes]);

  const votesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawVotesByParticipant),
    [rawVotesByParticipant]
  );

  const actionsByBrake = useMemo(() => {
    return Object.entries(rawActionsByBrake).reduce((accumulator, [brakeId, payload]) => {
      const noteId = String(brakeId || "").trim();
      if (!noteId) return accumulator;

      accumulator[noteId] = String(payload?.text || "");
      return accumulator;
    }, {});
  }, [rawActionsByBrake]);

  const noteIdsSet = useMemo(() => new Set(brakeNotes.map((note) => note.id)), [brakeNotes]);

  const votesByNote = useMemo(
    () => buildVotesByItem(votesByParticipant, { validIdsSet: noteIdsSet }),
    [noteIdsSet, votesByParticipant]
  );

  const brakeNotesById = useMemo(() => toById(brakeNotes), [brakeNotes]);

  const leverNotesById = useMemo(() => toById(leverNotes), [leverNotes]);

  const authoredParticipantIds = useMemo(
    () => [
      ...brakeNotes.map((note) => note.authorId),
      ...leverNotes.map((note) => note.authorId),
    ],
    [brakeNotes, leverNotes]
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
  const description = rawDescription;
  const objective = rawObjective;
  const myBrakeNotes = useMemo(
    () => brakeNotes.filter((note) => note.authorId === currentParticipantId),
    [brakeNotes, currentParticipantId]
  );
  const myLeverNotes = useMemo(
    () => leverNotes.filter((note) => note.authorId === currentParticipantId),
    [leverNotes, currentParticipantId]
  );
  const myVotes =
    currentParticipantId && votesByParticipant[currentParticipantId]
      ? votesByParticipant[currentParticipantId]
      : EMPTY_OBJECT;

  const myVoteCount = useMemo(() => countVotes(myVotes, noteIdsSet), [myVotes, noteIdsSet]);

  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

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

  const setObjective = useCallback(
    async (objective, previousObjective = objective) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setObjectiveService(sessionId, currentParticipantId, objective, {
          expectedPreviousObjective: previousObjective,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour l'objectif:", error);
        setSessionError("L'objectif n'a pas pu être enregistré.");
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

  const addBrakeNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createBrakeNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le frein:", error);
        setSessionError("Le frein n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateBrakeNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = brakeNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await updateBrakeNote(sessionId, noteId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour le frein:", error);
        setSessionError("Le frein n'a pas pu être mis à jour.");
      }
    },
    [
      brakeNotesById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeBrakeNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = brakeNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await removeBrakeNoteService(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer le frein:", error);
        setSessionError("Le frein n'a pas pu être supprimé.");
      }
    },
    [
      brakeNotesById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const setBrakeNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setBrakeNotePositionService(sessionId, noteId, position);
      } catch (error) {
        console.error("Impossible de déplacer le frein:", error);
        setSessionError("La position du frein n'a pas pu être enregistrée.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const addLeverNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createLeverNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le levier:", error);
        setSessionError("Le levier n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateLeverNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = leverNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await updateLeverNote(sessionId, noteId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour le levier:", error);
        setSessionError("Le levier n'a pas pu être mis à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      leverNotesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeLeverNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = leverNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await removeLeverNoteService(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer le levier:", error);
        setSessionError("Le levier n'a pas pu être supprimé.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      leverNotesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const setLeverNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setLeverNotePositionService(sessionId, noteId, position);
      } catch (error) {
        console.error("Impossible de déplacer le levier:", error);
        setSessionError("La position du levier n'a pas pu être enregistrée.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const toggleBrakeVote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleBrakeVoteService(sessionId, currentParticipantId, noteId, {
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

  const setBrakeAction = useCallback(
    async (brakeId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !brakeId) return;

      try {
        await setBrakeActionService(sessionId, currentParticipantId, brakeId, text);
      } catch (error) {
        console.error("Impossible d'enregistrer l'action du frein:", error);
        setSessionError("L'action du frein n'a pas pu être enregistrée.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const actions = useMemo(
    () => ({
      setDescription,
      setObjective,
      addBrakeNote,
      updateBrakeNoteText,
      removeBrakeNote,
      setBrakeNotePosition,
      addLeverNote,
      updateLeverNoteText,
      removeLeverNote,
      setLeverNotePosition,
      toggleBrakeVote,
      setBrakeAction,
    }),
    [
      addLeverNote,
      addBrakeNote,
      removeLeverNote,
      removeBrakeNote,
      setBrakeNotePosition,
      setLeverNotePosition,
      setBrakeAction,
      setDescription,
      setObjective,
      toggleBrakeVote,
      updateLeverNoteText,
      updateBrakeNoteText,
    ]
  );

  const effectiveSyncError =
    isEnabled && syncErrorSessionId === sessionId ? syncError : "";
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
    objective,
    brakeNotes,
    myBrakeNotes,
    votesByParticipant,
    votesByNote,
    myVoteCount,
    remainingVotes,
    maxStickers: MAX_STICKERS,
    actionsByBrake,
    leverNotes,
    myLeverNotes,
    actions,
  };
}

/**
 * Default export alias for useSpeedBoatCollaboration.
 *
 * @type {typeof useSpeedBoatCollaboration}
 */
export default useCollaboration;
