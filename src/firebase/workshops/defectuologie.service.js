import {
  get,
  onValue,
  push,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";
import { database } from "../index";

const MAX_VOTES_PER_STEP = 1;
const SUBGROUP_MIN_SIZE = 4;
const SUBGROUP_MAX_SIZE = 8;

const nowIso = () => new Date().toISOString();

const toDefectuologiePath = (sessionId) => `workshopSessions/${sessionId}/defectuologie`;

const normalizeSubgroupId = (value) =>
  String(value || "")
    .trim()
    .replace(/[.#$/[\]]/g, "-");

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

const sortParticipantsForGrouping = (participants = []) => {
  return [...participants].sort((a, b) => {
    const nameA = String(resolveParticipantName(a) || "").toLocaleLowerCase("fr");
    const nameB = String(resolveParticipantName(b) || "").toLocaleLowerCase("fr");

    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, "fr");
    }

    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
};

const computeBalancedSubgroupSizes = (participantCount) => {
  const total = Number.isFinite(participantCount)
    ? Math.max(0, Math.floor(participantCount))
    : 0;

  if (total <= 0) return [];
  if (total < SUBGROUP_MIN_SIZE) return [total];

  const groupCount = Math.max(1, Math.ceil(total / SUBGROUP_MAX_SIZE));
  const baseSize = Math.floor(total / groupCount);
  const remainder = total % groupCount;

  return Array.from({ length: groupCount }, (_, index) => {
    return baseSize + (index < remainder ? 1 : 0);
  }).filter((size) => size > 0);
};

const extractConnectedParticipants = (participantsById = {}) => {
  if (!participantsById || typeof participantsById !== "object") return [];

  return Object.entries(participantsById)
    .map(([participantId, participant]) => ({
      id: String(participant?.id || participantId || "").trim(),
      ...participant,
    }))
    .filter((participant) => participant.id);
};

const buildInitialSubgroupAssignment = (participants = []) => {
  const orderedParticipants = sortParticipantsForGrouping(participants);
  const sizes = computeBalancedSubgroupSizes(orderedParticipants.length);

  const subgroups = {};
  const participantToSubgroup = {};

  let cursor = 0;

  sizes.forEach((size, index) => {
    const subgroupId = `group-${index + 1}`;
    const participantIds = {};

    for (let offset = 0; offset < size; offset += 1) {
      const participant = orderedParticipants[cursor + offset];
      const participantId = String(participant?.id || "").trim();
      if (!participantId) continue;

      participantIds[participantId] = true;
      participantToSubgroup[participantId] = subgroupId;
    }

    cursor += size;

    subgroups[subgroupId] = {
      id: subgroupId,
      label: `Sous-groupe ${index + 1}`,
      participantIds,
    };
  });

  if (Object.keys(subgroups).length === 0) {
    subgroups["group-1"] = {
      id: "group-1",
      label: "Sous-groupe 1",
      participantIds: {},
    };
  }

  return {
    subgroups,
    participantToSubgroup,
  };
};

const normalizeSubgroupLabel = (subgroupId, label, fallbackIndex) => {
  const cleanedLabel = String(label || "").trim();
  if (cleanedLabel) return cleanedLabel;

  const parsedIndex = parseSubgroupIndex(subgroupId);
  if (parsedIndex > 0) return `Sous-groupe ${parsedIndex}`;

  return `Sous-groupe ${fallbackIndex}`;
};

const normalizeSubgroupParticipantIds = (participantIds = {}) => {
  if (Array.isArray(participantIds)) {
    return participantIds.reduce((accumulator, participantId) => {
      const cleanedParticipantId = String(participantId || "").trim();
      if (!cleanedParticipantId) return accumulator;

      accumulator[cleanedParticipantId] = true;
      return accumulator;
    }, {});
  }

  if (!participantIds || typeof participantIds !== "object") return {};

  return Object.entries(participantIds).reduce(
    (accumulator, [participantId, enabledOrParticipantId]) => {
      // Backward-compat: support array-like objects (`{0: "<uid>"}`).
      if (typeof enabledOrParticipantId === "string") {
        const cleanedParticipantId = String(enabledOrParticipantId || "").trim();
        if (!cleanedParticipantId) return accumulator;

        accumulator[cleanedParticipantId] = true;
        return accumulator;
      }

      if (!enabledOrParticipantId) return accumulator;

      const cleanedParticipantId = String(participantId || "").trim();
      if (!cleanedParticipantId) return accumulator;

      accumulator[cleanedParticipantId] = true;
      return accumulator;
    },
    {}
  );
};

const normalizeSubgroups = (subgroups = {}) => {
  if (!subgroups || typeof subgroups !== "object") return {};

  const normalized = {};

  Object.entries(subgroups).forEach(([rawSubgroupId, subgroup], index) => {
    const subgroupId = normalizeSubgroupId(subgroup?.id || rawSubgroupId);
    if (!subgroupId) return;

    const participantIds = normalizeSubgroupParticipantIds(subgroup?.participantIds);

    normalized[subgroupId] = {
      id: subgroupId,
      label: normalizeSubgroupLabel(subgroupId, subgroup?.label, index + 1),
      participantIds,
    };
  });

  return normalized;
};

const normalizeParticipantToSubgroup = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [participantId, subgroupId]) => {
    const cleanedParticipantId = String(participantId || "").trim();
    const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

    if (!cleanedParticipantId || !cleanedSubgroupId) return accumulator;

    accumulator[cleanedParticipantId] = cleanedSubgroupId;
    return accumulator;
  }, {});
};

