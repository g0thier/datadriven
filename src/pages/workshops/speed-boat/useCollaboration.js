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
  });

  const currentParticipantId = participant?.id || "";
  const { runGuardedAction } = useWorkshopGuardedAction({
    isEnabled,
    sessionId,
    participantReady,
    participantId: currentParticipantId,
    setSessionError,
  });
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

  const setObjective = useCallback(
    async (objective, previousObjective = objective) => {
      await runGuardedAction({
        errorLog: "Impossible de mettre à jour l'objectif:",
        errorMessage: "L'objectif n'a pas pu être enregistré.",
        execute: () =>
          setObjectiveService(sessionId, currentParticipantId, objective, {
          expectedPreviousObjective: previousObjective,
          }),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
  );

  const addBrakeNote = useCallback(
    async (options = {}) => {
      return runGuardedAction({
        errorLog: "Impossible d'ajouter le frein:",
        errorMessage: "Le frein n'a pas pu être ajouté.",
        fallback: null,
        execute: () =>
          createBrakeNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
          }),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
  );

  const updateBrakeNoteText = useCallback(
    async (noteId, text) => {
      if (!noteId) {
        return;
      }

      const note = brakeNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de mettre à jour le frein:",
        errorMessage: "Le frein n'a pas pu être mis à jour.",
        execute: () => updateBrakeNote(sessionId, noteId, { text }),
      });
    },
    [brakeNotesById, currentParticipantId, runGuardedAction, sessionId]
  );

  const removeBrakeNote = useCallback(
    async (noteId) => {
      if (!noteId) {
        return;
      }

      const note = brakeNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de supprimer le frein:",
        errorMessage: "Le frein n'a pas pu être supprimé.",
        execute: () => removeBrakeNoteService(sessionId, noteId),
      });
    },
    [brakeNotesById, currentParticipantId, runGuardedAction, sessionId]
  );

  const setBrakeNotePosition = useCallback(
    async (noteId, position) => {
      if (!noteId) return;

      await runGuardedAction({
        errorLog: "Impossible de déplacer le frein:",
        errorMessage: "La position du frein n'a pas pu être enregistrée.",
        execute: () => setBrakeNotePositionService(sessionId, noteId, position),
      });
    },
    [runGuardedAction, sessionId]
  );

  const addLeverNote = useCallback(
    async (options = {}) => {
      return runGuardedAction({
        errorLog: "Impossible d'ajouter le levier:",
        errorMessage: "Le levier n'a pas pu être ajouté.",
        fallback: null,
        execute: () =>
          createLeverNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
          }),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
  );

  const updateLeverNoteText = useCallback(
    async (noteId, text) => {
      if (!noteId) {
        return;
      }

      const note = leverNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de mettre à jour le levier:",
        errorMessage: "Le levier n'a pas pu être mis à jour.",
        execute: () => updateLeverNote(sessionId, noteId, { text }),
      });
    },
    [currentParticipantId, leverNotesById, runGuardedAction, sessionId]
  );

  const removeLeverNote = useCallback(
    async (noteId) => {
      if (!noteId) {
        return;
      }

      const note = leverNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      await runGuardedAction({
        errorLog: "Impossible de supprimer le levier:",
        errorMessage: "Le levier n'a pas pu être supprimé.",
        execute: () => removeLeverNoteService(sessionId, noteId),
      });
    },
    [currentParticipantId, leverNotesById, runGuardedAction, sessionId]
  );

  const setLeverNotePosition = useCallback(
    async (noteId, position) => {
      if (!noteId) return;

      await runGuardedAction({
        errorLog: "Impossible de déplacer le levier:",
        errorMessage: "La position du levier n'a pas pu être enregistrée.",
        execute: () => setLeverNotePositionService(sessionId, noteId, position),
      });
    },
    [runGuardedAction, sessionId]
  );

  const toggleBrakeVote = useCallback(
    async (noteId) => {
      if (!noteId) {
        return { committed: false, votes: {} };
      }

      return runGuardedAction({
        errorLog: "Impossible de modifier le vote:",
        errorMessage: "Le vote n'a pas pu être enregistré.",
        fallback: { committed: false, votes: {} },
        execute: () =>
          toggleBrakeVoteService(sessionId, currentParticipantId, noteId, {
          maxVotes: MAX_STICKERS,
          validNoteIds: noteIdsSet,
          }),
      });
    },
    [currentParticipantId, noteIdsSet, runGuardedAction, sessionId]
  );

  const setBrakeAction = useCallback(
    async (brakeId, text) => {
      if (!brakeId) return;

      await runGuardedAction({
        errorLog: "Impossible d'enregistrer l'action du frein:",
        errorMessage: "L'action du frein n'a pas pu être enregistrée.",
        execute: () => setBrakeActionService(sessionId, currentParticipantId, brakeId, text),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
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
