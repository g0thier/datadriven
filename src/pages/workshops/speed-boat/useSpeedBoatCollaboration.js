/**
 * @module workshops/speed-boat/useSpeedBoatCollaboration
 * @description Collaboration hook managing realtime Speed Boat workshop state and actions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, onAuthStateChangedListener } from "../../../firebase";
import {
  createSpeedBoatBrakeNote,
  createSpeedBoatLeverNote,
  removeSpeedBoatBrakeNote,
  removeSpeedBoatLeverNote,
  setSpeedBoatBrakeNotePosition,
  setSpeedBoatLeverNotePosition,
  setSpeedBoatStep1Description,
  setSpeedBoatStep2Objective,
  subscribeSpeedBoatSession,
  toggleSpeedBoatBrakeVote,
  updateSpeedBoatBrakeNote,
  updateSpeedBoatLeverNote,
  upsertSpeedBoatParticipant,
} from "../../../firebase/workshops/speed-boat.service";

const MAX_STICKERS = 3;

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

const buildGridPosition = (index = 0) => {
  const col = index % 5;
  const row = Math.floor(index / 5);

  return {
    x: 40 + col * 290,
    y: 40 + row * 220,
  };
};

const normalizePosition = (position = {}, fallback = buildGridPosition(0)) => {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
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
      authEmail ||
      makeParticipantFallbackLabel(authUid),
    email: authEmail,
    isAuthenticated: true,
  };
};

/**
 * Provides realtime collaboration state and actions for Speed Boat sessions.
 *
 * @param {Object} params - Hook parameters.
 * @param {string} params.sessionId - Active workshop session id.
 * @param {Object} params.session - Session payload containing participants/guests metadata.
 * @param {string} params.workshopId - Workshop id used to enable Speed Boat behavior.
 * @returns {Object} Collaboration state and write actions.
 */