const rebuildParticipantMappingFromSubgroups = (subgroups = {}) => {
  const normalizedSubgroups = normalizeSubgroups(subgroups);

  return Object.values(normalizedSubgroups).reduce((accumulator, subgroup) => {
    const subgroupId = String(subgroup?.id || "").trim();
    if (!subgroupId) return accumulator;

    const participantIds =
      subgroup?.participantIds && typeof subgroup.participantIds === "object"
        ? subgroup.participantIds
        : {};

    Object.entries(participantIds).forEach(([participantId, enabled]) => {
      if (!enabled) return;
      const cleanedParticipantId = String(participantId || "").trim();
      if (!cleanedParticipantId) return;

      accumulator[cleanedParticipantId] = subgroupId;
    });

    return accumulator;
  }, {});
};

const ensureSubgroupExists = (subgroups, subgroupId) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);
  if (!cleanedSubgroupId) return "";

  if (!subgroups[cleanedSubgroupId]) {
    subgroups[cleanedSubgroupId] = {
      id: cleanedSubgroupId,
      label: normalizeSubgroupLabel(
        cleanedSubgroupId,
        "",
        Object.keys(subgroups).length + 1
      ),
      participantIds: {},
    };
  } else {
    subgroups[cleanedSubgroupId] = {
      ...subgroups[cleanedSubgroupId],
      id: cleanedSubgroupId,
      label: normalizeSubgroupLabel(
        cleanedSubgroupId,
        subgroups[cleanedSubgroupId]?.label,
        Object.keys(subgroups).length + 1
      ),
      participantIds: normalizeSubgroupParticipantIds(subgroups[cleanedSubgroupId]?.participantIds),
    };
  }

  return cleanedSubgroupId;
};

const mergeParticipantMappingIntoSubgroups = (subgroups = {}, participantToSubgroup = {}) => {
  const nextSubgroups = normalizeSubgroups(subgroups);

  Object.entries(participantToSubgroup).forEach(([participantId, subgroupId]) => {
    const cleanedParticipantId = String(participantId || "").trim();
    const cleanedSubgroupId = ensureSubgroupExists(nextSubgroups, subgroupId);

    if (!cleanedParticipantId || !cleanedSubgroupId) return;

    nextSubgroups[cleanedSubgroupId].participantIds[cleanedParticipantId] = true;
  });

  return nextSubgroups;
};

const ingestAuthoredItemsIntoAssignment = (
  nextSubgroups,
  participantToSubgroup,
  itemsBySubgroup = {}
) => {
  if (!itemsBySubgroup || typeof itemsBySubgroup !== "object") return;

  Object.entries(itemsBySubgroup).forEach(([rawSubgroupId, rawItems]) => {
    const cleanedSubgroupId = ensureSubgroupExists(nextSubgroups, rawSubgroupId);
    if (!cleanedSubgroupId) return;
    if (!rawItems || typeof rawItems !== "object") return;

    Object.values(rawItems).forEach((item) => {
      const authorId = String(item?.authorId || "").trim();
      if (!authorId) return;

      const existingAssignment = participantToSubgroup[authorId];
      const assignedSubgroupId = ensureSubgroupExists(
        nextSubgroups,
        existingAssignment || cleanedSubgroupId
      );

      if (!assignedSubgroupId) return;

      participantToSubgroup[authorId] = assignedSubgroupId;
      nextSubgroups[assignedSubgroupId].participantIds[authorId] = true;
    });
  });
};

