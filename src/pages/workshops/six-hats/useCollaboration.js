import { useCallback, useMemo } from "react";
import {
  createItem,
  removeItem,
  setBlueConclusion as setBlueConclusionService,
  setDescription as setDescriptionService,
  subscribeSession,
  updateItem,
  upsertParticipant,
} from "../../../firebase/workshops/six-hats.service";
import {
  EMPTY_OBJECT,
  sortByCreatedAt,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
import { useWorkshopGuardedAction } from "../useWorkshopGuardedAction.js";
import { useWorkshopParticipants } from "../useWorkshopParticipants.js";
import { HAT_CONFIG, HAT_IDS, normalizeHatId } from "./sixHats.constants";

const makeEmptyByHat = (initialValueFactory) => {
  return HAT_IDS.reduce((accumulator, hatId) => {
    accumulator[hatId] = initialValueFactory(hatId);
    return accumulator;
  }, {});
};

export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "six-chapeaux-bono";

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

  const rawItemsByHat =
    activeState?.itemsByHat && typeof activeState.itemsByHat === "object"
      ? activeState.itemsByHat
      : EMPTY_OBJECT;

  const items = useMemo(() => {
    const normalizedItems = [];

    Object.entries(rawItemsByHat).forEach(([rawHatId, rawItems]) => {
      const hatId = normalizeHatId(rawHatId);
      if (!hatId) return;
      if (!rawItems || typeof rawItems !== "object") return;

      Object.entries(rawItems).forEach(([itemId, item]) => {
        const normalizedId = String(item?.id || itemId || "").trim();
        if (!normalizedId) return;

        normalizedItems.push({
          id: normalizedId,
          hatId,
          authorId: String(item?.authorId || "").trim(),
          text: item?.text ?? "",
          createdAt: String(item?.createdAt || ""),
          updatedAt: String(item?.updatedAt || ""),
        });
      });
    });

    return normalizedItems.sort(sortByCreatedAt);
  }, [rawItemsByHat]);

  const itemsByHat = useMemo(() => {
    const grouped = makeEmptyByHat(() => []);

    items.forEach((item) => {
      grouped[item.hatId].push(item);
    });

    return grouped;
  }, [items]);

  const itemsById = useMemo(
    () =>
      items.reduce((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [items]
  );

  const remoteParticipants =
    activeState?.participants && typeof activeState.participants === "object"
      ? activeState.participants
      : EMPTY_OBJECT;

  const authoredParticipantIds = useMemo(
    () => items.map((item) => item.authorId),
    [items]
  );
  const { participants, getParticipantLabel } = useWorkshopParticipants({
    sessionGuests,
    remoteParticipants,
    currentParticipant: participant,
    authoredParticipantIds,
  });

  const currentParticipantId = participant?.id || "";
  const description = rawDescription;
  const blueConclusion = String(activeState?.step7?.blueConclusion?.text || "");
  const { runGuardedAction } = useWorkshopGuardedAction({
    isEnabled,
    sessionId,
    participantReady,
    participantId: currentParticipantId,
    setSessionError,
  });

  const setDescription = useCallback(
    async (description, previousDescription = description) => {
      await runGuardedAction({
        errorLog: "Impossible de mettre à jour le sujet:",
        errorMessage: "Le sujet n'a pas pu être enregistré.",
        execute: () =>
          setDescriptionService(sessionId, currentParticipantId, description, {
          expectedPreviousDescription: previousDescription,
          }),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
  );

  const addHatItem = useCallback(
    async (hatId, options = {}) => {
      const normalizedHatId = normalizeHatId(hatId);
      if (!normalizedHatId) return null;

      return runGuardedAction({
        errorLog: "Impossible d'ajouter la contribution:",
        errorMessage: "La contribution n'a pas pu être ajoutée.",
        fallback: null,
        execute: () =>
          createItem(sessionId, normalizedHatId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
          }),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
  );

  const updateHatItemText = useCallback(
    async (hatId, itemId, text, previousText = null) => {
      if (!itemId) {
        return;
      }

      const normalizedHatId = normalizeHatId(hatId);
      if (!normalizedHatId) return;

      const item = itemsById[itemId];
      if (!item || item.authorId !== currentParticipantId || item.hatId !== normalizedHatId) return;

      const currentText = String(item.text ?? "");
      if (currentText === String(text ?? "")) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      await runGuardedAction({
        errorLog: "Impossible de mettre à jour la contribution:",
        errorMessage: "La contribution n'a pas pu être mise à jour.",
        execute: () =>
          updateItem(
            sessionId,
            normalizedHatId,
            itemId,
            { text },
            { expectedPreviousText }
          ),
      });
    },
    [currentParticipantId, itemsById, runGuardedAction, sessionId]
  );

  const removeHatItem = useCallback(
    async (hatId, itemId) => {
      if (!itemId) {
        return;
      }

      const normalizedHatId = normalizeHatId(hatId);
      if (!normalizedHatId) return;

      const item = itemsById[itemId];
      if (!item || item.authorId !== currentParticipantId || item.hatId !== normalizedHatId) return;

      await runGuardedAction({
        errorLog: "Impossible de supprimer la contribution:",
        errorMessage: "La contribution n'a pas pu être supprimée.",
        execute: () => removeItem(sessionId, normalizedHatId, itemId),
      });
    },
    [currentParticipantId, itemsById, runGuardedAction, sessionId]
  );

  const setBlueConclusion = useCallback(
    async (text) => {
      await runGuardedAction({
        errorLog: "Impossible de mettre à jour la conclusion:",
        errorMessage: "La conclusion n'a pas pu être enregistrée.",
        execute: () => setBlueConclusionService(sessionId, currentParticipantId, text),
      });
    },
    [currentParticipantId, runGuardedAction, sessionId]
  );

  const actions = useMemo(
    () => ({
      setDescription,
      addHatItem,
      updateHatItemText,
      removeHatItem,
      setBlueConclusion,
    }),
    [addHatItem, removeHatItem, setBlueConclusion, setDescription, updateHatItemText]
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
    hats: HAT_CONFIG,
    blueConclusion,
    items,
    itemsByHat,
    actions,
  };
}

export default useCollaboration;
