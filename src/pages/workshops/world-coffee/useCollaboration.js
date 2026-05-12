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
  addWorldCoffeeCommentReply,
  addWorldCoffeeIdeaComment,
  applyWorldCoffeeReturnRotation,
  applyWorldCoffeeRound2Rotation,
  applyWorldCoffeeRound3Rotation,
  clearWorldCoffeeFacilitator,
  createWorldCoffeeDescription,
  createWorldCoffeeIdea,
  initializeWorldCoffeeSubgroups,
  removeWorldCoffeeCommentReply,
  removeWorldCoffeeDescription,
  removeWorldCoffeeIdeaComment,
  removeWorldCoffeeIdea,
  setWorldCoffeeFacilitator,
  subscribeWorldCoffeeSession,
  updateWorldCoffeeCommentReply,
  updateWorldCoffeeDescription,
  updateWorldCoffeeIdeaComment,
  updateWorldCoffeeIdea,
  updateWorldCoffeeSubgroupSynthesis,
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

const IDEA_REPLY_KEY_PREFIX = "idea-";

const buildIdeaReplyKey = (ideaId) => {
  const cleanedIdeaId = String(ideaId || "").trim();
  if (!cleanedIdeaId) return "";
  return `${IDEA_REPLY_KEY_PREFIX}${cleanedIdeaId}`;
};

const extractIdeaIdFromReplyTarget = (targetId) => {
  const cleanedTargetId = String(targetId || "").trim();
  if (!cleanedTargetId.startsWith(IDEA_REPLY_KEY_PREFIX)) return "";

  const ideaId = cleanedTargetId.slice(IDEA_REPLY_KEY_PREFIX.length).trim();
  return ideaId || "";
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

const normalizeCommentsByIdea = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  const commentsByIdea = {};

  Object.entries(value).forEach(([ideaId, comments]) => {
    const cleanedIdeaId = String(ideaId || "").trim();
    if (!cleanedIdeaId) return;
    if (!comments || typeof comments !== "object") return;

    commentsByIdea[cleanedIdeaId] = Object.entries(comments)
      .map(([commentId, comment]) => ({
        id: String(comment?.id || commentId || "").trim(),
        authorId: String(comment?.authorId || "").trim(),
        text: String(comment?.text ?? ""),
        roundId: String(comment?.roundId || ""),
        roundLabel: String(comment?.roundLabel || ""),
        createdAt: String(comment?.createdAt || ""),
        updatedAt: String(comment?.updatedAt || ""),
      }))
      .filter((comment) => comment.id)
      .sort(sortByCreatedAt);
  });

  return commentsByIdea;
};

const normalizeRepliesByComment = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  const repliesByComment = {};

  Object.entries(value).forEach(([commentId, replies]) => {
    const cleanedCommentId = String(commentId || "").trim();
    if (!cleanedCommentId) return;
    if (!replies || typeof replies !== "object") return;

    repliesByComment[cleanedCommentId] = Object.entries(replies)
      .map(([replyId, reply]) => ({
        id: String(reply?.id || replyId || "").trim(),
        authorId: String(reply?.authorId || "").trim(),
        text: String(reply?.text ?? ""),
        roundId: String(reply?.roundId || ""),
        roundLabel: String(reply?.roundLabel || ""),
        createdAt: String(reply?.createdAt || ""),
        updatedAt: String(reply?.updatedAt || ""),
      }))
      .filter((reply) => reply.id)
      .sort(sortByCreatedAt);
  });

  return repliesByComment;
};