const rebuildAssignmentFromAuthoredItems = (
  defectsBySubgroup = {},
  solutionsBySubgroup = {},
  existingSubgroups = {}
) => {
  const nextSubgroups = normalizeSubgroups(existingSubgroups);
  const participantToSubgroup = rebuildParticipantMappingFromSubgroups(nextSubgroups);

  ingestAuthoredItemsIntoAssignment(nextSubgroups, participantToSubgroup, defectsBySubgroup);
  ingestAuthoredItemsIntoAssignment(nextSubgroups, participantToSubgroup, solutionsBySubgroup);

  return {
    subgroups: nextSubgroups,
    participantToSubgroup,
  };
};

const countSubgroupParticipants = (subgroup = {}) => {
  const participantIds = subgroup?.participantIds && typeof subgroup.participantIds === "object"
    ? subgroup.participantIds
    : {};

  return Object.values(participantIds).reduce((count, enabled) => {
    return enabled ? count + 1 : count;
  }, 0);
};

const parseSubgroupIndex = (subgroupId) => {
  const match = String(subgroupId || "").match(/group-(\d+)/);
  return match ? Number(match[1]) : 0;
};

const findSmallestNonFullSubgroup = (subgroups = {}) => {
  const entries = Object.values(subgroups)
    .map((subgroup) => ({
      subgroup,
      size: countSubgroupParticipants(subgroup),
    }))
    .filter(({ subgroup }) => subgroup?.id)
    .sort((a, b) => {
      if (a.size !== b.size) {
        return a.size - b.size;
      }

      return parseSubgroupIndex(a.subgroup.id) - parseSubgroupIndex(b.subgroup.id);
    });

  const firstAvailable = entries.find(({ size }) => size < SUBGROUP_MAX_SIZE);
  return firstAvailable?.subgroup || null;
};

const createNextSubgroup = (subgroups = {}) => {
  const nextIndex = Object.keys(subgroups).reduce((maxIndex, subgroupId) => {
    return Math.max(maxIndex, parseSubgroupIndex(subgroupId));
  }, 0) + 1;

  const subgroupId = `group-${nextIndex}`;

  return {
    id: subgroupId,
    label: `Sous-groupe ${nextIndex}`,
    participantIds: {},
  };
};

const rebuildSubgroupsFromParticipantMapping = (participantToSubgroup = {}, existingSubgroups = {}) => {
  const normalizedExistingSubgroups = normalizeSubgroups(existingSubgroups);
  const nextSubgroups = {};
  let fallbackIndex = 1;

  Object.entries(participantToSubgroup).forEach(([participantId, subgroupId]) => {
    const cleanedParticipantId = String(participantId || "").trim();
    const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

    if (!cleanedParticipantId || !cleanedSubgroupId) return;

    if (!nextSubgroups[cleanedSubgroupId]) {
      const existingSubgroup = normalizedExistingSubgroups[cleanedSubgroupId];
      const parsedIndex = parseSubgroupIndex(cleanedSubgroupId);
      const labelIndex = parsedIndex > 0 ? parsedIndex : fallbackIndex;

      nextSubgroups[cleanedSubgroupId] = {
        id: cleanedSubgroupId,
        label: String(existingSubgroup?.label || `Sous-groupe ${labelIndex}`).trim(),
        participantIds: {},
      };

      fallbackIndex += 1;
    }

    nextSubgroups[cleanedSubgroupId].participantIds[cleanedParticipantId] = true;
  });

  return nextSubgroups;
};

const normalizeTextPatch = (patch = {}) => {
  const payload = {
    updatedAt: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "text")) {
    payload.text = patch.text ?? "";
  }

  return payload;
};

