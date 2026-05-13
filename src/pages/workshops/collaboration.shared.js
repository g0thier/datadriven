export const EMPTY_OBJECT = Object.freeze({});
export const EMPTY_ARRAY = Object.freeze([]);

export const asObject = (value) => {
  return value && typeof value === "object" ? value : EMPTY_OBJECT;
};

export const toById = (items = EMPTY_ARRAY, key = "id") => {
  if (!Array.isArray(items) || !items.length) return {};

  return items.reduce((accumulator, item) => {
    const itemId = String(item?.[key] || "").trim();
    if (!itemId) return accumulator;

    accumulator[itemId] = item;
    return accumulator;
  }, {});
};

export const normalizeVotesByParticipant = (rawVotes = EMPTY_OBJECT, options = EMPTY_OBJECT) => {
  const normalizedVotes = {};
  const validIdsSet = options?.validIdsSet instanceof Set ? options.validIdsSet : null;
  const safeVotesByParticipant = asObject(rawVotes);

  Object.entries(safeVotesByParticipant).forEach(([participantId, votes]) => {
    if (!votes || typeof votes !== "object") return;

    const cleanedVotes = Object.entries(votes).reduce((accumulator, [itemId, enabled]) => {
      if (!enabled) return accumulator;
      if (validIdsSet && !validIdsSet.has(itemId)) return accumulator;

      accumulator[itemId] = true;
      return accumulator;
    }, {});

    if (Object.keys(cleanedVotes).length > 0) {
      normalizedVotes[participantId] = cleanedVotes;
    }
  });

  return normalizedVotes;
};

export const buildVotesByItem = (votesByParticipant = EMPTY_OBJECT, options = EMPTY_OBJECT) => {
  const groupedVotes = {};
  const validIdsSet = options?.validIdsSet instanceof Set ? options.validIdsSet : null;
  const seedIds = options?.seedIds;
  const safeVotesByParticipant = asObject(votesByParticipant);

  if (seedIds instanceof Set) {
    seedIds.forEach((itemId) => {
      if (validIdsSet && !validIdsSet.has(itemId)) return;
      groupedVotes[itemId] = new Set();
    });
  } else if (Array.isArray(seedIds)) {
    seedIds.forEach((itemId) => {
      const normalizedId = String(itemId || "").trim();
      if (!normalizedId) return;
      if (validIdsSet && !validIdsSet.has(normalizedId)) return;
      groupedVotes[normalizedId] = new Set();
    });
  }

  Object.entries(safeVotesByParticipant).forEach(([participantId, votes]) => {
    if (!votes || typeof votes !== "object") return;

    Object.entries(votes).forEach(([itemId, enabled]) => {
      if (!enabled) return;
      if (validIdsSet && !validIdsSet.has(itemId)) return;

      if (!groupedVotes[itemId]) {
        groupedVotes[itemId] = new Set();
      }

      groupedVotes[itemId].add(participantId);
    });
  });

  return groupedVotes;
};

export const countVotes = (votesMap = EMPTY_OBJECT, validIdsSet = null) => {
  return Object.entries(asObject(votesMap)).reduce((count, [itemId, enabled]) => {
    if (!enabled) return count;
    if (validIdsSet instanceof Set && !validIdsSet.has(itemId)) return count;
    return count + 1;
  }, 0);
};

export const sortByCreatedAt = (a, b) => {
  const createdA = a?.createdAt || "";
  const createdB = b?.createdAt || "";

  if (createdA !== createdB) {
    return String(createdA).localeCompare(String(createdB));
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

export const resolveGuestName = (guest = {}) => {
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

export const makeParticipantFallbackLabel = (participantId) => {
  const id = String(participantId || "");
  const suffix = id.slice(-4).toUpperCase();
  return suffix ? `Participant ${suffix}` : "Participant";
};

export const resolveParticipantIdentity = ({ sessionGuests, authUser }) => {
  const authUid = String(authUser?.uid || "").trim();
  if (!authUid) return null;

  const authEmail = String(authUser?.email || "").trim();
  const authDisplayName = String(authUser?.displayName || "").trim();
  const safeGuests = Array.isArray(sessionGuests) ? sessionGuests : EMPTY_ARRAY;

  const matchingGuest = safeGuests.find((guest) => {
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
      authEmail ||
      makeParticipantFallbackLabel(authUid),
    email: authEmail,
    isAuthenticated: true,
  };
};

export const parseGroupIndex = (groupId) => {
  const match = String(groupId || "").match(/group-(\d+)/);
  return match ? Number(match[1]) : 0;
};

export const normalizeParticipantToSubgroup = (value = {}) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [participantId, subgroupId]) => {
    const cleanedParticipantId = String(participantId || "").trim();
    const cleanedSubgroupId = String(subgroupId || "").trim();
    if (!cleanedParticipantId || !cleanedSubgroupId) return accumulator;

    accumulator[cleanedParticipantId] = cleanedSubgroupId;
    return accumulator;
  }, {});
};

export const buildGridPosition = (index = 0, config = {}) => {
  const colCount = Number.isFinite(config?.columns) && config.columns > 0 ? config.columns : 1;
  const startX = Number.isFinite(config?.startX) ? config.startX : 0;
  const startY = Number.isFinite(config?.startY) ? config.startY : 0;
  const gapX = Number.isFinite(config?.gapX) ? config.gapX : 0;
  const gapY = Number.isFinite(config?.gapY) ? config.gapY : 0;

  const col = index % colCount;
  const row = Math.floor(index / colCount);

  return {
    x: startX + col * gapX,
    y: startY + row * gapY,
  };
};

export const normalizePosition = (position = {}, fallback = buildGridPosition(0)) => {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
};
