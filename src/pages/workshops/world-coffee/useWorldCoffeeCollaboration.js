/**
 * @module workshops/world-coffee/useWorldCoffeeCollaboration
 * @description Collaboration hook managing realtime World Cafe workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../../firebase";
import {
  clearWorldCoffeeFacilitator,
  createWorldCoffeeDescription,
  createWorldCoffeeIdea,
  initializeWorldCoffeeSubgroups,
  removeWorldCoffeeDescription,
  removeWorldCoffeeIdea,
  setWorldCoffeeFacilitator,
  subscribeWorldCoffeeSession,
  updateWorldCoffeeDescription,
  updateWorldCoffeeIdea,
  upsertWorldCoffeeParticipant,
} from "../../../firebase/workshops/world-coffee.service";

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

const parseGroupIndex = (groupId) => {
  const match = String(groupId || "").match(/group-(\d+)/);
  return match ? Number(match[1]) : 0;
};

const normalizeSubgroups = (value = {}) => {
  if (!value || typeof value !== "object") return EMPTY_ARRAY;

  const normalizeParticipantIds = (participantIds = {}) => {
    if (!participantIds || typeof participantIds !== "object") return [];

    return Object.entries(participantIds)
      .filter(([, enabled]) => enabled)
      .map(([participantId]) => String(participantId || "").trim())
      .filter(Boolean);
  };

  return Object.entries(value)
    .map(([subgroupId, subgroup], index) => {
      const id = String(subgroup?.id || subgroupId || "").trim();
      if (!id) return null;

      return {
        id,
        label: String(subgroup?.label || `Sous-groupe ${index + 1}`).trim(),
        descriptionId: String(subgroup?.descriptionId || "").trim(),
        facilitatorId: String(subgroup?.facilitatorId || "").trim(),
        participantIds: normalizeParticipantIds(subgroup?.participantIds),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const groupIndexA = parseGroupIndex(a.id);
      const groupIndexB = parseGroupIndex(b.id);

      if (groupIndexA !== groupIndexB) {
        return groupIndexA - groupIndexB;
      }

      return String(a.label || "").localeCompare(String(b.label || ""), "fr");
    });
};

const normalizeParticipantToSubgroup = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [participantId, subgroupId]) => {
    const cleanedParticipantId = String(participantId || "").trim();
    const cleanedSubgroupId = String(subgroupId || "").trim();
    if (!cleanedParticipantId || !cleanedSubgroupId) return accumulator;

    accumulator[cleanedParticipantId] = cleanedSubgroupId;
    return accumulator;
  }, {});
};

const normalizeIdeasBySubgroup = (value = {}) => {
  if (!value || typeof value !== "object") {
    return {
      ideas: EMPTY_ARRAY,
      ideasBySubgroup: EMPTY_OBJECT,
      ideasById: EMPTY_OBJECT,
    };
  }

  const ideasBySubgroup = {};
  const ideas = [];

  Object.entries(value).forEach(([rawSubgroupId, rawIdeas]) => {
    const subgroupId = String(rawSubgroupId || "").trim();
    if (!subgroupId) return;
    if (!rawIdeas || typeof rawIdeas !== "object") return;

    const subgroupIdeas = Object.entries(rawIdeas)
      .map(([ideaId, idea]) => ({
        id: String(idea?.id || ideaId || "").trim(),
        subgroupId,
        authorId: String(idea?.authorId || "").trim(),
        text: String(idea?.text ?? ""),
        roundId: String(idea?.roundId || ""),
        roundLabel: String(idea?.roundLabel || ""),
        createdAt: String(idea?.createdAt || ""),
        updatedAt: String(idea?.updatedAt || ""),
      }))
      .filter((idea) => idea.id)
      .sort(sortByCreatedAt);

    ideasBySubgroup[subgroupId] = subgroupIdeas;
    ideas.push(...subgroupIdeas);
  });

  const ideasById = ideas.reduce((accumulator, idea) => {
    accumulator[idea.id] = idea;
    return accumulator;
  }, {});

  return {
    ideas,
    ideasBySubgroup,
    ideasById,
  };
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
 * Provides realtime collaboration state and actions for World Cafe sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable World Cafe behavior.
 * @returns {Object} Collaboration state and write actions.
 */