const normalizeVotesByParticipant = (votesByParticipant = {}, validIds = null) => {
  if (!votesByParticipant || typeof votesByParticipant !== "object") return {};

  return Object.entries(votesByParticipant).reduce((accumulator, [participantId, votes]) => {
    if (!votes || typeof votes !== "object") return accumulator;

    const cleanedVotes = Object.entries(votes).reduce((votesAccumulator, [itemId, enabled]) => {
      if (!enabled) return votesAccumulator;
      if (validIds instanceof Set && !validIds.has(itemId)) return votesAccumulator;

      votesAccumulator[itemId] = true;
      return votesAccumulator;
    }, {});

    if (Object.keys(cleanedVotes).length > 0) {
      accumulator[participantId] = cleanedVotes;
    }

    return accumulator;
  }, {});
};

export const subscribeSession = (
  sessionId,
  callback,
  onError = () => {}
) => {
  if (!sessionId) {
    callback(null);
    return () => {};
  }

  const defectuologieRef = ref(database, toDefectuologiePath(sessionId));

  return onValue(
    defectuologieRef,
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    onError
  );
};

export const fetchSessionOnce = async (sessionId) => {
  if (!sessionId) return null;

  const snapshot = await get(ref(database, toDefectuologiePath(sessionId)));
  return snapshot.exists() ? snapshot.val() : null;
};

export const upsertParticipant = async (
  sessionId,
  participant = {}
) => {
  if (!sessionId || !participant?.id) return;

  const participantRef = ref(
    database,
    `${toDefectuologiePath(sessionId)}/participants/${participant.id}`
  );

  const now = nowIso();

  await runTransaction(participantRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};

    return {
      id: participant.id,
      name: participant.name || currentData.name || "",
      email: participant.email || currentData.email || "",
      isAuthenticated: Boolean(participant.isAuthenticated ?? currentData.isAuthenticated),
      joinedAt: currentData.joinedAt || now,
      lastSeenAt: now,
    };
  });
};

export const initializeSubgroups = async (sessionId) => {
  if (!sessionId) return;

  const defectuologieRef = ref(database, toDefectuologiePath(sessionId));

  await runTransaction(defectuologieRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const participantToSubgroupFromMapping = normalizeParticipantToSubgroup(
      currentData.participantToSubgroup
    );
    const normalizedSubgroups = normalizeSubgroups(currentData.subgroups);
    const reconstructedAssignment = rebuildAssignmentFromAuthoredItems(
      currentData.defectsBySubgroup,
      currentData.solutionsBySubgroup,
      normalizedSubgroups
    );
    const participantToSubgroup =
      Object.keys(participantToSubgroupFromMapping).length > 0
        ? participantToSubgroupFromMapping
        : reconstructedAssignment.participantToSubgroup;
    const normalizedSubgroupsWithMapping =
      Object.keys(participantToSubgroup).length > 0
        ? mergeParticipantMappingIntoSubgroups(
            Object.keys(normalizedSubgroups).length > 0
              ? normalizedSubgroups
              : reconstructedAssignment.subgroups,
            participantToSubgroup
          )
        : normalizedSubgroups;

    if (Object.keys(participantToSubgroup).length > 0) {
      return {
        ...currentData,
        subgroups: normalizedSubgroupsWithMapping,
        participantToSubgroup,
      };
    }

    const connectedParticipants = extractConnectedParticipants(currentData.participants);
    if (connectedParticipants.length === 0) {
      return currentData;
    }

    const assignment = buildInitialSubgroupAssignment(connectedParticipants);

    return {
      ...currentData,
      subgroups: assignment.subgroups,
      participantToSubgroup: assignment.participantToSubgroup,
      subgroupInitializedAt: nowIso(),
    };
  });
};

