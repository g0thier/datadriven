import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  assignParticipantToSubgroup,
  createDefect,
  createSolution,
  fetchSessionOnce,
  initializeSubgroups,
  removeDefect as removeDefectService,
  removeSolution as removeSolutionService,
  setDescription as setDescriptionService,
  setProposal as setProposalService,
  subscribeSession,
  toggleDefectVote as toggleDefectVoteService,
  toggleSolutionVote as toggleSolutionVoteService,
  updateDefect,
  updateSolution,
  upsertParticipant,
} from "../../../firebase/workshops/defectuologie.service";
import {
  hasTopVoteTie,
  pickSelectedItem,
  rankItemsWithVotes,
} from "./defectuologie.helpers";
import {
  asObject,
  buildVotesByItem,
  countVotes,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  makeParticipantFallbackLabel,
  normalizeParticipantToSubgroup,
  normalizeVotesByParticipant,
  parseGroupIndex,
  sortByCreatedAt,
  toById,
} from "../collaboration.shared.js";
import { useWorkshopCollaborationCore } from "../useWorkshopCollaborationCore.js";
import { useWorkshopParticipants } from "../useWorkshopParticipants.js";

const MAX_STICKERS_PER_STEP = 1;

const normalizeSubgroups = (value = {}) => {
  if (!value || typeof value !== "object") return EMPTY_ARRAY;

  const normalizeParticipantIds = (participantIds = {}) => {
    if (Array.isArray(participantIds)) {
      return participantIds
        .map((participantId) => String(participantId || "").trim())
        .filter(Boolean);
    }

    if (!participantIds || typeof participantIds !== "object") return [];

    return Object.entries(participantIds).reduce((accumulator, [participantId, enabledOrParticipantId]) => {
      // Backward-compat: support array-like objects (`{0: "<uid>"}`).
      if (typeof enabledOrParticipantId === "string") {
        const cleanedParticipantId = String(enabledOrParticipantId || "").trim();
        if (!cleanedParticipantId) return accumulator;

        accumulator.push(cleanedParticipantId);
        return accumulator;
      }

      if (!enabledOrParticipantId) return accumulator;

      const cleanedParticipantId = String(participantId || "").trim();
      if (!cleanedParticipantId) return accumulator;

      accumulator.push(cleanedParticipantId);
      return accumulator;
    }, []);
  };

  return Object.entries(value)
    .map(([subgroupId, subgroup], index) => {
      const id = String(subgroup?.id || subgroupId || "").trim();
      if (!id) return null;

      const participantIds = normalizeParticipantIds(subgroup?.participantIds);

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
  const safeItemsBySubgroup = asObject(value);

  if (Object.keys(safeItemsBySubgroup).length === 0) {
    return {
      items: EMPTY_ARRAY,
      itemsBySubgroup: EMPTY_OBJECT,
      itemsById: EMPTY_OBJECT,
    };
  }

  const itemsBySubgroup = {};
  const items = [];

  Object.entries(safeItemsBySubgroup).forEach(([rawSubgroupId, rawItems]) => {
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

  const itemsById = toById(items);

  return {
    items,
    itemsBySubgroup,
    itemsById,
  };
};

const buildStoredSubgroupKey = (sessionId, participantId) => {
  const cleanedSessionId = String(sessionId || "").trim();
  const cleanedParticipantId = String(participantId || "").trim();
  if (!cleanedSessionId || !cleanedParticipantId) return "";
  return `defectuologie:lastSubgroup:${cleanedSessionId}:${cleanedParticipantId}`;
};

const readStoredSubgroupId = (sessionId, participantId) => {
  if (typeof window === "undefined") return "";

  const storageKey = buildStoredSubgroupKey(sessionId, participantId);
  if (!storageKey) return "";

  try {
    return String(window.localStorage.getItem(storageKey) || "").trim();
  } catch {
    return "";
  }
};

const writeStoredSubgroupId = (sessionId, participantId, subgroupId) => {
  if (typeof window === "undefined") return;

  const storageKey = buildStoredSubgroupKey(sessionId, participantId);
  const cleanedSubgroupId = String(subgroupId || "").trim();
  if (!storageKey || !cleanedSubgroupId) return;

  try {
    window.localStorage.setItem(storageKey, cleanedSubgroupId);
  } catch {
    // Ignore localStorage errors (private mode, quota, etc.).
  }
};

export function useCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "defectuologie";

  const [lastNonEmptyDescription, setLastNonEmptyDescription] = useState("");
  const [isInitialServerReadReady, setIsInitialServerReadReady] = useState(false);
  const [lockedParticipantId, setLockedParticipantId] = useState("");
  const [lockedSubgroupId, setLockedSubgroupId] = useState("");
  const [lastContentfulSubgroupId, setLastContentfulSubgroupId] = useState("");
  const descriptionRestoreInFlightRef = useRef(false);
  const subgroupRestoreInFlightRef = useRef(false);
  const lastKnownSubgroupByParticipantRef = useRef({});
  const lastMissingSubgroupWarningKeyRef = useRef("");

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
    canSyncParticipant: () => false,
  });

  useEffect(() => {
    setLockedParticipantId("");
  }, [isEnabled, sessionId]);

  useEffect(() => {
    const participantId = String(participant?.id || "").trim();
    if (!participantId) return;

    setLockedParticipantId((currentValue) => currentValue || participantId);
  }, [participant?.id]);

  const effectiveParticipant = useMemo(() => {
    const participantId = String(participant?.id || "").trim();
    if (!lockedParticipantId || lockedParticipantId === participantId) {
      return participant;
    }

    return {
      id: lockedParticipantId,
      name: makeParticipantFallbackLabel(lockedParticipantId),
      email: "",
      isAuthenticated: true,
    };
  }, [lockedParticipantId, participant]);

  const writeReady = Boolean(isEnabled && participantReady && isInitialServerReadReady);

  useEffect(() => {
    setIsInitialServerReadReady(false);
  }, [isEnabled, sessionId]);

  useEffect(() => {
    if (!isEnabled || !sessionId) return;

    let cancelled = false;
    let hasHydrated = false;
    let retryId = null;

    const hydrateInitialState = async () => {
      if (cancelled || hasHydrated) return;

      try {
        await fetchSessionOnce(sessionId);
        if (cancelled) return;

        hasHydrated = true;
        if (retryId) {
          clearInterval(retryId);
          retryId = null;
        }
        setIsInitialServerReadReady(true);
      } catch (error) {
        if (cancelled) return;

        console.error("Impossible de lire l'etat initial Defectuologie:", error);
        setSessionError("Impossible de charger l'etat initial de l'atelier.");
      }
    };

    hydrateInitialState();
    retryId = setInterval(hydrateInitialState, 4_000);

    return () => {
      cancelled = true;
      if (retryId) {
        clearInterval(retryId);
      }
    };
  }, [isEnabled, sessionId, setSessionError]);

  const rawDescription = String(activeState?.step1?.description || "");

  useEffect(() => {
    setLastNonEmptyDescription("");
    setLockedSubgroupId("");
    setLastContentfulSubgroupId("");
    descriptionRestoreInFlightRef.current = false;
    subgroupRestoreInFlightRef.current = false;
    lastKnownSubgroupByParticipantRef.current = {};
  }, [isEnabled, sessionId]);

  useEffect(() => {
    if (!rawDescription) return;

    setLastNonEmptyDescription((currentValue) =>
      currentValue === rawDescription ? currentValue : rawDescription
    );
  }, [rawDescription]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !writeReady || !effectiveParticipant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertParticipant(sessionId, effectiveParticipant);
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
  }, [effectiveParticipant, isEnabled, sessionId, writeReady]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !writeReady || !effectiveParticipant?.id) return;

    let isCancelled = false;

    const syncSubgroups = async () => {
      try {
        await initializeSubgroups(sessionId);
      } catch (error) {
        if (isCancelled) return;
        console.error("Impossible de synchroniser les sous-groupes:", error);
      }
    };

    syncSubgroups();

    return () => {
      isCancelled = true;
    };
  }, [effectiveParticipant?.id, isEnabled, sessionId, writeReady]);

  const remoteParticipants = asObject(activeState?.participants);

  const participantToSubgroup = useMemo(
    () => normalizeParticipantToSubgroup(activeState?.participantToSubgroup),
    [activeState?.participantToSubgroup]
  );

  const subgroups = useMemo(() => normalizeSubgroups(activeState?.subgroups), [activeState?.subgroups]);

  const subgroupById = useMemo(() => toById(subgroups), [subgroups]);

  const description = rawDescription || lastNonEmptyDescription;

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
  const contentCountsBySubgroup = useMemo(() => {
    const subgroupIds = new Set([
      ...Object.keys(defectsBySubgroup || EMPTY_OBJECT),
      ...Object.keys(solutionsBySubgroup || EMPTY_OBJECT),
    ]);
    const counts = {};

    subgroupIds.forEach((subgroupId) => {
      const defectsCount = Array.isArray(defectsBySubgroup[subgroupId])
        ? defectsBySubgroup[subgroupId].length
        : 0;
      const solutionsCount = Array.isArray(solutionsBySubgroup[subgroupId])
        ? solutionsBySubgroup[subgroupId].length
        : 0;

      counts[subgroupId] = defectsCount + solutionsCount;
    });

    return counts;
  }, [defectsBySubgroup, solutionsBySubgroup]);
  const nonEmptyContentSubgroupIds = useMemo(
    () =>
      Object.entries(contentCountsBySubgroup)
        .filter(([, count]) => Number(count) > 0)
        .map(([subgroupId]) => subgroupId),
    [contentCountsBySubgroup]
  );

  const defectIdsSet = useMemo(() => new Set(defects.map((defect) => defect.id)), [defects]);
  const solutionIdsSet = useMemo(() => new Set(solutions.map((solution) => solution.id)), [solutions]);

  const rawDefectVotesByParticipant = asObject(activeState?.defectVotesByParticipant);
  const rawSolutionVotesByParticipant = asObject(activeState?.solutionVotesByParticipant);

  const defectVotesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawDefectVotesByParticipant, { validIdsSet: defectIdsSet }),
    [defectIdsSet, rawDefectVotesByParticipant]
  );

  const solutionVotesByParticipant = useMemo(
    () => normalizeVotesByParticipant(rawSolutionVotesByParticipant, { validIdsSet: solutionIdsSet }),
    [rawSolutionVotesByParticipant, solutionIdsSet]
  );

  const defectVotesByItem = useMemo(
    () => buildVotesByItem(defectVotesByParticipant, { validIdsSet: defectIdsSet }),
    [defectIdsSet, defectVotesByParticipant]
  );

  const solutionVotesByItem = useMemo(
    () => buildVotesByItem(solutionVotesByParticipant, { validIdsSet: solutionIdsSet }),
    [solutionIdsSet, solutionVotesByParticipant]
  );

  const authoredParticipantIds = useMemo(
    () => [
      ...defects.map((defect) => defect.authorId),
      ...solutions.map((solution) => solution.authorId),
    ],
    [defects, solutions]
  );
  const { participants, getParticipantLabel } = useWorkshopParticipants({
    sessionGuests,
    remoteParticipants,
    currentParticipant: effectiveParticipant,
    authoredParticipantIds,
  });

  const currentParticipantId = effectiveParticipant?.id || "";
  const subgroupIdFromMapping = participantToSubgroup[currentParticipantId] || "";
  const subgroupIdFromAuthoredItems = useMemo(() => {
    if (!currentParticipantId) return "";

    const authoredDefect = defects.find((defect) => defect.authorId === currentParticipantId);
    if (authoredDefect?.subgroupId) return String(authoredDefect.subgroupId).trim();

    const authoredSolution = solutions.find((solution) => solution.authorId === currentParticipantId);
    if (authoredSolution?.subgroupId) return String(authoredSolution.subgroupId).trim();

    return "";
  }, [currentParticipantId, defects, solutions]);
  const subgroupIdFromMembership = useMemo(() => {
    if (!currentParticipantId) return "";

    const matchingSubgroup = subgroups.find((group) =>
      Array.isArray(group?.participantIds) && group.participantIds.includes(currentParticipantId)
    );

    return String(matchingSubgroup?.id || "").trim();
  }, [currentParticipantId, subgroups]);
  const subgroupIdFromExistingContent = useMemo(() => {
    if (nonEmptyContentSubgroupIds.length !== 1) return "";
    return String(nonEmptyContentSubgroupIds[0] || "").trim();
  }, [nonEmptyContentSubgroupIds]);

  const resolvedSubgroupId =
    subgroupIdFromMapping ||
    subgroupIdFromMembership ||
    subgroupIdFromAuthoredItems ||
    subgroupIdFromExistingContent;
  const subgroupIdFromStorage = useMemo(
    () => readStoredSubgroupId(sessionId, currentParticipantId),
    [currentParticipantId, sessionId]
  );
  const rememberedSubgroupId =
    String(lastKnownSubgroupByParticipantRef.current[currentParticipantId] || "") ||
    subgroupIdFromStorage;
  const initialSubgroupId = rememberedSubgroupId || resolvedSubgroupId;
  const subgroupId = lockedSubgroupId || initialSubgroupId;
  const effectiveSubgroupId = useMemo(() => {
    const currentSubgroupCount = Number(contentCountsBySubgroup[subgroupId] || 0);
    if (subgroupId && currentSubgroupCount > 0) return subgroupId;

    const previousSubgroupCount = Number(contentCountsBySubgroup[lastContentfulSubgroupId] || 0);
    if (lastContentfulSubgroupId && previousSubgroupCount > 0) {
      return lastContentfulSubgroupId;
    }

    if (nonEmptyContentSubgroupIds.length === 1) {
      return String(nonEmptyContentSubgroupIds[0] || "").trim();
    }

    return subgroupId;
  }, [contentCountsBySubgroup, lastContentfulSubgroupId, nonEmptyContentSubgroupIds, subgroupId]);

  useEffect(() => {
    setLockedSubgroupId("");
  }, [currentParticipantId, isEnabled, sessionId]);

  useEffect(() => {
    if (!initialSubgroupId) return;
    setLockedSubgroupId((currentValue) => currentValue || initialSubgroupId);
  }, [initialSubgroupId]);
  useEffect(() => {
    if (!effectiveSubgroupId) return;
    if (effectiveSubgroupId === subgroupId) return;

    setLockedSubgroupId((currentValue) =>
      currentValue === effectiveSubgroupId ? currentValue : effectiveSubgroupId
    );
  }, [effectiveSubgroupId, subgroupId]);

  const activeSubgroup = useMemo(() => {
    if (!effectiveSubgroupId) return null;

    const knownSubgroup = subgroupById[effectiveSubgroupId];
    if (knownSubgroup) return knownSubgroup;

    const parsedGroupIndex = parseGroupIndex(effectiveSubgroupId);

    return {
      id: effectiveSubgroupId,
      label: parsedGroupIndex > 0 ? `Sous-groupe ${parsedGroupIndex}` : "Sous-groupe",
      participantIds: EMPTY_ARRAY,
    };
  }, [effectiveSubgroupId, subgroupById]);

  useEffect(() => {
    if (!currentParticipantId || !effectiveSubgroupId) return;

    lastKnownSubgroupByParticipantRef.current[currentParticipantId] = effectiveSubgroupId;
    writeStoredSubgroupId(sessionId, currentParticipantId, effectiveSubgroupId);
  }, [currentParticipantId, effectiveSubgroupId, sessionId]);
  useEffect(() => {
    if (!effectiveSubgroupId) return;
    if (Number(contentCountsBySubgroup[effectiveSubgroupId] || 0) <= 0) return;

    setLastContentfulSubgroupId((currentValue) =>
      currentValue === effectiveSubgroupId ? currentValue : effectiveSubgroupId
    );
  }, [contentCountsBySubgroup, effectiveSubgroupId]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !writeReady || !currentParticipantId) return;
    if (effectiveSubgroupId) return;

    let cancelled = false;

    const restoreSubgroupAssignment = async () => {
      if (cancelled) return;
      if (subgroupRestoreInFlightRef.current) return;

      subgroupRestoreInFlightRef.current = true;

      try {
        await assignParticipantToSubgroup(sessionId, currentParticipantId);
      } catch (error) {
        if (cancelled) return;
        console.error("Impossible de restaurer le sous-groupe:", error);
      } finally {
        subgroupRestoreInFlightRef.current = false;
      }
    };

    restoreSubgroupAssignment();
    const retryId = setInterval(restoreSubgroupAssignment, 5_000);

    return () => {
      cancelled = true;
      clearInterval(retryId);
    };
  }, [currentParticipantId, effectiveSubgroupId, isEnabled, sessionId, writeReady]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !writeReady || !currentParticipantId) return;
    if (effectiveSubgroupId) {
      lastMissingSubgroupWarningKeyRef.current = "";
      return;
    }

    const warningKey = `${sessionId}:${currentParticipantId}`;
    if (lastMissingSubgroupWarningKeyRef.current === warningKey) return;
    lastMissingSubgroupWarningKeyRef.current = warningKey;

    console.warn("[Defectuologie] Sous-groupe introuvable", {
      sessionId,
      participantId: currentParticipantId,
      hasLockedSubgroup: Boolean(lockedSubgroupId),
      hasRememberedSubgroup: Boolean(rememberedSubgroupId),
      hasEffectiveSubgroup: Boolean(effectiveSubgroupId),
      hasMapping: Boolean(subgroupIdFromMapping),
      hasMembership: Boolean(subgroupIdFromMembership),
      hasAuthoredItems: Boolean(subgroupIdFromAuthoredItems),
      hasSubgroupFromContent: Boolean(subgroupIdFromExistingContent),
      hasStoredSubgroup: Boolean(subgroupIdFromStorage),
      subgroupsCount: subgroups.length,
      participantToSubgroupCount: Object.keys(participantToSubgroup).length,
    });
    console.warn(
      "[Defectuologie] Sous-groupe introuvable details:",
      JSON.stringify({
        sessionId,
        participantId: currentParticipantId,
        hasLockedSubgroup: Boolean(lockedSubgroupId),
        hasRememberedSubgroup: Boolean(rememberedSubgroupId),
        hasEffectiveSubgroup: Boolean(effectiveSubgroupId),
        hasMapping: Boolean(subgroupIdFromMapping),
        hasMembership: Boolean(subgroupIdFromMembership),
        hasAuthoredItems: Boolean(subgroupIdFromAuthoredItems),
        hasSubgroupFromContent: Boolean(subgroupIdFromExistingContent),
        hasStoredSubgroup: Boolean(subgroupIdFromStorage),
        subgroupsCount: subgroups.length,
        participantToSubgroupCount: Object.keys(participantToSubgroup).length,
      })
    );
  }, [
    currentParticipantId,
    isEnabled,
    writeReady,
    participantToSubgroup,
    sessionId,
    lockedSubgroupId,
    subgroupId,
    effectiveSubgroupId,
    rememberedSubgroupId,
    subgroupIdFromMapping,
    subgroupIdFromAuthoredItems,
    subgroupIdFromMembership,
    subgroupIdFromExistingContent,
    subgroupIdFromStorage,
    subgroups.length,
  ]);

  useEffect(() => {
    if (!isEnabled || !sessionId || !writeReady || !currentParticipantId) return;
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
        console.error("Impossible de restaurer le sujet:", error);
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
    writeReady,
    rawDescription,
    sessionId,
  ]);

  const activeDefects = defectsBySubgroup[effectiveSubgroupId] || EMPTY_ARRAY;
  const activeSolutions = solutionsBySubgroup[effectiveSubgroupId] || EMPTY_ARRAY;

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

  const myDefectVoteCount = useMemo(
    () => countVotes(myDefectVotes, activeDefectIdsSet),
    [activeDefectIdsSet, myDefectVotes]
  );

  const mySolutionVoteCount = useMemo(
    () => countVotes(mySolutionVotes, activeSolutionIdsSet),
    [activeSolutionIdsSet, mySolutionVotes]
  );

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

  const selectedDefect = selectedDefectBySubgroup[effectiveSubgroupId] || null;
  const selectedSolution = selectedSolutionBySubgroup[effectiveSubgroupId] || null;
  const defectTopTie = Boolean(defectTopTieBySubgroup[effectiveSubgroupId]);
  const solutionTopTie = Boolean(solutionTopTieBySubgroup[effectiveSubgroupId]);

  const rawProposalsBySubgroup = asObject(activeState?.proposalsBySubgroup);

  const proposalsBySubgroup = useMemo(() => {
    return subgroups.reduce((accumulator, subgroup) => {
      accumulator[subgroup.id] = {
        text: String(rawProposalsBySubgroup?.[subgroup.id]?.text || ""),
        updatedAt: String(rawProposalsBySubgroup?.[subgroup.id]?.updatedAt || ""),
        updatedBy: String(rawProposalsBySubgroup?.[subgroup.id]?.updatedBy || ""),
      };
      return accumulator;
    }, {});
  }, [rawProposalsBySubgroup, subgroups]);

  const proposal = String(proposalsBySubgroup?.[effectiveSubgroupId]?.text || "");

  const resultsBySubgroup = useMemo(() => {
    return subgroups.map((subgroup) => ({
      subgroupId: subgroup.id,
      subgroupLabel: subgroup.label,
      selectedDefect: selectedDefectBySubgroup[subgroup.id] || null,
      selectedSolution: selectedSolutionBySubgroup[subgroup.id] || null,
      proposalText: String(proposalsBySubgroup?.[subgroup.id]?.text || ""),
      participantCount: subgroup.participantIds.length,
    }));
  }, [selectedDefectBySubgroup, selectedSolutionBySubgroup, proposalsBySubgroup, subgroups]);

  const setDescription = useCallback(
    async (description, previousDescription = description) => {
      if (!isEnabled || !sessionId || !writeReady || !currentParticipantId) return;

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
      writeReady,
      sessionId,
      setSessionError
    ]
  );

  const addDefect = useCallback(
    async (options = {}) => {
      if (
        !isEnabled ||
        !sessionId ||
        !writeReady ||
        !currentParticipantId ||
        !effectiveSubgroupId
      ) {
        return null;
      }

      try {
        return await createDefect(sessionId, effectiveSubgroupId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le défaut:", error);
        setSessionError("Le défaut n'a pas pu être ajouté.");
        return null;
      }
    },
    [
      currentParticipantId,
      isEnabled,
      writeReady,
      sessionId,
      setSessionError,
      effectiveSubgroupId,
    ]
  );

  const updateDefectText = useCallback(
    async (defectId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !writeReady || !defectId || !currentParticipantId) {
        return;
      }

      const defect = defectsById[defectId];
      if (!defect || defect.authorId !== currentParticipantId) return;

      const currentText = String(defect.text ?? "");
      if (currentText === String(text ?? "")) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateDefect(sessionId, defect.subgroupId, defectId, { text }, {
          expectedPreviousText,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour le défaut:", error);
        setSessionError("Le défaut n'a pas pu être mis à jour.");
      }
    },
    [currentParticipantId, defectsById, isEnabled, sessionId, setSessionError, writeReady]
  );

  const removeDefect = useCallback(
    async (defectId) => {
      if (!isEnabled || !sessionId || !writeReady || !defectId || !currentParticipantId) {
        return;
      }

      const defect = defectsById[defectId];
      if (!defect || defect.authorId !== currentParticipantId) return;

      try {
        await removeDefectService(sessionId, defect.subgroupId, defectId);
      } catch (error) {
        console.error("Impossible de supprimer le défaut:", error);
        setSessionError("Le défaut n'a pas pu être supprimé.");
      }
    },
    [currentParticipantId, defectsById, isEnabled, sessionId, setSessionError, writeReady]
  );

  const toggleDefectVote = useCallback(
    async (defectId) => {
      if (!isEnabled || !sessionId || !writeReady || !defectId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleDefectVoteService(sessionId, currentParticipantId, defectId, {
          maxVotes: MAX_STICKERS_PER_STEP,
          validDefectIds: activeDefectIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier la gommette du défaut:", error);
        setSessionError("Le vote n'a pas pu être enregistré.");
        return { committed: false, votes: {} };
      }
    },
    [
      activeDefectIdsSet,
      currentParticipantId,
      isEnabled,
      writeReady,
      sessionId,
      setSessionError,
    ]
  );

  const addSolution = useCallback(
    async (options = {}) => {
      if (
        !isEnabled ||
        !sessionId ||
        !writeReady ||
        !currentParticipantId ||
        !effectiveSubgroupId
      ) {
        return null;
      }

      try {
        return await createSolution(sessionId, effectiveSubgroupId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter la solution:", error);
        setSessionError("La solution n'a pas pu être ajoutée.");
        return null;
      }
    },
    [
      currentParticipantId,
      isEnabled,
      writeReady,
      sessionId,
      setSessionError,
      effectiveSubgroupId,
    ]
  );

  const updateSolutionText = useCallback(
    async (solutionId, text, previousText = null) => {
      if (!isEnabled || !sessionId || !writeReady || !solutionId || !currentParticipantId) {
        return;
      }

      const solution = solutionsById[solutionId];
      if (!solution || solution.authorId !== currentParticipantId) return;

      const currentText = String(solution.text ?? "");
      if (currentText === String(text ?? "")) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateSolution(sessionId, solution.subgroupId, solutionId, { text }, {
          expectedPreviousText,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour la solution:", error);
        setSessionError("La solution n'a pas pu être mise à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      writeReady,
      sessionId,
      setSessionError,
      solutionsById,
    ]
  );

  const removeSolution = useCallback(
    async (solutionId) => {
      if (!isEnabled || !sessionId || !writeReady || !solutionId || !currentParticipantId) {
        return;
      }

      const solution = solutionsById[solutionId];
      if (!solution || solution.authorId !== currentParticipantId) return;

      try {
        await removeSolutionService(sessionId, solution.subgroupId, solutionId);
      } catch (error) {
        console.error("Impossible de supprimer la solution:", error);
        setSessionError("La solution n'a pas pu être supprimée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      writeReady,
      sessionId,
      setSessionError,
      solutionsById,
    ]
  );

  const toggleSolutionVote = useCallback(
    async (solutionId) => {
      if (!isEnabled || !sessionId || !writeReady || !solutionId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleSolutionVoteService(sessionId, currentParticipantId, solutionId, {
          maxVotes: MAX_STICKERS_PER_STEP,
          validSolutionIds: activeSolutionIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier la gommette de la solution:", error);
        setSessionError("Le vote n'a pas pu être enregistré.");
        return { committed: false, votes: {} };
      }
    },
    [
      activeSolutionIdsSet,
      currentParticipantId,
      isEnabled,
      writeReady,
      sessionId,
      setSessionError,
    ]
  );

  const setProposal = useCallback(
    async (text) => {
      if (
        !isEnabled ||
        !sessionId ||
        !writeReady ||
        !currentParticipantId ||
        !effectiveSubgroupId
      ) {
        return;
      }

      try {
        await setProposalService(
          sessionId,
          currentParticipantId,
          effectiveSubgroupId,
          text
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la proposition:", error);
        setSessionError("La proposition n'a pas pu être enregistrée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      writeReady,
      sessionId,
      setSessionError,
      effectiveSubgroupId,
    ]
  );

  const actions = useMemo(
    () => ({
      setDescription,
      addDefect,
      updateDefectText,
      removeDefect,
      toggleDefectVote,
      addSolution,
      updateSolutionText,
      removeSolution,
      toggleSolutionVote,
      setProposal,
    }),
    [
      addDefect,
      addSolution,
      removeDefect,
      removeSolution,
      setDescription,
      setProposal,
      toggleDefectVote,
      toggleSolutionVote,
      updateDefectText,
      updateSolutionText,
    ]
  );

  const isLoading = effectiveIsLoading || (isEnabled && !writeReady);

  return {
    isEnabled,
    participantReady,
    isLoading,
    syncError: effectiveSyncError,
    participant: effectiveParticipant,
    participants,
    getParticipantLabel,
    description,
    subgroups,
    subgroupId: effectiveSubgroupId,
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
    proposalsBySubgroup,
    proposal,
    resultsBySubgroup,
    actions,
  };
}

export default useCollaboration;
