import { useCallback, useMemo } from "react";
import {
  createSixHatsItem,
  removeSixHatsItem,
  setSixHatsBlueConclusion,
  setSixHatsStep1Description,
  subscribeSixHatsSession,
  updateSixHatsItem,
  upsertSixHatsParticipant,
} from "../../../firebase/workshops/six-hats.service";
import {
  EMPTY_OBJECT,
  makeParticipantFallbackLabel,
  resolveGuestName,
  sortByCreatedAt,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
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
    syncError,
    syncErrorSessionId,
    setSessionError,
    activeState: activeSixHatsState,
    lastSnapshotSessionId,
  } = useWorkshopCollaborationCore({
    sessionId,
    session,
    isEnabled,
    subscribeSession: subscribeSixHatsSession,
    upsertParticipant: upsertSixHatsParticipant,
    syncErrorMessage: "Impossible de se synchroniser avec le serveur.",
    participantErrorMessage: "Impossible d'enregistrer le participant.",
  });
  const rawStep1Description = String(activeSixHatsState?.step1?.description || "");

  const rawItemsByHat =
    activeSixHatsState?.itemsByHat && typeof activeSixHatsState.itemsByHat === "object"
      ? activeSixHatsState.itemsByHat
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
    activeSixHatsState?.participants && typeof activeSixHatsState.participants === "object"
      ? activeSixHatsState.participants
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

    items.forEach((item) => {
      addParticipant(item.authorId);
    });

    if (participant?.id) {
      addParticipant(participant.id, participant);
    }

    return Array.from(participantMap.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "fr")
    );
  }, [items, participant, remoteParticipants, sessionGuests]);

  const participantById = useMemo(() => {
    return participants.reduce((accumulator, currentParticipant) => {
      accumulator[currentParticipant.id] = currentParticipant;
      return accumulator;
    }, {});
  }, [participants]);

  const getParticipantLabel = useCallback(
    (participantId) => {
      if (!participantId) return "Participant";

      return participantById[participantId]?.name || makeParticipantFallbackLabel(participantId);
    },
    [participantById]
  );

  const currentParticipantId = participant?.id || "";
  const step1Description = rawStep1Description;
  const blueConclusion = String(activeSixHatsState?.step7?.blueConclusion?.text || "");

  const setStep1Description = useCallback(
    async (description, previousDescription = step1Description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setSixHatsStep1Description(sessionId, currentParticipantId, description, {
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
      setSessionError,
      step1Description,
    ]
  );

  const addHatItem = useCallback(
    async (hatId, options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      const normalizedHatId = normalizeHatId(hatId);
      if (!normalizedHatId) return null;

      try {
        return await createSixHatsItem(sessionId, normalizedHatId, {
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
        await updateSixHatsItem(
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
        await removeSixHatsItem(sessionId, normalizedHatId, itemId);
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
        await setSixHatsBlueConclusion(sessionId, currentParticipantId, text);
      } catch (error) {
        console.error("Impossible de mettre à jour la conclusion:", error);
        setSessionError("La conclusion n'a pas pu être enregistrée.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const actions = useMemo(
    () => ({
      setStep1Description,
      addHatItem,
      updateHatItemText,
      removeHatItem,
      setBlueConclusion,
    }),
    [addHatItem, removeHatItem, setBlueConclusion, setStep1Description, updateHatItemText]
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
    hats: HAT_CONFIG,
    step1Description,
    blueConclusion,
    items,
    itemsByHat,
    actions,
  };
}

export default useCollaboration;
