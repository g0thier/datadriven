import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../../firebase";
import {
  assignDefectuologieParticipantToSubgroup,
  createDefectuologieDefect,
  createDefectuologieSolution,
  initializeDefectuologieSubgroups,
  removeDefectuologieDefect,
  removeDefectuologieSolution,
  setDefectuologieStep1Description,
  setDefectuologieStep6Proposal,
  subscribeDefectuologieSession,
  toggleDefectuologieDefectVote,
  toggleDefectuologieSolutionVote,
  updateDefectuologieDefect,
  updateDefectuologieSolution,
  upsertDefectuologieParticipant,
} from "../../../firebase/workshops/defectuologie.service";
import {
  buildVotesByItem,
  hasTopVoteTie,
  pickSelectedItem,
  rankItemsWithVotes,
  sortByCreatedAt,
} from "./defectuologie.helpers";

const MAX_STICKERS_PER_STEP = 1;

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

const resolveGuestName = (guest = {}) => {
  const firstName = String(guest?.firstName || "").trim();
  const lastName = String(guest?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    String(guest?.name || "").trim() ||
    String(guest?.label || "").trim() ||
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

    const guestId = String(guest?.id || "").trim();
    const guestEmail = String(guest?.email || "").trim().toLowerCase();

    if (guestId && guestId === authUid) return true;
    if (authEmail && guestEmail && guestEmail === authEmail.toLowerCase()) return true;
    return false;
  });

  return {
    id: authUid,
    name:
      resolveGuestName(matchingGuest) ||
      authDisplayName ||
      makeParticipantFallbackLabel(authUid),
    email: authEmail,
    isAuthenticated: true,
  };
};