const normalizeSynthesisBySubgroup = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [subgroupId, synthesis]) => {
    const cleanedSubgroupId = String(subgroupId || "").trim();
    if (!cleanedSubgroupId) return accumulator;

    accumulator[cleanedSubgroupId] = {
      text: String(synthesis?.text ?? ""),
      authorId: String(synthesis?.authorId || ""),
      createdAt: String(synthesis?.createdAt || ""),
      updatedAt: String(synthesis?.updatedAt || ""),
    };
    return accumulator;
  }, {});
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
export function useCollaboration({ sessionId, session, workshopId }) {
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
  const activeIdeaIds = useMemo(
    () => new Set(activeIdeas.map((idea) => idea.id)),
    [activeIdeas]
  );
  const ideaIdsInActiveSubgroup = useMemo(
    () => new Set(activeIdeas.map((idea) => idea.id)),
    [activeIdeas]
  );

  const rawCommentsByIdea =
    activeState?.commentsByIdea && typeof activeState.commentsByIdea === "object"
      ? activeState.commentsByIdea
      : EMPTY_OBJECT;
  const commentsByIdea = useMemo(
    () => normalizeCommentsByIdea(rawCommentsByIdea),
    [rawCommentsByIdea]
  );
  const rawRepliesByComment =
    activeState?.repliesByComment && typeof activeState.repliesByComment === "object"
      ? activeState.repliesByComment
      : EMPTY_OBJECT;
  const repliesByComment = useMemo(
    () => normalizeRepliesByComment(rawRepliesByComment),
    [rawRepliesByComment]
  );
  const rawSynthesisBySubgroup =
    activeState?.synthesisBySubgroup && typeof activeState.synthesisBySubgroup === "object"
      ? activeState.synthesisBySubgroup
      : EMPTY_OBJECT;
  const synthesisBySubgroup = useMemo(
    () => normalizeSynthesisBySubgroup(rawSynthesisBySubgroup),
    [rawSynthesisBySubgroup]
  );
  const activeSubgroupSynthesis = subgroupId ? synthesisBySubgroup[subgroupId] || null : null;
  const activeCommentIds = useMemo(() => {
    const nextCommentIds = new Set();

    activeIdeas.forEach((idea) => {
      const comments = commentsByIdea[idea.id] || EMPTY_ARRAY;
      comments.forEach((comment) => {
        const cleanedCommentId = String(comment?.id || "").trim();
        if (!cleanedCommentId) return;
        nextCommentIds.add(cleanedCommentId);
      });
    });

    return nextCommentIds;
  }, [activeIdeas, commentsByIdea]);
  const resolveReplyTargetId = useCallback(
    (targetId) => {
      const cleanedTargetId = String(targetId || "").trim();
      if (!cleanedTargetId) return "";

      if (activeCommentIds.has(cleanedTargetId)) {
        return cleanedTargetId;
      }

      const ideaId = extractIdeaIdFromReplyTarget(cleanedTargetId);
      if (!ideaId) return "";
      if (!activeIdeaIds.has(ideaId)) return "";
      if (cleanedTargetId !== buildIdeaReplyKey(ideaId)) return "";

      return cleanedTargetId;
    },
    [activeCommentIds, activeIdeaIds]
  );
  const round2RotationApplied = Boolean(activeState?.round2RotationAppliedAt);
  const round3RotationApplied = Boolean(activeState?.round3RotationAppliedAt);
  const returnRotationApplied = Boolean(activeState?.returnRotationAppliedAt);
  const activeRound = returnRotationApplied
    ? "round-return"
    : round3RotationApplied
      ? "round-3"
      : "round-2";

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
        setSessionError("La description n'a pas pu être ajoutée.");
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
        console.error("Impossible de mettre à jour la description:", error);
        setSessionError("La description n'a pas pu être enregistrée.");
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
        setSessionError("La description n'a pas pu être supprimée.");
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
        setSessionError("Le facilitateur n'a pas pu être attribué.");
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
        setSessionError("Le facilitateur n'a pas pu être retiré.");
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
        console.error("Impossible d'ajouter l'idée:", error);
        setSessionError("L'idée n'a pas pu être ajoutée.");
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
        console.error("Impossible de mettre à jour l'idée:", error);
        setSessionError("L'idée n'a pas pu être enregistrée.");
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
        console.error("Impossible de supprimer l'idée:", error);
        setSessionError("L'idée n'a pas pu être supprimée.");
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

  const ensureRound2Rotation = useCallback(async () => {
    if (!isEnabled || !sessionId || !participantReady) return;

    try {
      await applyWorldCoffeeRound2Rotation(sessionId);
    } catch (error) {
      console.error("Impossible d'appliquer la rotation round 2:", error);
      setSessionError("La permutation des groupes n'a pas pu être appliquée.");
    }
  }, [isEnabled, participantReady, sessionId, setSessionError]);

  const ensureRound3Rotation = useCallback(async () => {
    if (!isEnabled || !sessionId || !participantReady) return;

    try {
      await applyWorldCoffeeRound3Rotation(sessionId);
    } catch (error) {
      console.error("Impossible d'appliquer la rotation round 3:", error);
      setSessionError("La deuxième permutation des groupes n'a pas pu être appliquée.");
    }
  }, [isEnabled, participantReady, sessionId, setSessionError]);

  const ensureReturnRotation = useCallback(async () => {
    if (!isEnabled || !sessionId || !participantReady) return;

    try {
      await applyWorldCoffeeReturnRotation(sessionId);
    } catch (error) {
      console.error("Impossible d'appliquer la rotation de retour:", error);
      setSessionError("Le retour des groupes n'a pas pu être appliqué.");
    }
  }, [isEnabled, participantReady, sessionId, setSessionError]);

  const updateSubgroupSynthesis = useCallback(
    async (text, previousText = null) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;
      if (!subgroupId) return;

      const currentText = String(activeSubgroupSynthesis?.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      const expectedPreviousText =
        previousText === null || previousText === undefined
          ? currentText
          : String(previousText ?? "");

      try {
        await updateWorldCoffeeSubgroupSynthesis(
          sessionId,
          subgroupId,
          {
            text: nextText,
            authorId: currentParticipantId,
          },
          { expectedPreviousText }
        );
      } catch (error) {
        console.error("Impossible de mettre à jour la synthèse:", error);
        setSessionError("La synthèse n'a pas pu être enregistrée.");
      }
    },
    [
      activeSubgroupSynthesis?.text,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const addIdeaComment = useCallback(
    async (ideaId, text = "") => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId || !ideaId) {
        return null;
      }
      if (!subgroupId) return null;

      const idea = ideasById[ideaId];
      if (!idea || idea.subgroupId !== subgroupId) return null;

      try {
        return await addWorldCoffeeIdeaComment(sessionId, ideaId, {
          authorId: currentParticipantId,
          text,
        });
      } catch (error) {
        console.error("Impossible d'ajouter le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être ajouté.");
        return null;
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

  const updateIdeaCommentText = useCallback(
    async (ideaId, commentId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !ideaId || !commentId) return;
      if (!subgroupId) return;
      if (!ideaIdsInActiveSubgroup.has(ideaId)) return;

      const comment = (commentsByIdea[ideaId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );
      if (!comment) return;

      const currentText = String(comment.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      try {
        await updateWorldCoffeeIdeaComment(sessionId, ideaId, commentId, { text: nextText });
      } catch (error) {
        console.error("Impossible de mettre à jour le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être enregistré.");
      }
    },
    [
      commentsByIdea,
      ideaIdsInActiveSubgroup,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const removeIdeaComment = useCallback(
    async (ideaId, commentId) => {
      if (!isEnabled || !sessionId || !participantReady || !ideaId || !commentId) return;
      if (!subgroupId) return;
      if (!ideaIdsInActiveSubgroup.has(ideaId)) return;

      const comment = (commentsByIdea[ideaId] || EMPTY_ARRAY).find(
        (currentComment) => currentComment.id === commentId
      );
      if (!comment) return;

      try {
        await removeWorldCoffeeIdeaComment(sessionId, ideaId, commentId);
      } catch (error) {
        console.error("Impossible de supprimer le commentaire:", error);
        setSessionError("Le commentaire n'a pas pu être supprimé.");
      }
    },
    [
      commentsByIdea,
      ideaIdsInActiveSubgroup,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const addCommentReply = useCallback(
    async (targetId, text = "") => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId || !targetId) {
        return null;
      }
      if (!subgroupId) return null;

      const resolvedTargetId = resolveReplyTargetId(targetId);
      if (!resolvedTargetId) return null;

      try {
        return await addWorldCoffeeCommentReply(sessionId, resolvedTargetId, {
          authorId: currentParticipantId,
          text,
        });
      } catch (error) {
        console.error("Impossible d'ajouter la réponse au commentaire:", error);
        setSessionError("La réponse n'a pas pu être ajoutée.");
        return null;
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      resolveReplyTargetId,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const updateCommentReplyText = useCallback(
    async (targetId, replyId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !targetId || !replyId) return;
      if (!subgroupId) return;

      const cleanedCommentId = resolveReplyTargetId(targetId);
      const cleanedReplyId = String(replyId || "").trim();
      if (!cleanedCommentId || !cleanedReplyId) return;

      const reply = (repliesByComment[cleanedCommentId] || EMPTY_ARRAY).find(
        (currentReply) => currentReply.id === cleanedReplyId
      );
      if (!reply) return;

      const currentText = String(reply.text ?? "");
      const nextText = String(text ?? "");
      if (currentText === nextText) return;

      try {
        await updateWorldCoffeeCommentReply(sessionId, cleanedCommentId, cleanedReplyId, {
          text: nextText,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour la réponse:", error);
        setSessionError("La réponse n'a pas pu être enregistrée.");
      }
    },
    [
      isEnabled,
      participantReady,
      repliesByComment,
      resolveReplyTargetId,
      sessionId,
      setSessionError,
      subgroupId,
    ]
  );

  const removeCommentReply = useCallback(
    async (targetId, replyId) => {
      if (!isEnabled || !sessionId || !participantReady || !targetId || !replyId) return;
      if (!subgroupId) return;

      const cleanedCommentId = resolveReplyTargetId(targetId);
      const cleanedReplyId = String(replyId || "").trim();
      if (!cleanedCommentId || !cleanedReplyId) return;

      const reply = (repliesByComment[cleanedCommentId] || EMPTY_ARRAY).find(
        (currentReply) => currentReply.id === cleanedReplyId
      );
      if (!reply) return;

      try {
        await removeWorldCoffeeCommentReply(sessionId, cleanedCommentId, cleanedReplyId);
      } catch (error) {
        console.error("Impossible de supprimer la réponse:", error);
        setSessionError("La réponse n'a pas pu être supprimée.");
      }
    },
    [
      isEnabled,
      participantReady,
      repliesByComment,
      resolveReplyTargetId,
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
      ensureRound2Rotation,
      ensureRound3Rotation,
      ensureReturnRotation,
      addIdeaComment,
      updateIdeaCommentText,
      removeIdeaComment,
      addCommentReply,
      updateCommentReplyText,
      removeCommentReply,
      updateSubgroupSynthesis,
    }),
    [
      addCommentReply,
      addIdeaComment,
      addIdea,
      addDescription,
      clearFacilitator,
      ensureReturnRotation,
      ensureRound2Rotation,
      ensureRound3Rotation,
      removeCommentReply,
      removeIdeaComment,
      removeIdea,
      removeDescription,
      setFacilitator,
      updateSubgroupSynthesis,
      updateCommentReplyText,
      updateIdeaCommentText,
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
    commentsByIdea,
    repliesByComment,
    synthesisBySubgroup,
    activeSubgroupSynthesis,
    activeRound,
    round2RotationApplied,
    round3RotationApplied,
    returnRotationApplied,
    actions,
  };
}

export default useCollaboration;