export function useWorldCoffeeCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "world-cafe";

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [worldCoffeeState, setWorldCoffeeState] = useState(null);
  const [lastSnapshotSessionId, setLastSnapshotSessionId] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncErrorSessionId, setSyncErrorSessionId] = useState("");

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

    const unsubscribe = subscribeWorldCoffeeSession(
      sessionId,
      (nextState) => {
        setWorldCoffeeState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation World Cafe:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activeState = isEnabled && lastSnapshotSessionId === sessionId ? worldCoffeeState : null;

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertWorldCoffeeParticipant(sessionId, participant);
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

  const rawDescriptions =
    activeState?.descriptions && typeof activeState.descriptions === "object"
      ? activeState.descriptions
      : EMPTY_OBJECT;
  const descriptions = useMemo(() => {
    return Object.entries(rawDescriptions)
      .map(([descriptionId, description]) => ({
        id: String(description?.id || descriptionId || "").trim(),
        authorId: String(description?.authorId || "").trim(),
        text: String(description?.text ?? ""),
        createdAt: String(description?.createdAt || ""),
        updatedAt: String(description?.updatedAt || ""),
      }))
      .filter((description) => description.id)
      .sort(sortByCreatedAt);
  }, [rawDescriptions]);

  const descriptionsById = useMemo(
    () =>
      descriptions.reduce((accumulator, description) => {
        accumulator[description.id] = description;
        return accumulator;
      }, {}),
    [descriptions]
  );

  const remoteParticipants =
    activeState?.participants && typeof activeState.participants === "object"
      ? activeState.participants
      : EMPTY_OBJECT;

  const participants = useMemo(() => {
    const participantMap = new Map();

    const addParticipant = (participantId, payload = {}) => {
      const cleanedId = String(participantId || payload?.id || "").trim();
      if (!cleanedId) return;

      const current = participantMap.get(cleanedId) || {
        id: cleanedId,
        firstName: "",
        lastName: "",
        name: "",
        label: "",
        email: "",
      };
      const firstName = String(payload?.firstName || "").trim();
      const lastName = String(payload?.lastName || "").trim();
      const name = String(payload?.name || "").trim();
      const label = String(payload?.label || "").trim();
      const email = String(payload?.email || "").trim();

      participantMap.set(cleanedId, {
        id: cleanedId,
        firstName: firstName || current.firstName,
        lastName: lastName || current.lastName,
        name:
          name ||
          label ||
          current.name ||
          current.label ||
          makeParticipantFallbackLabel(cleanedId),
        label: label || current.label,
        email: email || current.email,
      });
    };

    Object.entries(remoteParticipants).forEach(([participantId, payload]) => {
      addParticipant(participantId, payload);
    });

    sessionGuests.forEach((guest) => {
      if (!guest) return;
      const guestId = String(guest?.id || "").trim();
      if (!guestId) return;

      addParticipant(guestId, {
        id: guestId,
        firstName: String(guest?.firstName || "").trim(),
        lastName: String(guest?.lastName || "").trim(),
        label: String(guest?.label || "").trim(),
        name: resolveGuestName(guest),
        email: String(guest?.email || "").trim(),
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
      return participantById[participantId]?.name || makeParticipantFallbackLabel(participantId);
    },
    [participantById]
  );

  const currentParticipantId = participant?.id || "";
  const descriptionIdsSet = useMemo(
    () => new Set(descriptions.map((description) => description.id)),
    [descriptions]
  );

  const rawFacilitatorByDescriptionId =
    activeState?.facilitatorByDescriptionId &&
    typeof activeState.facilitatorByDescriptionId === "object"
      ? activeState.facilitatorByDescriptionId
      : EMPTY_OBJECT;
  const facilitatorByDescriptionId = useMemo(() => {
    const nextMapping = {};

    Object.entries(rawFacilitatorByDescriptionId).forEach(([descriptionId, facilitatorId]) => {
      const cleanedDescriptionId = String(descriptionId || "").trim();
      const cleanedFacilitatorId = String(facilitatorId || "").trim();
      if (!cleanedDescriptionId || !cleanedFacilitatorId) return;
      if (!descriptionIdsSet.has(cleanedDescriptionId)) return;

      nextMapping[cleanedDescriptionId] = cleanedFacilitatorId;
    });

    return nextMapping;
  }, [descriptionIdsSet, rawFacilitatorByDescriptionId]);
  const facilitatorIdByDescriptionId = facilitatorByDescriptionId;
  const descriptionsWithoutFacilitatorCount = useMemo(() => {
    return descriptions.reduce((count, description) => {
      return facilitatorByDescriptionId[description.id] ? count : count + 1;
    }, 0);
  }, [descriptions, facilitatorByDescriptionId]);
  const hasUnassignedDescriptions = descriptionsWithoutFacilitatorCount > 0;

  const rawSubgroups =
    activeState?.subgroups && typeof activeState.subgroups === "object"
      ? activeState.subgroups
      : EMPTY_OBJECT;
  const subgroups = useMemo(() => normalizeSubgroups(rawSubgroups), [rawSubgroups]);
  const subgroupById = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = subgroup;
      return accumulator;
    }, {});
  }, [subgroups]);

  const rawParticipantToSubgroup =
    activeState?.participantToSubgroup &&
    typeof activeState.participantToSubgroup === "object"
      ? activeState.participantToSubgroup
      : EMPTY_OBJECT;
  const participantToSubgroup = useMemo(
    () => normalizeParticipantToSubgroup(rawParticipantToSubgroup),
    [rawParticipantToSubgroup]
  );
  const subgroupId = String(participantToSubgroup[currentParticipantId] || "").trim();
  const activeSubgroup = subgroupId ? subgroupById[subgroupId] || null : null;
  const activeSubgroupDescription = useMemo(() => {
    if (!activeSubgroup?.descriptionId) return null;
    return descriptionsById[activeSubgroup.descriptionId] || null;
  }, [activeSubgroup?.descriptionId, descriptionsById]);

  const rawIdeasBySubgroup =
    activeState?.ideasBySubgroup && typeof activeState.ideasBySubgroup === "object"
      ? activeState.ideasBySubgroup
      : EMPTY_OBJECT;
  const {
    ideas,
    ideasBySubgroup,
    ideasById,
  } = useMemo(() => normalizeIdeasBySubgroup(rawIdeasBySubgroup), [rawIdeasBySubgroup]);
  const activeIdeas = Array.isArray(ideasBySubgroup[subgroupId])
    ? ideasBySubgroup[subgroupId]
    : EMPTY_ARRAY;

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady) return;
    if (descriptions.length === 0) return;

    let cancelled = false;

    const syncSubgroups = async () => {
      try {
        await initializeWorldCoffeeSubgroups(sessionId, sessionGuests);
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de synchroniser les sous-groupes World Cafe:", error);
      }
    };

    syncSubgroups();

    return () => {
      cancelled = true;
    };
  }, [descriptions.length, isEnabled, participantReady, sessionGuests, sessionId]);

  const addDescription = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createWorldCoffeeDescription(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter la description:", error);
        setSessionError("La description n'a pas pu etre ajoutee.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateDescription = useCallback(
    async (descriptionId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !descriptionId) return;

      const description = descriptionsById[descriptionId];
      if (!description) return;

      const currentText = String(description.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateWorldCoffeeDescription(
          sessionId,
          descriptionId,
          { text: nextText },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre a jour la description:", error);
        setSessionError("La description n'a pas pu etre enregistree.");
      }
    },
    [
      descriptionsById,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeDescription = useCallback(
    async (descriptionId) => {
      if (!isEnabled || !sessionId || !participantReady || !descriptionId) return;

      try {
        await removeWorldCoffeeDescription(sessionId, descriptionId);
      } catch (error) {
        console.error("Impossible de supprimer la description:", error);
        setSessionError("La description n'a pas pu etre supprimee.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const setFacilitator = useCallback(
    async (descriptionId, facilitatorId) => {
      if (!isEnabled || !sessionId || !participantReady) return;

      const cleanedDescriptionId = String(descriptionId || "").trim();
      const cleanedFacilitatorId = String(facilitatorId || "").trim();
      if (!cleanedDescriptionId || !cleanedFacilitatorId) return;
      if (!descriptionIdsSet.has(cleanedDescriptionId)) return;

      const isParticipantKnown = participants.some(
        (currentParticipant) => currentParticipant.id === cleanedFacilitatorId
      );
      if (!isParticipantKnown) return;

      try {
        await setWorldCoffeeFacilitator(sessionId, cleanedDescriptionId, cleanedFacilitatorId);
      } catch (error) {
        console.error("Impossible d'attribuer le facilitateur:", error);
        setSessionError("Le facilitateur n'a pas pu etre attribue.");
      }
    },
    [
      descriptionIdsSet,
      isEnabled,
      participantReady,
      participants,
      sessionId,
      setSessionError,
    ]
  );

  const clearFacilitator = useCallback(
    async (descriptionId) => {
      if (!isEnabled || !sessionId || !participantReady) return;

      const cleanedDescriptionId = String(descriptionId || "").trim();
      if (!cleanedDescriptionId) return;
      if (!descriptionIdsSet.has(cleanedDescriptionId)) return;

      try {
        await clearWorldCoffeeFacilitator(sessionId, cleanedDescriptionId);
      } catch (error) {
        console.error("Impossible de retirer le facilitateur:", error);
        setSessionError("Le facilitateur n'a pas pu etre retire.");
      }
    },
    [descriptionIdsSet, isEnabled, participantReady, sessionId, setSessionError]
  );

  const addIdea = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId || !subgroupId) {
        return null;
      }

      try {
        return await createWorldCoffeeIdea(sessionId, subgroupId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
          roundId: "round-1",
          roundLabel: "premier-round",
        });
      } catch (error) {
        console.error("Impossible d'ajouter l'idee:", error);
        setSessionError("L'idee n'a pas pu etre ajoutee.");
        return null;
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const updateIdeaText = useCallback(
    async (ideaId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !ideaId || !currentParticipantId) return;
      if (!subgroupId) return;

      const idea = ideasById[ideaId];
      if (!idea || idea.subgroupId !== subgroupId) return;
      if (idea.authorId !== currentParticipantId) return;

      const currentText = String(idea.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateWorldCoffeeIdea(
          sessionId,
          subgroupId,
          ideaId,
          { text: nextText },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre a jour l'idee:", error);
        setSessionError("L'idee n'a pas pu etre enregistree.");
      }
    },
    [
      currentParticipantId,
      ideasById,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const removeIdea = useCallback(
    async (ideaId) => {
      if (!isEnabled || !sessionId || !participantReady || !ideaId || !currentParticipantId) return;
      if (!subgroupId) return;

      const idea = ideasById[ideaId];
      if (!idea || idea.subgroupId !== subgroupId) return;
      if (idea.authorId !== currentParticipantId) return;

      try {
        await removeWorldCoffeeIdea(sessionId, subgroupId, ideaId);
      } catch (error) {
        console.error("Impossible de supprimer l'idee:", error);
        setSessionError("L'idee n'a pas pu etre supprimee.");
      }
    },
    [
      currentParticipantId,
      ideasById,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const actions = useMemo(
    () => ({
      addDescription,
      updateDescription,
      removeDescription,
      setFacilitator,
      clearFacilitator,
      addIdea,
      updateIdeaText,
      removeIdea,
    }),
    [
      addIdea,
      addDescription,
      clearFacilitator,
      removeIdea,
      removeDescription,
      setFacilitator,
      updateIdeaText,
      updateDescription,
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
    descriptions,
    subgroups,
    subgroupId,
    activeSubgroup,
    participantToSubgroup,
    activeSubgroupDescription,
    facilitatorByDescriptionId,
    facilitatorIdByDescriptionId,
    descriptionsWithoutFacilitatorCount,
    hasUnassignedDescriptions,
    ideas,
    ideasBySubgroup,
    activeIdeas,
    actions,
  };
}

export default useWorldCoffeeCollaboration;
