export const EMPTY_OBJECT = Object.freeze({});
export const EMPTY_ARRAY = Object.freeze([]);

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
