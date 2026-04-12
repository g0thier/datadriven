const SUBGROUP_MIN_SIZE = 4;
const SUBGROUP_MAX_SIZE = 8;

const EMPTY_ARRAY = Object.freeze([]);

const toComparableName = (value) => String(value || "").trim().toLocaleLowerCase("fr");

export const sortByCreatedAt = (a, b) => {
  const createdA = a?.createdAt || "";
  const createdB = b?.createdAt || "";

  if (createdA !== createdB) {
    return String(createdA).localeCompare(String(createdB));
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

export const sortParticipantsForGrouping = (participants = []) => {
  return [...participants].sort((a, b) => {
    const nameA = toComparableName(a?.name);
    const nameB = toComparableName(b?.name);

    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, "fr");
    }

    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
};

export const computeBalancedSubgroupSizes = (
  participantCount,
  options = {}
) => {
  const total = Number.isFinite(participantCount)
    ? Math.max(0, Math.floor(participantCount))
    : 0;

  const minSize = Number.isFinite(options?.minSize)
    ? Math.max(1, Math.floor(options.minSize))
    : SUBGROUP_MIN_SIZE;
  const maxSize = Number.isFinite(options?.maxSize)
    ? Math.max(minSize, Math.floor(options.maxSize))
    : SUBGROUP_MAX_SIZE;

  if (total <= 0) return [];
  if (total < minSize) return [total];

  const groupCount = Math.max(1, Math.ceil(total / maxSize));
  const baseSize = Math.floor(total / groupCount);
  const remainder = total % groupCount;

  return Array.from({ length: groupCount }, (_, index) => {
    return baseSize + (index < remainder ? 1 : 0);
  }).filter((size) => size > 0);
};

export const buildInitialSubgroupAssignment = (participants = []) => {
  const orderedParticipants = sortParticipantsForGrouping(participants);
  const sizes = computeBalancedSubgroupSizes(orderedParticipants.length);

  const subgroups = {};
  const participantToSubgroup = {};

  let cursor = 0;

  sizes.forEach((size, subgroupIndex) => {
    const subgroupId = `group-${subgroupIndex + 1}`;
    const participantIds = {};

    for (let index = 0; index < size; index += 1) {
      const participant = orderedParticipants[cursor + index];
      const participantId = String(participant?.id || "").trim();
      if (!participantId) continue;

      participantIds[participantId] = true;
      participantToSubgroup[participantId] = subgroupId;
    }

    cursor += size;

    subgroups[subgroupId] = {
      id: subgroupId,
      label: `Sous-groupe ${subgroupIndex + 1}`,
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

const toEnabledMap = (value) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [id, enabled]) => {
    if (!enabled) return accumulator;
    accumulator[id] = true;
    return accumulator;
  }, {});
};

export const buildVotesByItem = (votesByParticipant = {}, validIds = new Set()) => {
  const byItem = {};

  Object.entries(votesByParticipant || {}).forEach(([participantId, votes]) => {
    const enabledVotes = toEnabledMap(votes);

    Object.keys(enabledVotes).forEach((itemId) => {
      if (validIds instanceof Set && validIds.size > 0 && !validIds.has(itemId)) return;

      if (!byItem[itemId]) {
        byItem[itemId] = new Set();
      }

      byItem[itemId].add(participantId);
    });
  });

  return byItem;
};

export const rankItemsWithVotes = (items = [], votesByItem = {}) => {
  return [...(Array.isArray(items) ? items : EMPTY_ARRAY)]
    .map((item) => {
      const voteSet = votesByItem[item.id];
      const voteCount = voteSet instanceof Set ? voteSet.size : 0;

      return {
        ...item,
        voteCount,
      };
    })
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }

      return sortByCreatedAt(a, b);
    });
};

export const hasTopVoteTie = (rankedItems = []) => {
  if (!Array.isArray(rankedItems) || rankedItems.length < 2) return false;

  const topCount = Number(rankedItems[0]?.voteCount || 0);
  if (topCount <= 0) return false;

  return Number(rankedItems[1]?.voteCount || 0) === topCount;
};

export const pickSelectedItem = (rankedItems = []) => {
  if (!Array.isArray(rankedItems) || rankedItems.length === 0) return null;
  return rankedItems[0] || null;
};

export const SUBGROUP_LIMITS = {
  min: SUBGROUP_MIN_SIZE,
  max: SUBGROUP_MAX_SIZE,
};