const parseGroupIndex = (groupId) => {
  const match = String(groupId || "").match(/group-(\d+)/);
  return match ? Number(match[1]) : 0;
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

const normalizeSubgroups = (value = {}) => {
  if (!value || typeof value !== "object") return EMPTY_ARRAY;

  return Object.entries(value)
    .map(([subgroupId, subgroup], index) => {
      const id = String(subgroup?.id || subgroupId || "").trim();
      if (!id) return null;

      const participantIds =
        subgroup?.participantIds && typeof subgroup.participantIds === "object"
          ? Object.entries(subgroup.participantIds).reduce((accumulator, [participantId, enabled]) => {
              if (!enabled) return accumulator;
              accumulator.push(String(participantId || "").trim());
              return accumulator;
            }, [])
          : [];

      return {
        id,
        label: String(subgroup?.label || `Sous-groupe ${index + 1}`).trim(),
        participantIds,
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

const normalizeItemsBySubgroup = (value = {}) => {
  if (!value || typeof value !== "object") {
    return {
      items: EMPTY_ARRAY,
      itemsBySubgroup: EMPTY_OBJECT,
      itemsById: EMPTY_OBJECT,
    };
  }

  const itemsBySubgroup = {};
  const items = [];

  Object.entries(value).forEach(([rawSubgroupId, rawItems]) => {
    const subgroupId = String(rawSubgroupId || "").trim();
    if (!subgroupId) return;
    if (!rawItems || typeof rawItems !== "object") return;

    const subgroupItems = Object.entries(rawItems)
      .map(([itemId, item]) => ({
        id: String(item?.id || itemId || "").trim(),
        subgroupId,
        authorId: String(item?.authorId || "").trim(),
        text: item?.text ?? "",
        createdAt: String(item?.createdAt || ""),
        updatedAt: String(item?.updatedAt || ""),
      }))
      .filter((item) => item.id)
      .sort(sortByCreatedAt);

    itemsBySubgroup[subgroupId] = subgroupItems;
    items.push(...subgroupItems);
  });

  const itemsById = items.reduce((accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  }, {});

  return {
    items,
    itemsBySubgroup,
    itemsById,
  };
};

const normalizeVotesByParticipant = (value = {}, validIdsSet = null) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [participantId, votes]) => {
    if (!votes || typeof votes !== "object") return accumulator;

    const cleanedVotes = Object.entries(votes).reduce((votesAccumulator, [itemId, enabled]) => {
      if (!enabled) return votesAccumulator;
      if (validIdsSet instanceof Set && !validIdsSet.has(itemId)) return votesAccumulator;

      votesAccumulator[itemId] = true;
      return votesAccumulator;
    }, {});

    if (Object.keys(cleanedVotes).length > 0) {
      accumulator[participantId] = cleanedVotes;
    }

    return accumulator;
  }, {});
};

export function useDefectuologieCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "defectuologie";

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [state, setState] = useState(null);
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

    const unsubscribe = subscribeDefectuologieSession(
      sessionId,
      (nextState) => {
        setState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation Defectuologie:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activeState = isEnabled && lastSnapshotSessionId === sessionId ? state : null;

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertDefectuologieParticipant(sessionId, participant);
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

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return;

    let isCancelled = false;

    const syncSubgroups = async () => {
      try {
        await initializeDefectuologieSubgroups(sessionId);
        await assignDefectuologieParticipantToSubgroup(sessionId, participant.id);
      } catch (error) {
        if (isCancelled) return;
        console.error("Impossible de synchroniser les sous-groupes:", error);
      }
    };

    syncSubgroups();

    return () => {
      isCancelled = true;
    };
  }, [isEnabled, participant?.id, participantReady, sessionId]);

  const remoteParticipants =
    activeState?.participants && typeof activeState.participants === "object"
      ? activeState.participants
      : EMPTY_OBJECT;

  const participantToSubgroup = useMemo(
    () => normalizeParticipantToSubgroup(activeState?.participantToSubgroup),
    [activeState?.participantToSubgroup]
  );

  const subgroups = useMemo(() => normalizeSubgroups(activeState?.subgroups), [activeState?.subgroups]);

  const subgroupById = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = subgroup;
      return accumulator;
    }, {});
  }, [subgroups]);

  const step1Description = String(activeState?.step1?.description || "");

  const {
    items: defects,
    itemsBySubgroup: defectsBySubgroup,
    itemsById: defectsById,
  } = useMemo(
    () => normalizeItemsBySubgroup(activeState?.defectsBySubgroup),
    [activeState?.defectsBySubgroup]
  );

  const {
    items: solutions,
    itemsBySubgroup: solutionsBySubgroup,
    itemsById: solutionsById,
  } = useMemo(
    () => normalizeItemsBySubgroup(activeState?.solutionsBySubgroup),
    [activeState?.solutionsBySubgroup]
  );

  const defectIdsSet = useMemo(() => new Set(defects.map((defect) => defect.id)), [defects]);
  const solutionIdsSet = useMemo(() => new Set(solutions.map((solution) => solution.id)), [solutions]);

  const rawDefectVotesByParticipant =
    activeState?.defectVotesByParticipant && typeof activeState.defectVotesByParticipant === "object"
      ? activeState.defectVotesByParticipant
      : EMPTY_OBJECT;

  const rawSolutionVotesByParticipant =
    activeState?.solutionVotesByParticipant &&
    typeof activeState.solutionVotesByParticipant === "object"
      ? activeState.solutionVotesByParticipant
      : EMPTY_OBJECT;

  const defectVotesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawDefectVotesByParticipant, defectIdsSet),
    [defectIdsSet, rawDefectVotesByParticipant]
  );

  const solutionVotesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawSolutionVotesByParticipant, solutionIdsSet),
    [rawSolutionVotesByParticipant, solutionIdsSet]
  );

  const defectVotesByItem = useMemo(
    () => buildVotesByItem(defectVotesByParticipant, defectIdsSet),
    [defectIdsSet, defectVotesByParticipant]
  );

  const solutionVotesByItem = useMemo(
    () => buildVotesByItem(solutionVotesByParticipant, solutionIdsSet),
    [solutionIdsSet, solutionVotesByParticipant]
  );

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
      addParticipant(participantId, data);
    });

    defects.forEach((defect) => {
      addParticipant(defect.authorId);
    });

    solutions.forEach((solution) => {
      addParticipant(solution.authorId);
    });

    if (participant?.id) {
      addParticipant(participant.id, participant);
    }

    return Array.from(participantMap.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "fr")
    );
  }, [defects, participant, remoteParticipants, sessionGuests, solutions]);

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
  const subgroupId = participantToSubgroup[currentParticipantId] || "";
  const activeSubgroup = subgroupById[subgroupId] || null;

  const activeDefects = defectsBySubgroup[subgroupId] || EMPTY_ARRAY;
  const activeSolutions = solutionsBySubgroup[subgroupId] || EMPTY_ARRAY;

  const activeDefectIdsSet = useMemo(() => new Set(activeDefects.map((defect) => defect.id)), [activeDefects]);
  const activeSolutionIdsSet = useMemo(
    () => new Set(activeSolutions.map((solution) => solution.id)),
    [activeSolutions]
  );

  const myDefectVotes =
    currentParticipantId && defectVotesByParticipant[currentParticipantId]
      ? defectVotesByParticipant[currentParticipantId]
      : EMPTY_OBJECT;

  const mySolutionVotes =
    currentParticipantId && solutionVotesByParticipant[currentParticipantId]
      ? solutionVotesByParticipant[currentParticipantId]
      : EMPTY_OBJECT;

  const myDefectVoteCount = useMemo(() => {
    return Object.keys(myDefectVotes).reduce((count, itemId) => {
      if (!activeDefectIdsSet.has(itemId)) return count;
      return count + 1;
    }, 0);
  }, [activeDefectIdsSet, myDefectVotes]);

  const mySolutionVoteCount = useMemo(() => {
    return Object.keys(mySolutionVotes).reduce((count, itemId) => {
      if (!activeSolutionIdsSet.has(itemId)) return count;
      return count + 1;
    }, 0);
  }, [activeSolutionIdsSet, mySolutionVotes]);

  const remainingDefectVotes = Math.max(0, MAX_STICKERS_PER_STEP - myDefectVoteCount);
  const remainingSolutionVotes = Math.max(0, MAX_STICKERS_PER_STEP - mySolutionVoteCount);

  const rankedDefectsBySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      const subgroupDefects = defectsBySubgroup[subgroup.id] || EMPTY_ARRAY;
      accumulator[subgroup.id] = rankItemsWithVotes(subgroupDefects, defectVotesByItem);
      return accumulator;
    }, {});
  }, [defectVotesByItem, defectsBySubgroup, subgroups]);

  const rankedSolutionsBySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      const subgroupSolutions = solutionsBySubgroup[subgroup.id] || EMPTY_ARRAY;
      accumulator[subgroup.id] = rankItemsWithVotes(subgroupSolutions, solutionVotesByItem);
      return accumulator;
    }, {});
  }, [solutionVotesByItem, solutionsBySubgroup, subgroups]);

  const selectedDefectBySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = pickSelectedItem(rankedDefectsBySubgroup[subgroup.id] || EMPTY_ARRAY);
      return accumulator;
    }, {});
  }, [rankedDefectsBySubgroup, subgroups]);

  const selectedSolutionBySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = pickSelectedItem(
        rankedSolutionsBySubgroup[subgroup.id] || EMPTY_ARRAY
      );
      return accumulator;
    }, {});
  }, [rankedSolutionsBySubgroup, subgroups]);

  const defectTopTieBySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = hasTopVoteTie(rankedDefectsBySubgroup[subgroup.id] || EMPTY_ARRAY);
      return accumulator;
    }, {});
  }, [rankedDefectsBySubgroup, subgroups]);

  const solutionTopTieBySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = hasTopVoteTie(rankedSolutionsBySubgroup[subgroup.id] || EMPTY_ARRAY);
      return accumulator;
    }, {});
  }, [rankedSolutionsBySubgroup, subgroups]);

  const selectedDefect = selectedDefectBySubgroup[subgroupId] || null;
  const selectedSolution = selectedSolutionBySubgroup[subgroupId] || null;
  const defectTopTie = Boolean(defectTopTieBySubgroup[subgroupId]);
  const solutionTopTie = Boolean(solutionTopTieBySubgroup[subgroupId]);

  const rawStep6BySubgroup =
    activeState?.step6BySubgroup && typeof activeState.step6BySubgroup === "object"
      ? activeState.step6BySubgroup
      : EMPTY_OBJECT;

  const step6BySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = {
        text: String(rawStep6BySubgroup?.[subgroup.id]?.text || ""),
        updatedAt: String(rawStep6BySubgroup?.[subgroup.id]?.updatedAt || ""),
        updatedBy: String(rawStep6BySubgroup?.[subgroup.id]?.updatedBy || ""),
      };
      return accumulator;
    }, {});
  }, [rawStep6BySubgroup, subgroups]);

  const step6Proposal = String(step6BySubgroup?.[subgroupId]?.text || "");

  const resultsBySubgroup = useMemo(() => {
    return subgroups.map((subgroup) => ({
      subgroupId: subgroup.id,
      subgroupLabel: subgroup.label,
      selectedDefect: selectedDefectBySubgroup[subgroup.id] || null,
      selectedSolution: selectedSolutionBySubgroup[subgroup.id] || null,
      proposalText: String(step6BySubgroup?.[subgroup.id]?.text || ""),
      participantCount: subgroup.participantIds.length,
    }));
  }, [selectedDefectBySubgroup, selectedSolutionBySubgroup, step6BySubgroup, subgroups]);

  const setStep1Description = useCallback(
    async (description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setDefectuologieStep1Description(sessionId, currentParticipantId, description);
      } catch (error) {
        console.error("Impossible de mettre a jour le sujet:", error);
        setSessionError("Le sujet n'a pas pu etre enregistre.");
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const addDefect = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId || !subgroupId) {
        return null;
      }

      try {
        return await createDefectuologieDefect(sessionId, subgroupId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le defaut:", error);
        setSessionError("Le defaut n'a pas pu etre ajoute.");
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

  const updateDefectText = useCallback(
    async (defectId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !defectId || !currentParticipantId) {
        return;
      }

      const defect = defectsById[defectId];
      if (!defect || defect.authorId !== currentParticipantId) return;

      try {
        await updateDefectuologieDefect(sessionId, defect.subgroupId, defectId, { text });
      } catch (error) {
        console.error("Impossible de mettre a jour le defaut:", error);
        setSessionError("Le defaut n'a pas pu etre mis a jour.");
      }
    },
    [currentParticipantId, defectsById, isEnabled, participantReady, sessionId, setSessionError]
  );

  const removeDefect = useCallback(
    async (defectId) => {
      if (!isEnabled || !sessionId || !participantReady || !defectId || !currentParticipantId) {
        return;
      }

      const defect = defectsById[defectId];
      if (!defect || defect.authorId !== currentParticipantId) return;

      try {
        await removeDefectuologieDefect(sessionId, defect.subgroupId, defectId);
      } catch (error) {
        console.error("Impossible de supprimer le defaut:", error);
        setSessionError("Le defaut n'a pas pu etre supprime.");
      }
    },
    [currentParticipantId, defectsById, isEnabled, participantReady, sessionId, setSessionError]
  );

  const toggleDefectVote = useCallback(
    async (defectId) => {
      if (!isEnabled || !sessionId || !participantReady || !defectId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleDefectuologieDefectVote(sessionId, currentParticipantId, defectId, {
          maxVotes: MAX_STICKERS_PER_STEP,
          validDefectIds: activeDefectIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier la gommette du defaut:", error);
        setSessionError("Le vote n'a pas pu etre enregistre.");
        return { committed: false, votes: {} };
      }
    },
    [
      activeDefectIdsSet,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const addSolution = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId || !subgroupId) {
        return null;
      }

      try {
        return await createDefectuologieSolution(sessionId, subgroupId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter la solution:", error);
        setSessionError("La solution n'a pas pu etre ajoutee.");
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

  const updateSolutionText = useCallback(
    async (solutionId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !solutionId || !currentParticipantId) {
        return;
      }

      const solution = solutionsById[solutionId];
      if (!solution || solution.authorId !== currentParticipantId) return;

      try {
        await updateDefectuologieSolution(sessionId, solution.subgroupId, solutionId, { text });
      } catch (error) {
        console.error("Impossible de mettre a jour la solution:", error);
        setSessionError("La solution n'a pas pu etre mise a jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      solutionsById,
    ]
  );

  const removeSolution = useCallback(
    async (solutionId) => {
      if (!isEnabled || !sessionId || !participantReady || !solutionId || !currentParticipantId) {
        return;
      }

      const solution = solutionsById[solutionId];
      if (!solution || solution.authorId !== currentParticipantId) return;

      try {
        await removeDefectuologieSolution(sessionId, solution.subgroupId, solutionId);
      } catch (error) {
        console.error("Impossible de supprimer la solution:", error);
        setSessionError("La solution n'a pas pu etre supprimee.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      solutionsById,
    ]
  );

  const toggleSolutionVote = useCallback(
    async (solutionId) => {
      if (!isEnabled || !sessionId || !participantReady || !solutionId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleDefectuologieSolutionVote(sessionId, currentParticipantId, solutionId, {
          maxVotes: MAX_STICKERS_PER_STEP,
          validSolutionIds: activeSolutionIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier la gommette de la solution:", error);
        setSessionError("Le vote n'a pas pu etre enregistre.");
        return { committed: false, votes: {} };
      }
    },
    [
      activeSolutionIdsSet,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const setStep6Proposal = useCallback(
    async (text) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId || !subgroupId) {
        return;
      }

      try {
        await setDefectuologieStep6Proposal(sessionId, currentParticipantId, subgroupId, text);
      } catch (error) {
        console.error("Impossible de mettre a jour la proposition:", error);
        setSessionError("La proposition n'a pas pu etre enregistree.");
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

  const actions = useMemo(
    () => ({
      setStep1Description,
      addDefect,
      updateDefectText,
      removeDefect,
      toggleDefectVote,
      addSolution,
      updateSolutionText,
      removeSolution,
      toggleSolutionVote,
      setStep6Proposal,
    }),
    [
      addDefect,
      addSolution,
      removeDefect,
      removeSolution,
      setStep1Description,
      setStep6Proposal,
      toggleDefectVote,
      toggleSolutionVote,
      updateDefectText,
      updateSolutionText,
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
    subgroups,
    subgroupId,
    activeSubgroup,
    participantToSubgroup,
    defects,
    defectsBySubgroup,
    activeDefects,
    defectVotesByParticipant,
    defectVotesByItem,
    rankedDefectsBySubgroup,
    selectedDefectBySubgroup,
    selectedDefect,
    defectTopTieBySubgroup,
    defectTopTie,
    myDefectVoteCount,
    remainingDefectVotes,
    solutions,
    solutionsBySubgroup,
    activeSolutions,
    solutionVotesByParticipant,
    solutionVotesByItem,
    rankedSolutionsBySubgroup,
    selectedSolutionBySubgroup,
    selectedSolution,
    solutionTopTieBySubgroup,
    solutionTopTie,
    mySolutionVoteCount,
    remainingSolutionVotes,
    maxStickers: MAX_STICKERS_PER_STEP,
    step6BySubgroup,
    step6Proposal,
    resultsBySubgroup,
    actions,
  };
}

export default useDefectuologieCollaboration;
