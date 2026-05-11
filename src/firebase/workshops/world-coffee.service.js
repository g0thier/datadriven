import { onValue, push, ref, runTransaction, set, update } from "firebase/database";
import { database } from "../index";

/**
 * @module firebase/workshops/world-coffee.service
 * @description Realtime persistence helpers for the World Cafe workshop.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Returns current time in ISO format.
 * @returns {string} ISO datetime.
 */
const nowIso = () => new Date().toISOString();

/**
 * Builds the world-cafe root path for a session.
 * @param {string} sessionId - Workshop session id.
 * @returns {string} World Cafe root path.
 */
const toWorldCoffeePath = (sessionId) => `workshopSessions/${sessionId}/worldCafe`;

const sortByCreatedAt = (a, b) => {
  const createdA = String(a?.createdAt || "");
  const createdB = String(b?.createdAt || "");

  if (createdA !== createdB) {
    return createdA.localeCompare(createdB);
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

const resolveParticipantName = (participant = {}) => {
  const firstName = String(participant?.firstName || "").trim();
  const lastName = String(participant?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    String(participant?.name || "").trim() ||
    String(participant?.label || "").trim() ||
    String(participant?.email || "").trim() ||
    ""
  );
};

const normalizeInvitedParticipants = (participants = []) => {
  const mapById = new Map();

  (Array.isArray(participants) ? participants : []).forEach((participant) => {
    const participantId = String(participant?.id || participant?.uid || "").trim();
    if (!participantId) return;

    const current = mapById.get(participantId) || {
      id: participantId,
      name: "",
    };
    const name = resolveParticipantName(participant);

    mapById.set(participantId, {
      id: participantId,
      name: name || current.name,
    });
  });

  return Array.from(mapById.values()).sort((a, b) => {
    const nameA = String(a?.name || "").toLocaleLowerCase("fr");
    const nameB = String(b?.name || "").toLocaleLowerCase("fr");

    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, "fr");
    }

    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
};

const normalizeEnabledMap = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [id, enabled]) => {
    const cleanedId = String(id || "").trim();
    if (!cleanedId || !enabled) return accumulator;

    accumulator[cleanedId] = true;
    return accumulator;
  }, {});
};

const normalizeSubgroups = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [subgroupId, subgroup]) => {
    const cleanedSubgroupId = String(subgroup?.id || subgroupId || "").trim();
    if (!cleanedSubgroupId) return accumulator;

    accumulator[cleanedSubgroupId] = {
      id: cleanedSubgroupId,
      label: String(subgroup?.label || "").trim(),
      descriptionId: String(subgroup?.descriptionId || "").trim(),
      facilitatorId: String(subgroup?.facilitatorId || "").trim(),
      participantIds: normalizeEnabledMap(subgroup?.participantIds),
    };
    return accumulator;
  }, {});
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

const parseGroupIndex = (groupId) => {
  const match = String(groupId || "").match(/group-(\d+)/);
  return match ? Number(match[1]) : 0;
};

const countParticipants = (subgroup = {}) => {
  const participantIds =
    subgroup?.participantIds && typeof subgroup.participantIds === "object"
      ? subgroup.participantIds
      : {};

  return Object.values(participantIds).reduce((count, enabled) => {
    return enabled ? count + 1 : count;
  }, 0);
};

const findSmallestSubgroupId = (subgroups = {}, subgroupIds = []) => {
  const entries = subgroupIds
    .map((subgroupId) => {
      const subgroup = subgroups[subgroupId];
      return {
        subgroupId,
        size: countParticipants(subgroup),
      };
    })
    .sort((a, b) => {
      if (a.size !== b.size) return a.size - b.size;
      return parseGroupIndex(a.subgroupId) - parseGroupIndex(b.subgroupId);
    });

  return entries[0]?.subgroupId || "";
};

const sortGroupIds = (groupIds = []) => {
  return [...groupIds].sort((a, b) => {
    const groupIndexA = parseGroupIndex(a);
    const groupIndexB = parseGroupIndex(b);

    if (groupIndexA !== groupIndexB) {
      return groupIndexA - groupIndexB;
    }

    return String(a || "").localeCompare(String(b || ""));
  });
};

/**
 * Subscribes to a World Cafe session payload.
 * @param {string} sessionId - Workshop session id.
 * @param {Function} callback - Listener receiving session workshop data.
 * @param {Function} [onError=() => {}] - Error callback.
 * @returns {Function} Unsubscribe callback.
 */
export const subscribeWorldCoffeeSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const worldCoffeeRef = ref(database, toWorldCoffeePath(sessionId));
  return onValue(
    worldCoffeeRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

/**
 * Initializes or reconciles World Cafe subgroups from invited guests and facilitator mapping.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {Array<{id?:string,uid?:string,name?:string,label?:string,firstName?:string,lastName?:string,email?:string}>} [invitedParticipants=[]] - Session invitees (`allGuests`).
 * @returns {Promise<void>} Transaction completion.
 */
export const initializeWorldCoffeeSubgroups = async (
  sessionId,
  invitedParticipants = []
) => {
  if (!sessionId) return;

  const normalizedInvitedParticipants = normalizeInvitedParticipants(invitedParticipants);
  const invitedParticipantIds = normalizedInvitedParticipants.map((participant) => participant.id);

  await runTransaction(ref(database, toWorldCoffeePath(sessionId)), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const descriptions =
      currentData?.descriptions && typeof currentData.descriptions === "object"
        ? currentData.descriptions
        : {};
    const facilitatorByDescriptionIdRaw =
      currentData?.facilitatorByDescriptionId &&
      typeof currentData.facilitatorByDescriptionId === "object"
        ? currentData.facilitatorByDescriptionId
        : {};

    const descriptionList = Object.entries(descriptions)
      .map(([descriptionId, description]) => ({
        id: String(description?.id || descriptionId || "").trim(),
        createdAt: String(description?.createdAt || ""),
      }))
      .filter((description) => description.id)
      .sort(sortByCreatedAt);

    const eligibleDescriptions = descriptionList.filter((description) => {
      const facilitatorId = String(facilitatorByDescriptionIdRaw[description.id] || "").trim();
      return Boolean(facilitatorId);
    });

    if (eligibleDescriptions.length === 0) {
      return {
        ...currentData,
        subgroups: {},
        participantToSubgroup: {},
      };
    }

    const normalizedSubgroups = normalizeSubgroups(currentData?.subgroups);
    const existingParticipantToSubgroup = normalizeParticipantToSubgroup(
      currentData?.participantToSubgroup
    );

    const nextSubgroups = {};
    const nextParticipantToSubgroup = {};
    const usedGroupIds = new Set();

    const pickGroupId = (descriptionId, fallbackIndex) => {
      const subgroupWithDescription = Object.values(normalizedSubgroups).find(
        (subgroup) => String(subgroup?.descriptionId || "").trim() === descriptionId
      );
      if (subgroupWithDescription?.id && !usedGroupIds.has(subgroupWithDescription.id)) {
        usedGroupIds.add(subgroupWithDescription.id);
        return subgroupWithDescription.id;
      }

      let candidate = `group-${fallbackIndex + 1}`;
      if (!usedGroupIds.has(candidate)) {
        usedGroupIds.add(candidate);
        return candidate;
      }

      let sequence = 1;
      while (usedGroupIds.has(`group-${sequence}`)) {
        sequence += 1;
      }
      candidate = `group-${sequence}`;
      usedGroupIds.add(candidate);
      return candidate;
    };

    eligibleDescriptions.forEach((description, index) => {
      const facilitatorId = String(facilitatorByDescriptionIdRaw[description.id] || "").trim();
      if (!facilitatorId) return;

      const subgroupId = pickGroupId(description.id, index);
      nextSubgroups[subgroupId] = {
        id: subgroupId,
        label: `Sous-groupe ${index + 1}`,
        descriptionId: description.id,
        facilitatorId,
        participantIds: {
          [facilitatorId]: true,
        },
      };
      nextParticipantToSubgroup[facilitatorId] = subgroupId;
    });

    const targetSubgroupIds = Object.keys(nextSubgroups);
    const facilitatorIdsSet = new Set(
      targetSubgroupIds
        .map((subgroupId) => String(nextSubgroups[subgroupId]?.facilitatorId || "").trim())
        .filter(Boolean)
    );

    const distributableParticipantIds = invitedParticipantIds.filter(
      (participantId) => !facilitatorIdsSet.has(participantId)
    );

    const pendingAssignment = [];

    distributableParticipantIds.forEach((participantId) => {
      const previousSubgroupId = String(existingParticipantToSubgroup[participantId] || "").trim();
      if (previousSubgroupId && nextSubgroups[previousSubgroupId]) {
        nextSubgroups[previousSubgroupId].participantIds[participantId] = true;
        nextParticipantToSubgroup[participantId] = previousSubgroupId;
        return;
      }

      pendingAssignment.push(participantId);
    });

    pendingAssignment.forEach((participantId) => {
      const targetSubgroupId = findSmallestSubgroupId(nextSubgroups, targetSubgroupIds);
      if (!targetSubgroupId) return;

      nextSubgroups[targetSubgroupId].participantIds[participantId] = true;
      nextParticipantToSubgroup[participantId] = targetSubgroupId;
    });

    return {
      ...currentData,
      subgroups: nextSubgroups,
      participantToSubgroup: nextParticipantToSubgroup,
      subgroupInitializedAt: currentData?.subgroupInitializedAt || nowIso(),
    };
  });
};