export const assignParticipantToSubgroup = async (
  sessionId,
  participantId
) => {
  const cleanedParticipantId = String(participantId || "").trim();
  if (!sessionId || !cleanedParticipantId) return;

  const defectuologieRef = ref(database, toDefectuologiePath(sessionId));

  await runTransaction(defectuologieRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};

    const connectedParticipants = extractConnectedParticipants(currentData.participants);
    const participantToSubgroupFromMapping = normalizeParticipantToSubgroup(
      currentData.participantToSubgroup
    );
    let subgroups = normalizeSubgroups(currentData.subgroups);
    const reconstructedAssignment = rebuildAssignmentFromAuthoredItems(
      currentData.defectsBySubgroup,
      currentData.solutionsBySubgroup,
      subgroups
    );
    let participantToSubgroup =
      Object.keys(participantToSubgroupFromMapping).length > 0
        ? participantToSubgroupFromMapping
        : reconstructedAssignment.participantToSubgroup;

    if (Object.keys(subgroups).length === 0 && Object.keys(reconstructedAssignment.subgroups).length > 0) {
      subgroups = reconstructedAssignment.subgroups;
    }

    if (Object.keys(subgroups).length === 0 && Object.keys(participantToSubgroup).length > 0) {
      subgroups = rebuildSubgroupsFromParticipantMapping(
        participantToSubgroup,
        currentData.subgroups
      );
    }

    if (Object.keys(subgroups).length > 0 && Object.keys(participantToSubgroup).length > 0) {
      subgroups = mergeParticipantMappingIntoSubgroups(subgroups, participantToSubgroup);
    }

    const existingSubgroupId = participantToSubgroup[cleanedParticipantId];
    if (existingSubgroupId && subgroups[existingSubgroupId]) {
      const nextSubgroups = {
        ...subgroups,
      };

      nextSubgroups[existingSubgroupId] = {
        ...nextSubgroups[existingSubgroupId],
        participantIds: {
          ...(nextSubgroups[existingSubgroupId]?.participantIds || {}),
          [cleanedParticipantId]: true,
        },
      };

      return {
        ...currentData,
        subgroups: nextSubgroups,
        participantToSubgroup,
      };
    }

    if (Object.keys(participantToSubgroup).length === 0 || Object.keys(subgroups).length === 0) {
      const withCurrentParticipant = connectedParticipants.some(
        (participant) => participant.id === cleanedParticipantId
      )
        ? connectedParticipants
        : [
            ...connectedParticipants,
            {
              id: cleanedParticipantId,
            },
          ];

      const assignment = buildInitialSubgroupAssignment(withCurrentParticipant);

      return {
        ...currentData,
        subgroups: assignment.subgroups,
        participantToSubgroup: assignment.participantToSubgroup,
        subgroupInitializedAt: currentData.subgroupInitializedAt || nowIso(),
      };
    }

    let targetSubgroup = findSmallestNonFullSubgroup(subgroups);

    if (!targetSubgroup) {
      targetSubgroup = createNextSubgroup(subgroups);
      subgroups = {
        ...subgroups,
        [targetSubgroup.id]: targetSubgroup,
      };
    }

    const nextSubgroups = {
      ...subgroups,
      [targetSubgroup.id]: {
        ...targetSubgroup,
        participantIds: {
          ...(targetSubgroup.participantIds || {}),
          [cleanedParticipantId]: true,
        },
      },
    };

    return {
      ...currentData,
      subgroups: nextSubgroups,
      participantToSubgroup: {
        ...participantToSubgroup,
        [cleanedParticipantId]: targetSubgroup.id,
      },
      subgroupInitializedAt: currentData.subgroupInitializedAt || nowIso(),
    };
  });
};

export const setDescription = async (
  sessionId,
  participantId,
  description,
  options = {}
) => {
  if (!sessionId) return;

  const nextDescription = String(description ?? "");
  const hasExpectedPreviousDescription = Object.prototype.hasOwnProperty.call(
    options,
    "expectedPreviousDescription"
  );
  const expectedPreviousDescription = hasExpectedPreviousDescription
    ? String(options.expectedPreviousDescription ?? "")
    : null;

  await runTransaction(ref(database, `${toDefectuologiePath(sessionId)}/step1`), (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const currentDescription = String(currentData.description ?? "");

    // Prevent non-empty descriptions from being cleared by stale or implicit client writes.
    if (nextDescription === "" && currentDescription !== "") {
      return;
    }

    const shouldRejectStaleClear =
      nextDescription === "" &&
      expectedPreviousDescription !== null &&
      expectedPreviousDescription !== currentDescription &&
      currentDescription !== "";

    if (shouldRejectStaleClear) {
      return;
    }

    return {
      description: nextDescription,
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    };
  });
};

