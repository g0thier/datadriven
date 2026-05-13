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

  const setDescription = useCallback(
    async (description, previousDescription = description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setDescriptionService(sessionId, currentParticipantId, description, {
          expectedPreviousDescription: previousDescription,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour le sujet:", error);
        setSessionError("Le sujet n'a pas pu être enregistré.");
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

  const addHatItem = useCallback(
    async (hatId, options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const normalizedHatId = normalizeHatId(hatId);
      if (!normalizedHatId) return null;

      try {
        return await createItem(sessionId, normalizedHatId, {
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

  const updateHatItemText = useCallback(
    async (hatId, itemId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !itemId || !currentParticipantId) {
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

      try {
        await updateItem(
          sessionId,
          normalizedHatId,
          itemId,
          { text },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la contribution:", error);
        setSessionError("La contribution n'a pas pu être mise à jour.");
      }
    },
    [currentParticipantId, isEnabled, itemsById, participantReady, sessionId, setSessionError]
  );

  const removeHatItem = useCallback(
    async (hatId, itemId) => {
      if (!isEnabled || !sessionId || !participantReady || !itemId || !currentParticipantId) {
        return;
      }

      const normalizedHatId = normalizeHatId(hatId);
      if (!normalizedHatId) return;

      const item = itemsById[itemId];
      if (!item || item.authorId !== currentParticipantId || item.hatId !== normalizedHatId) return;

      try {
        await removeItem(sessionId, normalizedHatId, itemId);
      } catch (error) {
        console.error("Impossible de supprimer la contribution:", error);
        setSessionError("La contribution n'a pas pu être supprimée.");
      }
    },
    [currentParticipantId, isEnabled, itemsById, participantReady, sessionId, setSessionError]
  );

  const setBlueConclusion = useCallback(
    async (text) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setBlueConclusionService(sessionId, currentParticipantId, text);
      } catch (error) {
        console.error("Impossible de mettre à jour la conclusion:", error);
        setSessionError("La conclusion n'a pas pu être enregistrée.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
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