/**
 * Applies the round-2 subgroup rotation once (idempotent).
 * Facilitators stay on their original subject subgroup.
 *
 * @param {string} sessionId - Workshop session id.
 * @returns {Promise<void>} Transaction completion.
 */
export const applyWorldCoffeeRound2Rotation = async (sessionId) => {
  if (!sessionId) return;

  await runTransaction(ref(database, toWorldCoffeePath(sessionId)), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    if (currentData?.round2RotationAppliedAt) {
      return currentData;
    }

    const normalizedSubgroups = normalizeSubgroups(currentData?.subgroups);
    const subgroupIds = sortGroupIds(Object.keys(normalizedSubgroups));

    if (subgroupIds.length === 0) {
      return currentData;
    }

    const nextSubgroups = subgroupIds.reduce((accumulator, subgroupId) => {
      const subgroup = normalizedSubgroups[subgroupId] || {};
      const facilitatorId = String(subgroup?.facilitatorId || "").trim();

      accumulator[subgroupId] = {
        ...subgroup,
        participantIds: facilitatorId ? { [facilitatorId]: true } : {},
      };

      return accumulator;
    }, {});

    if (subgroupIds.length < 2) {
      const nextParticipantToSubgroup = {};

      subgroupIds.forEach((subgroupId) => {
        Object.keys(nextSubgroups[subgroupId]?.participantIds || {}).forEach((participantId) => {
          nextParticipantToSubgroup[participantId] = subgroupId;
        });
      });

      return {
        ...currentData,
        subgroups: nextSubgroups,
        participantToSubgroup: nextParticipantToSubgroup,
        round2RotationAppliedAt: nowIso(),
      };
    }

    const membersBySourceSubgroup = subgroupIds.reduce((accumulator, subgroupId) => {
      const subgroup = normalizedSubgroups[subgroupId] || {};
      const facilitatorId = String(subgroup?.facilitatorId || "").trim();
      const participantIds = Object.keys(subgroup?.participantIds || {});

      accumulator[subgroupId] = participantIds.filter((participantId) => {
        const cleanedParticipantId = String(participantId || "").trim();
        if (!cleanedParticipantId) return false;
        if (facilitatorId && cleanedParticipantId === facilitatorId) return false;
        return true;
      });

      return accumulator;
    }, {});

    subgroupIds.forEach((sourceSubgroupId, index) => {
      const targetSubgroupId = subgroupIds[(index + 1) % subgroupIds.length];
      const rotatedMembers = membersBySourceSubgroup[sourceSubgroupId] || [];

      rotatedMembers.forEach((participantId) => {
        nextSubgroups[targetSubgroupId].participantIds[participantId] = true;
      });
    });

    const nextParticipantToSubgroup = {};
    subgroupIds.forEach((subgroupId) => {
      Object.keys(nextSubgroups[subgroupId]?.participantIds || {}).forEach((participantId) => {
        const cleanedParticipantId = String(participantId || "").trim();
        if (!cleanedParticipantId) return;
        nextParticipantToSubgroup[cleanedParticipantId] = subgroupId;
      });
    });

    return {
      ...currentData,
      subgroups: nextSubgroups,
      participantToSubgroup: nextParticipantToSubgroup,
      round2RotationAppliedAt: nowIso(),
    };
  });
};

/**
 * Applies the round-3 subgroup rotation once (idempotent).
 * Facilitators stay on their original subject subgroup.
 *
 * @param {string} sessionId - Workshop session id.
 * @returns {Promise<void>} Transaction completion.
 */