export function useSpeedBoatCollaboration({ sessionId, session, workshopId }) {
  const isEnabled = Boolean(sessionId) && workshopId === "speed-boat";

  const [authUser, setAuthUser] = useState(() => auth.currentUser ?? null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [speedBoatState, setSpeedBoatState] = useState(null);
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

    const unsubscribe = subscribeSpeedBoatSession(
      sessionId,
      (nextState) => {
        setSpeedBoatState(nextState || {});
        setLastSnapshotSessionId(sessionId);
        setSessionError("");
      },
      (error) => {
        console.error("Erreur de synchronisation Speed Boat:", error);
        setLastSnapshotSessionId(sessionId);
        setSessionError("Impossible de synchroniser l'atelier en direct.");
      }
    );

    return unsubscribe;
  }, [isEnabled, sessionId, setSessionError]);

  const activeSpeedBoatState =
    isEnabled && lastSnapshotSessionId === sessionId ? speedBoatState : null;
  const rawStep1Description = String(activeSpeedBoatState?.step1?.description || "");
  const rawStep2Objective = String(activeSpeedBoatState?.step2?.objective || "");
  const rawBrakeNotes =
    activeSpeedBoatState?.notesByType?.brakes &&
    typeof activeSpeedBoatState.notesByType.brakes === "object"
      ? activeSpeedBoatState.notesByType.brakes
      : EMPTY_OBJECT;
  const rawLeverNotes =
    activeSpeedBoatState?.notesByType?.levers &&
    typeof activeSpeedBoatState.notesByType.levers === "object"
      ? activeSpeedBoatState.notesByType.levers
      : EMPTY_OBJECT;
  const rawVotesByParticipant =
    activeSpeedBoatState?.votesByParticipant &&
    typeof activeSpeedBoatState.votesByParticipant === "object"
      ? activeSpeedBoatState.votesByParticipant
      : EMPTY_OBJECT;

  useEffect(() => {
    if (!isEnabled || !sessionId || !participantReady || !participant?.id) return () => {};

    let isCancelled = false;

    const syncParticipant = async () => {
      try {
        await upsertSpeedBoatParticipant(sessionId, participant);
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

  const remoteParticipants =
    activeSpeedBoatState?.participants &&
    typeof activeSpeedBoatState.participants === "object"
      ? activeSpeedBoatState.participants
      : EMPTY_OBJECT;

  const brakeNotes = useMemo(() => {
    return Object.entries(rawBrakeNotes)
      .map(([noteId, data], index) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        position: normalizePosition(data?.position, buildGridPosition(index)),
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .sort(sortByCreatedAt);
  }, [rawBrakeNotes]);

  const leverNotes = useMemo(() => {
    return Object.entries(rawLeverNotes)
      .map(([noteId, data], index) => ({
        id: String(data?.id || noteId),
        authorId: String(data?.authorId || ""),
        text: data?.text ?? "",
        position: normalizePosition(data?.position, buildGridPosition(index)),
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .sort(sortByCreatedAt);
  }, [rawLeverNotes]);

  const votesByParticipant = useMemo(() => {
    const normalizedVotes = {};

    Object.entries(rawVotesByParticipant).forEach(([participantId, votes]) => {
      if (!votes || typeof votes !== "object") return;

      const cleanedVotes = Object.entries(votes).reduce((accumulator, [noteId, enabled]) => {
        if (!enabled) return accumulator;
        accumulator[noteId] = true;
        return accumulator;
      }, {});

      if (Object.keys(cleanedVotes).length > 0) {
        normalizedVotes[participantId] = cleanedVotes;
      }
    });

    return normalizedVotes;
  }, [rawVotesByParticipant]);

  const noteIdsSet = useMemo(() => new Set(brakeNotes.map((note) => note.id)), [brakeNotes]);

  const votesByNote = useMemo(() => {
    const byNote = {};

    Object.entries(votesByParticipant).forEach(([participantId, votes]) => {
      Object.keys(votes).forEach((noteId) => {
        if (!noteIdsSet.has(noteId)) return;

        if (!byNote[noteId]) {
          byNote[noteId] = new Set();
        }

        byNote[noteId].add(participantId);
      });
    });

    return byNote;
  }, [noteIdsSet, votesByParticipant]);

  const brakeNotesById = useMemo(
    () =>
      brakeNotes.reduce((accumulator, note) => {
        accumulator[note.id] = note;
        return accumulator;
      }, {}),
    [brakeNotes]
  );

  const leverNotesById = useMemo(
    () =>
      leverNotes.reduce((accumulator, note) => {
        accumulator[note.id] = note;
        return accumulator;
      }, {}),
    [leverNotes]
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
      addParticipant(participantId, {
        name: data?.name || "",
        email: data?.email || "",
        isAuthenticated: Boolean(data?.isAuthenticated),
      });
    });

    brakeNotes.forEach((note) => {
      addParticipant(note.authorId);
    });

    leverNotes.forEach((note) => {
      addParticipant(note.authorId);
    });

    if (participant?.id) {
      addParticipant(participant.id, participant);
    }

    return Array.from(participantMap.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "fr")
    );
  }, [brakeNotes, leverNotes, participant, remoteParticipants, sessionGuests]);

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
  const step1Description = rawStep1Description;
  const step2Objective = rawStep2Objective;
  const myBrakeNotes = useMemo(
    () => brakeNotes.filter((note) => note.authorId === currentParticipantId),
    [brakeNotes, currentParticipantId]
  );
  const myLeverNotes = useMemo(
    () => leverNotes.filter((note) => note.authorId === currentParticipantId),
    [leverNotes, currentParticipantId]
  );
  const myVotes =
    currentParticipantId && votesByParticipant[currentParticipantId]
      ? votesByParticipant[currentParticipantId]
      : EMPTY_OBJECT;

  const myVoteCount = useMemo(() => {
    return Object.keys(myVotes).reduce((count, noteId) => {
      if (!noteIdsSet.has(noteId)) return count;
      return count + 1;
    }, 0);
  }, [myVotes, noteIdsSet]);

  const remainingVotes = Math.max(0, MAX_STICKERS - myVoteCount);

  const setStep1Description = useCallback(
    async (description, previousDescription = step1Description) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setSpeedBoatStep1Description(sessionId, currentParticipantId, description, {
          expectedPreviousDescription: previousDescription,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour la description:", error);
        setSessionError("La description n'a pas pu être enregistrée.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      step1Description,
    ]
  );

  const setStep2Objective = useCallback(
    async (objective, previousObjective = step2Objective) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return;

      try {
        await setSpeedBoatStep2Objective(sessionId, currentParticipantId, objective, {
          expectedPreviousObjective: previousObjective,
        });
      } catch (error) {
        console.error("Impossible de mettre à jour l'objectif:", error);
        setSessionError("L'objectif n'a pas pu être enregistré.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
      step2Objective,
    ]
  );

  const addBrakeNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createSpeedBoatBrakeNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le frein:", error);
        setSessionError("Le frein n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateBrakeNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = brakeNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await updateSpeedBoatBrakeNote(sessionId, noteId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour le frein:", error);
        setSessionError("Le frein n'a pas pu être mis à jour.");
      }
    },
    [
      brakeNotesById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeBrakeNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = brakeNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await removeSpeedBoatBrakeNote(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer le frein:", error);
        setSessionError("Le frein n'a pas pu être supprimé.");
      }
    },
    [
      brakeNotesById,
      currentParticipantId,
      isEnabled,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const setBrakeNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setSpeedBoatBrakeNotePosition(sessionId, noteId, position);
      } catch (error) {
        console.error("Impossible de déplacer le frein:", error);
        setSessionError("La position du frein n'a pas pu être enregistrée.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const addLeverNote = useCallback(
    async (options = {}) => {
      if (!isEnabled || !sessionId || !participantReady || !currentParticipantId) return null;

      try {
        return await createSpeedBoatLeverNote(sessionId, {
          authorId: currentParticipantId,
          text: options?.text ?? "",
        });
      } catch (error) {
        console.error("Impossible d'ajouter le levier:", error);
        setSessionError("Le levier n'a pas pu être ajouté.");
        return null;
      }
    },
    [currentParticipantId, isEnabled, participantReady, sessionId, setSessionError]
  );

  const updateLeverNoteText = useCallback(
    async (noteId, text) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = leverNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await updateSpeedBoatLeverNote(sessionId, noteId, { text });
      } catch (error) {
        console.error("Impossible de mettre à jour le levier:", error);
        setSessionError("Le levier n'a pas pu être mis à jour.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      leverNotesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const removeLeverNote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return;
      }

      const note = leverNotesById[noteId];
      if (!note || note.authorId !== currentParticipantId) return;

      try {
        await removeSpeedBoatLeverNote(sessionId, noteId);
      } catch (error) {
        console.error("Impossible de supprimer le levier:", error);
        setSessionError("Le levier n'a pas pu être supprimé.");
      }
    },
    [
      currentParticipantId,
      isEnabled,
      leverNotesById,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const setLeverNotePosition = useCallback(
    async (noteId, position) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId) return;

      try {
        await setSpeedBoatLeverNotePosition(sessionId, noteId, position);
      } catch (error) {
        console.error("Impossible de déplacer le levier:", error);
        setSessionError("La position du levier n'a pas pu être enregistrée.");
      }
    },
    [isEnabled, participantReady, sessionId, setSessionError]
  );

  const toggleBrakeVote = useCallback(
    async (noteId) => {
      if (!isEnabled || !sessionId || !participantReady || !noteId || !currentParticipantId) {
        return { committed: false, votes: {} };
      }

      try {
        return await toggleSpeedBoatBrakeVote(sessionId, currentParticipantId, noteId, {
          maxVotes: MAX_STICKERS,
          validNoteIds: noteIdsSet,
        });
      } catch (error) {
        console.error("Impossible de modifier le vote:", error);
        setSessionError("Le vote n'a pas pu être enregistré.");
        return { committed: false, votes: {} };
      }
    },
    [
      currentParticipantId,
      isEnabled,
      noteIdsSet,
      participantReady,
      sessionId,
      setSessionError,
    ]
  );

  const actions = useMemo(
    () => ({
      setStep1Description,
      setStep2Objective,
      addBrakeNote,
      updateBrakeNoteText,
      removeBrakeNote,
      setBrakeNotePosition,
      addLeverNote,
      updateLeverNoteText,
      removeLeverNote,
      setLeverNotePosition,
      toggleBrakeVote,
    }),
    [
      addLeverNote,
      addBrakeNote,
      removeLeverNote,
      removeBrakeNote,
      setBrakeNotePosition,
      setLeverNotePosition,
      setStep1Description,
      setStep2Objective,
      toggleBrakeVote,
      updateLeverNoteText,
      updateBrakeNoteText,
    ]
  );

  const effectiveSyncError =
    isEnabled && syncErrorSessionId === sessionId ? syncError : "";
  const effectiveIsLoading =
    isEnabled &&
    (!participantReady || (lastSnapshotSessionId !== sessionId && !effectiveSyncError));

  return {
    isEnabled,
    participantReady,
    isLoading: effectiveIsLoading,
    syncError: effectiveSyncError,
    participant,
    participants,
    getParticipantLabel,
    step1Description,
    step2Objective,
    brakeNotes,
    myBrakeNotes,
    votesByParticipant,
    votesByNote,
    myVoteCount,
    remainingVotes,
    maxStickers: MAX_STICKERS,
    leverNotes,
    myLeverNotes,
    actions,
  };
}

/**
 * Default export alias for useSpeedBoatCollaboration.
 *
 * @type {typeof useSpeedBoatCollaboration}
 */
export default useSpeedBoatCollaboration;