export const createDefect = async (
  sessionId,
  subgroupId,
  payload = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !payload?.authorId) {
    throw new Error("createDefect: parametres manquants");
  }

  const defectsRef = ref(
    database,
    `${toDefectuologiePath(sessionId)}/defectsBySubgroup/${cleanedSubgroupId}`
  );
  const defectRef = push(defectsRef);
  const defectId = defectRef.key;

  if (!defectId) {
    throw new Error("Impossible de generer defectId");
  }

  const now = nowIso();

  await set(defectRef, {
    id: defectId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    createdAt: now,
    updatedAt: now,
  });

  return defectId;
};

export const updateDefect = async (
  sessionId,
  subgroupId,
  defectId,
  patch = {},
  options = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !defectId) return;

  const hasNextText = Object.prototype.hasOwnProperty.call(patch, "text");
  if (!hasNextText) {
    await update(
      ref(
        database,
        `${toDefectuologiePath(sessionId)}/defectsBySubgroup/${cleanedSubgroupId}/${defectId}`
      ),
      normalizeTextPatch(patch)
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
      `${toDefectuologiePath(sessionId)}/defectsBySubgroup/${cleanedSubgroupId}/${defectId}`
    ),
    (current) => {
      if (!current || typeof current !== "object") return current;

      const currentText = String(current.text ?? "");

      // Prevent stale or implicit writes from clearing an already-filled defect text.
      if (nextText === "" && currentText !== "") {
        return;
      }

      const shouldRejectStaleClear =
        nextText === "" &&
        expectedPreviousText !== null &&
        expectedPreviousText !== currentText &&
        currentText !== "";

      if (shouldRejectStaleClear) {
        return;
      }

      return {
        ...current,
        text: nextText,
        updatedAt: nowIso(),
      };
    }
  );
};

export const removeDefect = async (sessionId, subgroupId, defectId) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !defectId) return;

  const basePath = toDefectuologiePath(sessionId);
  const updates = {
    [`${basePath}/defectsBySubgroup/${cleanedSubgroupId}/${defectId}`]: null,
  };

  const votesSnapshot = await get(ref(database, `${basePath}/defectVotesByParticipant`));

  if (votesSnapshot.exists()) {
    const votesByParticipant = normalizeVotesByParticipant(votesSnapshot.val());

    Object.keys(votesByParticipant).forEach((participantId) => {
      if (votesByParticipant[participantId]?.[defectId]) {
        updates[`${basePath}/defectVotesByParticipant/${participantId}/${defectId}`] = null;
      }
    });
  }

  await update(ref(database), updates);
};

export const toggleDefectVote = async (
  sessionId,
  participantId,
  defectId,
  options = {}
) => {
  if (!sessionId || !participantId || !defectId) {
    return { committed: false, votes: {} };
  }

  const maxVotes = Number.isFinite(options?.maxVotes)
    ? Math.max(1, options.maxVotes)
    : MAX_VOTES_PER_STEP;
  const validDefectIds = options?.validDefectIds instanceof Set ? options.validDefectIds : null;

  const votesRef = ref(
    database,
    `${toDefectuologiePath(sessionId)}/defectVotesByParticipant/${participantId}`
  );

  const result = await runTransaction(votesRef, (current) => {
    const nextVotes = current && typeof current === "object" ? { ...current } : {};

    if (nextVotes[defectId]) {
      delete nextVotes[defectId];
      return Object.keys(nextVotes).length > 0 ? nextVotes : null;
    }

    const usedVotes = Object.entries(nextVotes).reduce((count, [itemId, enabled]) => {
      if (!enabled) return count;
      if (validDefectIds && !validDefectIds.has(itemId)) return count;
      return count + 1;
    }, 0);

    if (usedVotes >= maxVotes) {
      return;
    }

    nextVotes[defectId] = true;
    return nextVotes;
  });

  return {
    committed: result.committed,
    votes: result.snapshot.exists() ? result.snapshot.val() : {},
  };
};