export const applyWorldCoffeeRound3Rotation = async (sessionId) => {
  if (!sessionId) return;

  await runTransaction(ref(database, toWorldCoffeePath(sessionId)), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    if (currentData?.round3RotationAppliedAt) {
      return currentData;
    }

    const normalizedSubgroups = normalizeSubgroups(currentData?.subgroups);
    const subgroupIds = sortGroupIds(Object.keys(normalizedSubgroups));

    if (subgroupIds.length === 0) {
      return currentData;
    }

    const nextSubgroups = subgroupIds.reduce((accumulator, subgroupId) => {
      const subgroup = normalizedSubgroups[subgroupId] || {};
      const facilitatorId = String(subgroup?.facilitatorId || "").trim();

      accumulator[subgroupId] = {
        ...subgroup,
        participantIds: facilitatorId ? { [facilitatorId]: true } : {},
      };

      return accumulator;
    }, {});

    if (subgroupIds.length < 2) {
      const nextParticipantToSubgroup = {};

      subgroupIds.forEach((subgroupId) => {
        Object.keys(nextSubgroups[subgroupId]?.participantIds || {}).forEach((participantId) => {
          nextParticipantToSubgroup[participantId] = subgroupId;
        });
      });

      return {
        ...currentData,
        subgroups: nextSubgroups,
        participantToSubgroup: nextParticipantToSubgroup,
        round3RotationAppliedAt: nowIso(),
      };
    }

    const membersBySourceSubgroup = subgroupIds.reduce((accumulator, subgroupId) => {
      const subgroup = normalizedSubgroups[subgroupId] || {};
      const facilitatorId = String(subgroup?.facilitatorId || "").trim();
      const participantIds = Object.keys(subgroup?.participantIds || {});

      accumulator[subgroupId] = participantIds.filter((participantId) => {
        const cleanedParticipantId = String(participantId || "").trim();
        if (!cleanedParticipantId) return false;
        if (facilitatorId && cleanedParticipantId === facilitatorId) return false;
        return true;
      });

      return accumulator;
    }, {});

    subgroupIds.forEach((sourceSubgroupId, index) => {
      const targetSubgroupId = subgroupIds[(index + 1) % subgroupIds.length];
      const rotatedMembers = membersBySourceSubgroup[sourceSubgroupId] || [];

      rotatedMembers.forEach((participantId) => {
        nextSubgroups[targetSubgroupId].participantIds[participantId] = true;
      });
    });

    const nextParticipantToSubgroup = {};
    subgroupIds.forEach((subgroupId) => {
      Object.keys(nextSubgroups[subgroupId]?.participantIds || {}).forEach((participantId) => {
        const cleanedParticipantId = String(participantId || "").trim();
        if (!cleanedParticipantId) return;
        nextParticipantToSubgroup[cleanedParticipantId] = subgroupId;
      });
    });

    return {
      ...currentData,
      subgroups: nextSubgroups,
      participantToSubgroup: nextParticipantToSubgroup,
      round3RotationAppliedAt: nowIso(),
    };
  });
};

/**
 * Applies the return-to-origin subgroup rotation once (idempotent).
 * Facilitators stay on their original subject subgroup while members move by -2.
 *
 * @param {string} sessionId - Workshop session id.
 * @returns {Promise<void>} Transaction completion.
 */
export const applyWorldCoffeeReturnRotation = async (sessionId) => {
  if (!sessionId) return;

  await runTransaction(ref(database, toWorldCoffeePath(sessionId)), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    if (currentData?.returnRotationAppliedAt) {
      return currentData;
    }

    const normalizedSubgroups = normalizeSubgroups(currentData?.subgroups);
    const subgroupIds = sortGroupIds(Object.keys(normalizedSubgroups));

    if (subgroupIds.length === 0) {
      return currentData;
    }

    const nextSubgroups = subgroupIds.reduce((accumulator, subgroupId) => {
      const subgroup = normalizedSubgroups[subgroupId] || {};
      const facilitatorId = String(subgroup?.facilitatorId || "").trim();

      accumulator[subgroupId] = {
        ...subgroup,
        participantIds: facilitatorId ? { [facilitatorId]: true } : {},
      };

      return accumulator;
    }, {});

    if (subgroupIds.length < 2) {
      const nextParticipantToSubgroup = {};

      subgroupIds.forEach((subgroupId) => {
        Object.keys(nextSubgroups[subgroupId]?.participantIds || {}).forEach((participantId) => {
          nextParticipantToSubgroup[participantId] = subgroupId;
        });
      });

      return {
        ...currentData,
        subgroups: nextSubgroups,
        participantToSubgroup: nextParticipantToSubgroup,
        returnRotationAppliedAt: nowIso(),
      };
    }

    const membersBySourceSubgroup = subgroupIds.reduce((accumulator, subgroupId) => {
      const subgroup = normalizedSubgroups[subgroupId] || {};
      const facilitatorId = String(subgroup?.facilitatorId || "").trim();
      const participantIds = Object.keys(subgroup?.participantIds || {});

      accumulator[subgroupId] = participantIds.filter((participantId) => {
        const cleanedParticipantId = String(participantId || "").trim();
        if (!cleanedParticipantId) return false;
        if (facilitatorId && cleanedParticipantId === facilitatorId) return false;
        return true;
      });

      return accumulator;
    }, {});

    subgroupIds.forEach((sourceSubgroupId, index) => {
      const targetIndex = (index - 2 + subgroupIds.length) % subgroupIds.length;
      const targetSubgroupId = subgroupIds[targetIndex];
      const rotatedMembers = membersBySourceSubgroup[sourceSubgroupId] || [];

      rotatedMembers.forEach((participantId) => {
        nextSubgroups[targetSubgroupId].participantIds[participantId] = true;
      });
    });

    const nextParticipantToSubgroup = {};
    subgroupIds.forEach((subgroupId) => {
      Object.keys(nextSubgroups[subgroupId]?.participantIds || {}).forEach((participantId) => {
        const cleanedParticipantId = String(participantId || "").trim();
        if (!cleanedParticipantId) return;
        nextParticipantToSubgroup[cleanedParticipantId] = subgroupId;
      });
    });

    return {
      ...currentData,
      subgroups: nextSubgroups,
      participantToSubgroup: nextParticipantToSubgroup,
      returnRotationAppliedAt: nowIso(),
    };
  });
};

