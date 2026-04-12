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

const normalizeSubgroups = (subgroups = {}) => {
  if (!subgroups || typeof subgroups !== "object") return {};

  const normalized = {};

  Object.entries(subgroups).forEach(([rawSubgroupId, subgroup], index) => {
    const subgroupId = normalizeSubgroupId(subgroup?.id || rawSubgroupId);
    if (!subgroupId) return;

    const participantIds =
      subgroup?.participantIds && typeof subgroup.participantIds === "object"
        ? Object.entries(subgroup.participantIds).reduce((accumulator, [participantId, enabled]) => {
            if (!enabled) return accumulator;
            const cleanedParticipantId = String(participantId || "").trim();
            if (!cleanedParticipantId) return accumulator;
            accumulator[cleanedParticipantId] = true;
            return accumulator;
          }, {})
        : {};

    normalized[subgroupId] = {
      id: subgroupId,
      label: String(subgroup?.label || `Sous-groupe ${index + 1}`).trim(),
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

export const subscribeDefectuologieSession = (
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

export const upsertDefectuologieParticipant = async (
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

export const initializeDefectuologieSubgroups = async (sessionId) => {
  if (!sessionId) return;

  const defectuologieRef = ref(database, toDefectuologiePath(sessionId));

  await runTransaction(defectuologieRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};
    const participantToSubgroup = normalizeParticipantToSubgroup(
      currentData.participantToSubgroup
    );

    if (Object.keys(participantToSubgroup).length > 0) {
      return currentData;
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

export const assignDefectuologieParticipantToSubgroup = async (
  sessionId,
  participantId
) => {
  const cleanedParticipantId = String(participantId || "").trim();
  if (!sessionId || !cleanedParticipantId) return;

  const defectuologieRef = ref(database, toDefectuologiePath(sessionId));

  await runTransaction(defectuologieRef, (current) => {
    const currentData = current && typeof current === "object" ? current : {};

    const connectedParticipants = extractConnectedParticipants(currentData.participants);
    const participantToSubgroup = normalizeParticipantToSubgroup(
      currentData.participantToSubgroup
    );
    let subgroups = normalizeSubgroups(currentData.subgroups);

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

export const setDefectuologieStep1Description = async (
  sessionId,
  participantId,
  description
) => {
  if (!sessionId) return;

  const now = nowIso();

  await update(ref(database, `${toDefectuologiePath(sessionId)}/step1`), {
    description: description ?? "",
    updatedAt: now,
    updatedBy: participantId || "",
  });
};

export const createDefectuologieDefect = async (
  sessionId,
  subgroupId,
  payload = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !payload?.authorId) {
    throw new Error("createDefectuologieDefect: parametres manquants");
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

export const updateDefectuologieDefect = async (
  sessionId,
  subgroupId,
  defectId,
  patch = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !defectId) return;

  await update(
    ref(
      database,
      `${toDefectuologiePath(sessionId)}/defectsBySubgroup/${cleanedSubgroupId}/${defectId}`
    ),
    normalizeTextPatch(patch)
  );
};

export const removeDefectuologieDefect = async (sessionId, subgroupId, defectId) => {
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

export const toggleDefectuologieDefectVote = async (
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

export const createDefectuologieSolution = async (
  sessionId,
  subgroupId,
  payload = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !payload?.authorId) {
    throw new Error("createDefectuologieSolution: parametres manquants");
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

export const updateDefectuologieSolution = async (
  sessionId,
  subgroupId,
  solutionId,
  patch = {}
) => {
  const cleanedSubgroupId = normalizeSubgroupId(subgroupId);

  if (!sessionId || !cleanedSubgroupId || !solutionId) return;

  await update(
    ref(
      database,
      `${toDefectuologiePath(sessionId)}/solutionsBySubgroup/${cleanedSubgroupId}/${solutionId}`
    ),
    normalizeTextPatch(patch)
  );
};

export const removeDefectuologieSolution = async (sessionId, subgroupId, solutionId) => {
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

export const toggleDefectuologieSolutionVote = async (
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

export const setDefectuologieStep6Proposal = async (
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