export const createSolution = async (
  sessionId,
  subgroupId,
  payload = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !payload?.authorId) {
    throw new Error("createSolution: parametres manquants");
  }

  const solutionsRef = ref(
    database,
    `${toDefectuologiePath(sessionId)}/solutionsBySubgroup/${cleanedSubgroupId}`
  );
  const solutionRef = push(solutionsRef);
  const solutionId = solutionRef.key;

  if (!solutionId) {
    throw new Error("Impossible de generer solutionId");
  }

  const now = nowIso();

  await set(solutionRef, {
    id: solutionId,
    authorId: payload.authorId,
    text: payload.text ?? "",
    createdAt: now,
    updatedAt: now,
  });

  return solutionId;
};

export const updateSolution = async (
  sessionId,
  subgroupId,
  solutionId,
  patch = {},
  options = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !solutionId) return;

  const hasNextText = Object.prototype.hasOwnProperty.call(patch, "text");
  if (!hasNextText) {
    await update(
      ref(
        database,
        `${toDefectuologiePath(sessionId)}/solutionsBySubgroup/${cleanedSubgroupId}/${solutionId}`
      ),
      normalizeTextPatch(patch)
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
      `${toDefectuologiePath(sessionId)}/solutionsBySubgroup/${cleanedSubgroupId}/${solutionId}`
    ),
    (current) => {
      if (!current || typeof current !== "object") return current;

      const currentText = String(current.text ?? "");

      // Prevent stale or implicit writes from clearing an already-filled solution text.
      if (nextText === "" && currentText !== "") {
        return;
      }

      const shouldRejectStaleClear =
        nextText === "" &&
        expectedPreviousText !== null &&
        expectedPreviousText !== currentText &&
        currentText !== "";

      if (shouldRejectStaleClear) {
        return;
      }

      return {
        ...current,
        text: nextText,
        updatedAt: nowIso(),
      };
    }
  );
};

export const removeSolution = async (sessionId, subgroupId, solutionId) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !solutionId) return;

  const basePath = toDefectuologiePath(sessionId);
  const updates = {
    [`${basePath}/solutionsBySubgroup/${cleanedSubgroupId}/${solutionId}`]: null,
  };

  const votesSnapshot = await get(ref(database, `${basePath}/solutionVotesByParticipant`));

  if (votesSnapshot.exists()) {
    const votesByParticipant = normalizeVotesByParticipant(votesSnapshot.val());

    Object.keys(votesByParticipant).forEach((participantId) => {
      if (votesByParticipant[participantId]?.[solutionId]) {
        updates[`${basePath}/solutionVotesByParticipant/${participantId}/${solutionId}`] = null;
      }
    });
  }

  await update(ref(database), updates);
};

export const toggleSolutionVote = async (
  sessionId,
  participantId,
  solutionId,
  options = {}
) => {
  if (!sessionId || !participantId || !solutionId) {
    return { committed: false, votes: {} };
  }

  const maxVotes = Number.isFinite(options?.maxVotes)
    ? Math.max(1, options.maxVotes)
    : MAX_VOTES_PER_STEP;
  const validSolutionIds =
    options?.validSolutionIds instanceof Set ? options.validSolutionIds : null;

  const votesRef = ref(
    database,
    `${toDefectuologiePath(sessionId)}/solutionVotesByParticipant/${participantId}`
  );

  const result = await runTransaction(votesRef, (current) => {
    const nextVotes = current && typeof current === "object" ? { ...current } : {};

    if (nextVotes[solutionId]) {
      delete nextVotes[solutionId];
      return Object.keys(nextVotes).length > 0 ? nextVotes : null;
    }

    const usedVotes = Object.entries(nextVotes).reduce((count, [itemId, enabled]) => {
      if (!enabled) return count;
      if (validSolutionIds && !validSolutionIds.has(itemId)) return count;
      return count + 1;
    }, 0);

    if (usedVotes >= maxVotes) {
      return;
    }

    nextVotes[solutionId] = true;
    return nextVotes;
  });

  return {
    committed: result.committed,
    votes: result.snapshot.exists() ? result.snapshot.val() : {},
  };
};

export const setProposal = async (
  sessionId,
  participantId,
  subgroupId,
  text
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);
  if (!sessionId || !cleanedSubgroupId) return;

  await update(
    ref(database, `${toDefectuologiePath(sessionId)}/step6BySubgroup/${cleanedSubgroupId}`),
    {
      text: text ?? "",
      updatedAt: nowIso(),
      updatedBy: participantId || "",
    }
  );
};