/**
 * Upserts a World Cafe participant with presence timestamps.
 * @param {string} sessionId - Workshop session id.
 * @param {{id:string, name?:string, email?:string, isAuthenticated?:boolean}} [participant={}] - Participant payload.
 * @returns {Promise<void>} Upsert completion.
 */
export const upsertWorldCoffeeParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toWorldCoffeePath(sessionId)}/participants/${participant.id}`
  );
  const now = nowIso();

  await runTransaction(participantRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};

    return {
      id: participant.id,
      name: participant.name || currentData.name || "",
      email: participant.email || currentData.email || "",
      isAuthenticated: Boolean(
        participant.isAuthenticated ?? currentData.isAuthenticated
      ),
      joinedAt: currentData.joinedAt || now,
      lastSeenAt: now,
    };
  });
};

/**
 * Creates a World Cafe description line.
 * @param {string} sessionId - Workshop session id.
 * @param {{authorId:string, text?:string}} [payload={}] - Description payload.
 * @returns {Promise<string>} Created description id.
 */
export const createWorldCoffeeDescription = async (sessionId, payload = {}) => {
  if (!sessionId || !payload?.authorId) {
    throw new Error("createWorldCoffeeDescription: sessionId ou authorId manquant");
  }

  const descriptionRef = push(ref(database, `${toWorldCoffeePath(sessionId)}/descriptions`));
  const descriptionId = descriptionRef.key;
  if (!descriptionId) {
    throw new Error("Impossible de generer descriptionId");
  }

  const now = nowIso();

  await set(descriptionRef, {
    id: descriptionId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    createdAt: now,
    updatedAt: now,
  });

  return descriptionId;
};

/**
 * Updates a World Cafe description line.
 * @param {string} sessionId - Workshop session id.
 * @param {string} descriptionId - Description id.
 * @param {{text?:string}} [patch={}] - Description patch.
 * @param {{expectedPreviousText?:string}} [options={}] - Optional concurrency guard.
 * @returns {Promise<void>} Update completion.
 */
export const updateWorldCoffeeDescription = async (
  sessionId,
  descriptionId,
  patch = {},
  options = {}
) => {
  if (!sessionId || !descriptionId) return;

  const hasTextPatch = Object.prototype.hasOwnProperty.call(patch, "text");
  if (!hasTextPatch) {
    await update(ref(database, `${toWorldCoffeePath(sessionId)}/descriptions/${descriptionId}`), {
      updatedAt: nowIso(),
    });
    return;
  }

  const nextText = String(patch.text ?? "");
  const hasExpectedPreviousText = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousText"
  );
  const expectedPreviousText = hasExpectedPreviousText
    ? String(options.expectedPreviousText ?? "")
    : null;

  await runTransaction(
    ref(database, `${toWorldCoffeePath(sessionId)}/descriptions/${descriptionId}`),
    (current) => {
      const currentData = current && typeof current === "object" ? current : {};
      if (!currentData?.id) return current;

      const currentText = String(currentData.text ?? "");
      const shouldRejectStaleWrite =
        expectedPreviousText !== null && expectedPreviousText !== currentText;
      if (shouldRejectStaleWrite) return;

      return {
        ...currentData,
        text: nextText,
        updatedAt: nowIso(),
      };
    }
  );
};

/**
 * Updates subgroup synthesis text in the World Cafe session.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} subgroupId - Subgroup id.
 * @param {{text?:string, authorId?:string}} [patch={}] - Synthesis patch.
 * @param {{expectedPreviousText?:string}} [options={}] - Optional concurrency guard.
 * @returns {Promise<void>} Update completion.
 */
export const updateWorldCoffeeSubgroupSynthesis = async (
  sessionId,
  subgroupId,
  patch = {},
  options = {}
) => {
  const cleanedSubgroupId = String(subgroupId || "").trim();
  if (!sessionId || !cleanedSubgroupId) return;

  const hasTextPatch = Object.prototype.hasOwnProperty.call(patch, "text");
  const nextText = hasTextPatch ? String(patch.text ?? "") : null;
  const nextAuthorId = String(patch?.authorId || "").trim();

  const hasExpectedPreviousText = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousText"
  );
  const expectedPreviousText = hasExpectedPreviousText
    ? String(options.expectedPreviousText ?? "")
    : null;

  await runTransaction(
    ref(database, `${toWorldCoffeePath(sessionId)}/synthesisBySubgroup/${cleanedSubgroupId}`),
    (current) => {
      const currentData = current && typeof current === "object" ? current : {};
      const currentText = String(currentData?.text ?? "");

      const shouldRejectStaleWrite =
        expectedPreviousText !== null && expectedPreviousText !== currentText;
      if (shouldRejectStaleWrite) return;

      return {
        text: hasTextPatch ? nextText : currentText,
        authorId: nextAuthorId || String(currentData?.authorId || ""),
        createdAt: String(currentData?.createdAt || nowIso()),
        updatedAt: nowIso(),
      };
    }
  );
};

/**
 * Assigns a facilitator to a description and enforces global uniqueness.
 * A facilitator can only be assigned to one description at a time.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} descriptionId - Description id.
 * @param {string} facilitatorId - Participant id.
 * @returns {Promise<void>} Update completion.
 */
export const setWorldCoffeeFacilitator = async (
  sessionId,
  descriptionId,
  facilitatorId
) => {
  const cleanedDescriptionId = String(descriptionId || "").trim();
  const cleanedFacilitatorId = String(facilitatorId || "").trim();
  if (!sessionId || !cleanedDescriptionId || !cleanedFacilitatorId) return;

  await runTransaction(ref(database, toWorldCoffeePath(sessionId)), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const descriptions =
      currentData?.descriptions && typeof currentData.descriptions === "object"
        ? currentData.descriptions
        : {};

    const targetDescription = descriptions?.[cleanedDescriptionId];
    if (!targetDescription?.id && !targetDescription) {
      return current;
    }

    const rawMapping =
      currentData?.facilitatorByDescriptionId &&
      typeof currentData.facilitatorByDescriptionId === "object"
        ? currentData.facilitatorByDescriptionId
        : {};
    const nextMapping = { ...rawMapping };

    Object.entries(nextMapping).forEach(([mappedDescriptionId, mappedFacilitatorId]) => {
      if (String(mappedFacilitatorId || "").trim() !== cleanedFacilitatorId) return;
      delete nextMapping[mappedDescriptionId];
    });

    nextMapping[cleanedDescriptionId] = cleanedFacilitatorId;

    return {
      ...currentData,
      facilitatorByDescriptionId: nextMapping,
    };
  });
};

/**
 * Clears facilitator assignment for a description.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} descriptionId - Description id.
 * @returns {Promise<void>} Update completion.
 */
export const clearWorldCoffeeFacilitator = async (sessionId, descriptionId) => {
  const cleanedDescriptionId = String(descriptionId || "").trim();
  if (!sessionId || !cleanedDescriptionId) return;

  await runTransaction(ref(database, toWorldCoffeePath(sessionId)), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const descriptions =
      currentData?.descriptions && typeof currentData.descriptions === "object"
        ? currentData.descriptions
        : {};

    const targetDescription = descriptions?.[cleanedDescriptionId];
    if (!targetDescription?.id && !targetDescription) {
      return current;
    }

    const rawMapping =
      currentData?.facilitatorByDescriptionId &&
      typeof currentData.facilitatorByDescriptionId === "object"
        ? currentData.facilitatorByDescriptionId
        : {};

    if (!Object.prototype.hasOwnProperty.call(rawMapping, cleanedDescriptionId)) {
      return current;
    }

    const nextMapping = { ...rawMapping };
    delete nextMapping[cleanedDescriptionId];

    return {
      ...currentData,
      facilitatorByDescriptionId: nextMapping,
    };
  });
};

/**
 * Creates a World Cafe idea for a subgroup.
 * The round metadata is always normalized to "premier round".
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} subgroupId - Subgroup id.
 * @param {{authorId:string, text?:string, roundId?:string, roundLabel?:string}} [payload={}] - Idea payload.
 * @returns {Promise<string>} Created idea id.
 */
export const createWorldCoffeeIdea = async (sessionId, subgroupId, payload = {}) => {
  const cleanedSubgroupId = String(subgroupId || "").trim();
  if (!sessionId || !cleanedSubgroupId || !payload?.authorId) {
    throw new Error("createWorldCoffeeIdea: sessionId, subgroupId ou authorId manquant");
  }

  const ideasRef = ref(database, `${toWorldCoffeePath(sessionId)}/ideasBySubgroup/${cleanedSubgroupId}`);
  const ideaRef = push(ideasRef);
  const ideaId = ideaRef.key;
  if (!ideaId) {
    throw new Error("Impossible de generer ideaId");
  }

  const now = nowIso();

  await set(ideaRef, {
    id: ideaId,
    authorId: String(payload.authorId || "").trim(),
    text: String(payload.text ?? ""),
    roundId: "round-1",
    roundLabel: "premier-round",
    createdAt: now,
    updatedAt: now,
  });

  return ideaId;
};

/**
 * Updates a World Cafe idea.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} subgroupId - Subgroup id.
 * @param {string} ideaId - Idea id.
 * @param {{text?:string}} [patch={}] - Idea patch.
 * @param {{expectedPreviousText?:string}} [options={}] - Optional concurrency guard.
 * @returns {Promise<void>} Update completion.
 */
export const updateWorldCoffeeIdea = async (
  sessionId,
  subgroupId,
  ideaId,
  patch = {},
  options = {}
) => {
  const cleanedSubgroupId = String(subgroupId || "").trim();
  const cleanedIdeaId = String(ideaId || "").trim();
  if (!sessionId || !cleanedSubgroupId || !cleanedIdeaId) return;

  const hasTextPatch = Object.prototype.hasOwnProperty.call(patch, "text");
  if (!hasTextPatch) {
    await update(
      ref(
        database,
        `${toWorldCoffeePath(sessionId)}/ideasBySubgroup/${cleanedSubgroupId}/${cleanedIdeaId}`
      ),
      { updatedAt: nowIso() }
    );
    return;
  }

  const nextText = String(patch.text ?? "");
  const hasExpectedPreviousText = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousText"
  );
  const expectedPreviousText = hasExpectedPreviousText
    ? String(options.expectedPreviousText ?? "")
    : null;

  await runTransaction(
    ref(
      database,
      `${toWorldCoffeePath(sessionId)}/ideasBySubgroup/${cleanedSubgroupId}/${cleanedIdeaId}`
    ),
    (current) => {
      const currentData = current && typeof current === "object" ? current : {};
      if (!currentData?.id) return current;

      const currentText = String(currentData.text ?? "");
      const shouldRejectStaleWrite =
        expectedPreviousText !== null && expectedPreviousText !== currentText;
      if (shouldRejectStaleWrite) return;

      return {
        ...currentData,
        text: nextText,
        updatedAt: nowIso(),
      };
    }
  );
};

/**
 * Removes a World Cafe idea from a subgroup.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} subgroupId - Subgroup id.
 * @param {string} ideaId - Idea id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeWorldCoffeeIdea = async (sessionId, subgroupId, ideaId) => {
  const cleanedSubgroupId = String(subgroupId || "").trim();
  const cleanedIdeaId = String(ideaId || "").trim();
  if (!sessionId || !cleanedSubgroupId || !cleanedIdeaId) return;

  await update(ref(database), {
    [`${toWorldCoffeePath(sessionId)}/ideasBySubgroup/${cleanedSubgroupId}/${cleanedIdeaId}`]:
      null,
    [`${toWorldCoffeePath(sessionId)}/commentsByIdea/${cleanedIdeaId}`]: null,
    [`${toWorldCoffeePath(sessionId)}/repliesByComment/idea-${cleanedIdeaId}`]: null,
  });
};

/**
 * Adds a comment on an idea for round 2.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} ideaId - Idea id.
 * @param {{authorId:string, text?:string}} [payload={}] - Comment payload.
 * @returns {Promise<string>} Created comment id.
 */
export const addWorldCoffeeIdeaComment = async (sessionId, ideaId, payload = {}) => {
  const cleanedIdeaId = String(ideaId || "").trim();
  if (!sessionId || !cleanedIdeaId || !payload?.authorId) {
    throw new Error("addWorldCoffeeIdeaComment: sessionId, ideaId ou authorId manquant");
  }

  const commentRef = push(ref(database, `${toWorldCoffeePath(sessionId)}/commentsByIdea/${cleanedIdeaId}`));
  const commentId = commentRef.key;
  if (!commentId) {
    throw new Error("Impossible de generer commentId");
  }

  const now = nowIso();

  await set(commentRef, {
    id: commentId,
    authorId: String(payload.authorId || "").trim(),
    text: String(payload.text ?? ""),
    roundId: "round-2",
    roundLabel: "premier-rotation",
    createdAt: now,
    updatedAt: now,
  });

  return commentId;
};

/**
 * Updates a comment attached to a World Cafe idea.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} ideaId - Idea id.
 * @param {string} commentId - Comment id.
 * @param {{text?:string}} [patch={}] - Comment patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateWorldCoffeeIdeaComment = async (
  sessionId,
  ideaId,
  commentId,
  patch = {}
) => {
  const cleanedIdeaId = String(ideaId || "").trim();
  const cleanedCommentId = String(commentId || "").trim();
  if (!sessionId || !cleanedIdeaId || !cleanedCommentId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = String(patch.text ?? "");
  }

  await update(
    ref(database, `${toWorldCoffeePath(sessionId)}/commentsByIdea/${cleanedIdeaId}/${cleanedCommentId}`),
    payload
  );
};

/**
 * Removes a comment attached to a World Cafe idea.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} ideaId - Idea id.
 * @param {string} commentId - Comment id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeWorldCoffeeIdeaComment = async (sessionId, ideaId, commentId) => {
  const cleanedIdeaId = String(ideaId || "").trim();
  const cleanedCommentId = String(commentId || "").trim();
  if (!sessionId || !cleanedIdeaId || !cleanedCommentId) return;

  await update(ref(database), {
    [`${toWorldCoffeePath(sessionId)}/commentsByIdea/${cleanedIdeaId}/${cleanedCommentId}`]: null,
    [`${toWorldCoffeePath(sessionId)}/repliesByComment/${cleanedCommentId}`]: null,
  });
};

/**
 * Adds a reply on a round-2 comment for round 3.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} commentId - Comment id.
 * @param {{authorId:string, text?:string}} [payload={}] - Reply payload.
 * @returns {Promise<string>} Created reply id.
 */
export const addWorldCoffeeCommentReply = async (sessionId, commentId, payload = {}) => {
  const cleanedCommentId = String(commentId || "").trim();
  if (!sessionId || !cleanedCommentId || !payload?.authorId) {
    throw new Error("addWorldCoffeeCommentReply: sessionId, commentId ou authorId manquant");
  }

  const replyRef = push(
    ref(database, `${toWorldCoffeePath(sessionId)}/repliesByComment/${cleanedCommentId}`)
  );
  const replyId = replyRef.key;
  if (!replyId) {
    throw new Error("Impossible de generer replyId");
  }

  const now = nowIso();

  await set(replyRef, {
    id: replyId,
    authorId: String(payload.authorId || "").trim(),
    text: String(payload.text ?? ""),
    roundId: "round-3",
    roundLabel: "deuxieme-rotation",
    createdAt: now,
    updatedAt: now,
  });

  return replyId;
};

/**
 * Updates a reply attached to a World Cafe comment.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} commentId - Comment id.
 * @param {string} replyId - Reply id.
 * @param {{text?:string}} [patch={}] - Reply patch.
 * @returns {Promise<void>} Update completion.
 */
export const updateWorldCoffeeCommentReply = async (
  sessionId,
  commentId,
  replyId,
  patch = {}
) => {
  const cleanedCommentId = String(commentId || "").trim();
  const cleanedReplyId = String(replyId || "").trim();
  if (!sessionId || !cleanedCommentId || !cleanedReplyId) return;

  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = String(patch.text ?? "");
  }

  await update(
    ref(
      database,
      `${toWorldCoffeePath(sessionId)}/repliesByComment/${cleanedCommentId}/${cleanedReplyId}`
    ),
    payload
  );
};

/**
 * Removes a reply attached to a World Cafe comment.
 *
 * @param {string} sessionId - Workshop session id.
 * @param {string} commentId - Comment id.
 * @param {string} replyId - Reply id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeWorldCoffeeCommentReply = async (sessionId, commentId, replyId) => {
  const cleanedCommentId = String(commentId || "").trim();
  const cleanedReplyId = String(replyId || "").trim();
  if (!sessionId || !cleanedCommentId || !cleanedReplyId) return;

  await update(ref(database), {
    [`${toWorldCoffeePath(sessionId)}/repliesByComment/${cleanedCommentId}/${cleanedReplyId}`]:
      null,
  });
};

/**
 * Removes a World Cafe description line.
 * @param {string} sessionId - Workshop session id.
 * @param {string} descriptionId - Description id.
 * @returns {Promise<void>} Delete completion.
 */
export const removeWorldCoffeeDescription = async (sessionId, descriptionId) => {
  const cleanedDescriptionId = String(descriptionId || "").trim();
  if (!sessionId || !cleanedDescriptionId) return;

  const basePath = toWorldCoffeePath(sessionId);

  await update(ref(database), {
    [`${basePath}/descriptions/${cleanedDescriptionId}`]: null,
    [`${basePath}/facilitatorByDescriptionId/${cleanedDescriptionId}`]: null,
  });
};
