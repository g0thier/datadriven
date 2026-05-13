import { useCallback, useMemo } from "react";
import { EMPTY_ARRAY, EMPTY_OBJECT, makeParticipantFallbackLabel, resolveGuestName } from "./collaboration.shared.js";

const DEFAULT_VARIANT = "default";
const WORLD_COFFEE_VARIANT = "world-coffee";
const DEFAULT_MERGE_ORDER = Object.freeze(["guests", "remote", "authored", "current"]);

const normalizeId = (value) => String(value || "").trim();
const normalizeText = (value) => String(value || "").trim();

const mergeTextField = (currentValue, nextValue) => {
  const normalizedNextValue = normalizeText(nextValue);
  return normalizedNextValue || normalizeText(currentValue);
};

const mergeBooleanField = (currentValue, nextValue) => {
  if (nextValue === undefined || nextValue === null) return Boolean(currentValue);
  return Boolean(nextValue);
};

const buildGuestSource = (sessionGuests, variant) => {
  const safeGuests = Array.isArray(sessionGuests) ? sessionGuests : EMPTY_ARRAY;
  return safeGuests
    .map((guest) => {
      if (!guest) return null;

      if (variant === WORLD_COFFEE_VARIANT) {
        const id = normalizeId(guest?.id);
        if (!id) return null;

        return {
          id,
          firstName: normalizeText(guest?.firstName),
          lastName: normalizeText(guest?.lastName),
          label: normalizeText(guest?.label),
          name: normalizeText(resolveGuestName(guest)),
          email: normalizeText(guest?.email),
        };
      }

      const id = normalizeId(guest?.id || guest?.email);
      if (!id) return null;

      return {
        id,
        name: normalizeText(resolveGuestName(guest)),
        email: normalizeText(guest?.email),
      };
    })
    .filter(Boolean);
};

const buildRemoteSource = (remoteParticipants, variant) => {
  const safeRemoteParticipants =
    remoteParticipants && typeof remoteParticipants === "object"
      ? remoteParticipants
      : EMPTY_OBJECT;

  return Object.entries(safeRemoteParticipants)
    .map(([participantId, payload]) => {
      const data = payload && typeof payload === "object" ? payload : EMPTY_OBJECT;

      if (variant === WORLD_COFFEE_VARIANT) {
        const id = normalizeId(participantId || data?.id);
        if (!id) return null;

        return {
          id,
          firstName: normalizeText(data?.firstName),
          lastName: normalizeText(data?.lastName),
          label: normalizeText(data?.label),
          name: normalizeText(data?.name),
          email: normalizeText(data?.email),
        };
      }

      const id = normalizeId(participantId);
      if (!id) return null;

      return {
        id,
        name: normalizeText(data?.name),
        email: normalizeText(data?.email),
        isAuthenticated: data?.isAuthenticated,
      };
    })
    .filter(Boolean);
};

const buildAuthoredSource = (authoredParticipantIds) => {
  const safeIds = Array.isArray(authoredParticipantIds) ? authoredParticipantIds : EMPTY_ARRAY;
  return safeIds
    .map((participantId) => ({ id: normalizeId(participantId) }))
    .filter((participant) => participant.id);
};

const buildCurrentSource = (currentParticipant) => {
  const data =
    currentParticipant && typeof currentParticipant === "object"
      ? currentParticipant
      : EMPTY_OBJECT;
  const id = normalizeId(data?.id);
  if (!id) return EMPTY_ARRAY;

  return [
    {
      id,
      ...data,
    },
  ];
};

const mergeDefaultParticipant = (current, entry) => {
  return {
    id: current.id,
    name: mergeTextField(current.name, entry.name),
    email: mergeTextField(current.email, entry.email),
    isAuthenticated: mergeBooleanField(current.isAuthenticated, entry.isAuthenticated),
  };
};

const mergeWorldCoffeeParticipant = (current, entry) => {
  const label = mergeTextField(current.label, entry.label);
  const name = mergeTextField(current.name, entry.name) || label;

  return {
    id: current.id,
    firstName: mergeTextField(current.firstName, entry.firstName),
    lastName: mergeTextField(current.lastName, entry.lastName),
    name,
    label,
    email: mergeTextField(current.email, entry.email),
  };
};

const makeDefaultParticipant = (id) => ({
  id,
  name: "",
  email: "",
  isAuthenticated: false,
});

const makeWorldCoffeeParticipant = (id) => ({
  id,
  firstName: "",
  lastName: "",
  name: "",
  label: "",
  email: "",
});

const applyFallbackName = (participant, variant) => {
  if (variant === WORLD_COFFEE_VARIANT) {
    const resolvedName = normalizeText(participant?.name) || normalizeText(participant?.label);
    return {
      ...participant,
      name: resolvedName || makeParticipantFallbackLabel(participant?.id),
    };
  }

  const resolvedName = normalizeText(participant?.name);
  return {
    ...participant,
    name: resolvedName || makeParticipantFallbackLabel(participant?.id),
  };
};

export function useWorkshopParticipants({
  sessionGuests,
  remoteParticipants,
  currentParticipant,
  authoredParticipantIds,
  variant = DEFAULT_VARIANT,
  mergeOrder = DEFAULT_MERGE_ORDER,
}) {
  const safeVariant = variant === WORLD_COFFEE_VARIANT ? WORLD_COFFEE_VARIANT : DEFAULT_VARIANT;

  const participants = useMemo(() => {
    const participantMap = new Map();

    const sourceMap = {
      guests: buildGuestSource(sessionGuests, safeVariant),
      remote: buildRemoteSource(remoteParticipants, safeVariant),
      authored: buildAuthoredSource(authoredParticipantIds),
      current: buildCurrentSource(currentParticipant),
    };
    const orderedSources = Array.isArray(mergeOrder) ? mergeOrder : DEFAULT_MERGE_ORDER;

    const mergeEntry = (entry) => {
      const participantId = normalizeId(entry?.id);
      if (!participantId) return;

      const current =
        participantMap.get(participantId) ||
        (safeVariant === WORLD_COFFEE_VARIANT
          ? makeWorldCoffeeParticipant(participantId)
          : makeDefaultParticipant(participantId));

      const nextParticipant =
        safeVariant === WORLD_COFFEE_VARIANT
          ? mergeWorldCoffeeParticipant(current, entry)
          : mergeDefaultParticipant(current, entry);

      participantMap.set(participantId, nextParticipant);
    };

    orderedSources.forEach((sourceKey) => {
      const entries = Array.isArray(sourceMap[sourceKey]) ? sourceMap[sourceKey] : EMPTY_ARRAY;
      entries.forEach(mergeEntry);
    });

    return Array.from(participantMap.values())
      .map((participant) => applyFallbackName(participant, safeVariant))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr"));
  }, [
    authoredParticipantIds,
    currentParticipant,
    mergeOrder,
    remoteParticipants,
    safeVariant,
    sessionGuests,
  ]);

  const participantById = useMemo(() => {
    return participants.reduce((accumulator, participant) => {
      accumulator[participant.id] = participant;
      return accumulator;
    }, {});
  }, [participants]);

  const getParticipantLabel = useCallback(
    (participantId) => {
      const cleanedParticipantId = normalizeId(participantId);
      if (!cleanedParticipantId) return "Participant";

      return (
        normalizeText(participantById[cleanedParticipantId]?.name) ||
        makeParticipantFallbackLabel(cleanedParticipantId)
      );
    },
    [participantById]
  );

  return {
    participants,
    participantById,
    getParticipantLabel,
  };
}

export default useWorkshopParticipants;
