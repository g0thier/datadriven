import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ackWorkshopVoiceSignal,
  auth,
  getWorkshopVoiceParticipantCount,
  registerWorkshopVoiceDisconnectCleanup,
  removeWorkshopVoiceParticipant,
  sendWorkshopVoiceSignal,
  setWorkshopVoiceParticipant,
  subscribeWorkshopVoiceParticipants,
  subscribeWorkshopVoiceSignals,
  touchWorkshopVoiceParticipant,
} from "../firebase";

const ICE_CONFIGURATION = {
  // TODO: Ajouter un serveur TURN pour fiabilité réseau entreprise (la v1 est STUN-only).
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const HEARTBEAT_INTERVAL_MS = 30_000;
const LOCAL_SPEAKING_THRESHOLD = 0.035;
const REMOTE_SPEAKING_THRESHOLD = 0.03;
const SPEAKING_HOLD_MS = 280;

const getAudioContextClass = () => {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
};

const buildInstanceId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
};

const buildParticipantIdentity = (instanceId) => {
  const currentUser = auth.currentUser;
  const uid = String(currentUser?.uid || "").trim();
  const displayName = String(currentUser?.displayName || "").trim();
  const email = String(currentUser?.email || "").trim();
  const shortId = String(instanceId || "").slice(-6) || "guest";

  const id = uid ? `u-${uid}-${shortId}` : `guest-${shortId}`;
  const fallbackLabel = `Participant ${shortId.toUpperCase()}`;

  return {
    id,
    name: displayName || email || fallbackLabel,
    joinedAt: new Date().toISOString(),
  };
};

const closeAudioContext = async (audioContextRef) => {
  const currentContext = audioContextRef.current;
  audioContextRef.current = null;

  if (!currentContext || typeof currentContext.close !== "function") return;

  try {
    await currentContext.close();
  } catch (error) {
    console.error("Impossible de fermer AudioContext:", error);
  }
};

const startVoiceActivityObserver = ({
  stream,
  threshold,
  audioContextRef,
  onSpeakingChange,
}) => {
  if (!stream || typeof onSpeakingChange !== "function") return () => {};

  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return () => {};

  let audioContext = audioContextRef.current;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.85;

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const buffer = new Uint8Array(analyser.fftSize);
  let rafId = 0;
  let disposed = false;
  let lastVoiceAt = 0;
  let isSpeaking = false;

  const tick = () => {
    if (disposed) return;

    analyser.getByteTimeDomainData(buffer);
    let sumSquares = 0;

    for (let index = 0; index < buffer.length; index += 1) {
      const centered = (buffer[index] - 128) / 128;
      sumSquares += centered * centered;
    }

    const rms = Math.sqrt(sumSquares / buffer.length);
    const now = performance.now();

    if (rms >= threshold) {
      lastVoiceAt = now;
    }

    const nextIsSpeaking = now - lastVoiceAt <= SPEAKING_HOLD_MS;

    if (nextIsSpeaking !== isSpeaking) {
      isSpeaking = nextIsSpeaking;
      onSpeakingChange(nextIsSpeaking);
    }

    rafId = window.requestAnimationFrame(tick);
  };

  tick();

  return () => {
    disposed = true;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }

    if (isSpeaking) {
      onSpeakingChange(false);
    }

    source.disconnect();
    analyser.disconnect();
  };
};

export function useWorkshopVoiceRoom({
  roomId,
  workshopActive,
  stepAudioEnabled,
  maxParticipants = 8,
}) {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [isTalkPressed, setIsTalkPressed] = useState(false);
  const [isOthersMutedLocally, setIsOthersMutedLocally] = useState(false);
  const [isLocalVoiceDetected, setIsLocalVoiceDetected] = useState(false);
  const [remoteSpeakingById, setRemoteSpeakingById] = useState({});
  const [localParticipantId, setLocalParticipantId] = useState("");
  const [localParticipantName, setLocalParticipantName] = useState("");

  const instanceIdRef = useRef(buildInstanceId());
  const participantRef = useRef(null);
  const connectedRoomIdRef = useRef("");
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const heartbeatIntervalRef = useRef(null);
  const onDisconnectCancelRef = useRef(null);
  const localVoiceObserverCleanupRef = useRef(null);
  const localAudioContextRef = useRef(null);
  const remoteAudioContextRef = useRef(null);
  const leaveInProgressRef = useRef(false);
  const joinedRef = useRef(false);

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.RTCPeerConnection === "undefined") return false;
    if (typeof navigator === "undefined") return false;
    return Boolean(navigator.mediaDevices?.getUserMedia);
  }, []);

  const isJoined = status === "joined";
  const isJoining = status === "joining";
  const isTransmitting = isJoined && workshopActive && stepAudioEnabled && isTalkPressed;

  const setRemoteParticipantSpeaking = useCallback((participantId, nextIsSpeaking) => {
    const cleanedParticipantId = String(participantId || "").trim();
    if (!cleanedParticipantId) return;

    setRemoteSpeakingById((previous) => {
      const current = Boolean(previous[cleanedParticipantId]);
      const next = Boolean(nextIsSpeaking);
      if (current === next) return previous;

      if (!next) {
        const nextState = { ...previous };
        delete nextState[cleanedParticipantId];
        return nextState;
      }

      return {
        ...previous,
        [cleanedParticipantId]: true,
      };
    });
  }, []);

  const closePeer = useCallback(
    (remoteParticipantId) => {
      const peerData = peersRef.current.get(remoteParticipantId);
      if (!peerData) return;

      if (typeof peerData.remoteSpeakingCleanup === "function") {
        peerData.remoteSpeakingCleanup();
      }

      if (peerData.audioElement) {
        peerData.audioElement.pause();
        peerData.audioElement.srcObject = null;
        peerData.audioElement.remove();
      }

      const peerConnection = peerData.peerConnection;
      if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.ontrack = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.close();
      }

      peersRef.current.delete(remoteParticipantId);
      setRemoteParticipantSpeaking(remoteParticipantId, false);
    },
    [setRemoteParticipantSpeaking]
  );

  const closeAllPeers = useCallback(() => {
    Array.from(peersRef.current.keys()).forEach((remoteParticipantId) => {
      closePeer(remoteParticipantId);
    });
  }, [closePeer]);

  const stopLocalStream = useCallback(async () => {
    if (typeof localVoiceObserverCleanupRef.current === "function") {
      localVoiceObserverCleanupRef.current();
    }
    localVoiceObserverCleanupRef.current = null;

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    localStreamRef.current = null;

    setIsLocalVoiceDetected(false);
    await closeAudioContext(localAudioContextRef);
  }, []);

  const flushPendingIceCandidates = useCallback(async (peerData) => {
    if (!peerData || !peerData.peerConnection) return;

    const pendingCandidates = Array.isArray(peerData.pendingIceCandidates)
      ? [...peerData.pendingIceCandidates]
      : [];

    peerData.pendingIceCandidates = [];

    for (const pendingCandidate of pendingCandidates) {
      try {
        await peerData.peerConnection.addIceCandidate(new RTCIceCandidate(pendingCandidate));
      } catch (error) {
        console.error("Impossible d'ajouter un ICE candidate différé:", error);
      }
    }
  }, []);

  const ensurePeerConnection = useCallback(
    (remoteParticipantId, shouldCreateOffer = false) => {
      const cleanedRemoteParticipantId = String(remoteParticipantId || "").trim();
      if (!cleanedRemoteParticipantId) return null;

      const existingPeerData = peersRef.current.get(cleanedRemoteParticipantId);
      if (existingPeerData) return existingPeerData;

      const activeRoomId = connectedRoomIdRef.current;
      const localParticipantIdRef = participantRef.current?.id || "";
      const localStream = localStreamRef.current;

      if (!activeRoomId || !localParticipantIdRef || !localStream) return null;

      const peerConnection = new RTCPeerConnection(ICE_CONFIGURATION);
      const remoteStream = new MediaStream();
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.playsInline = true;
      audioElement.style.display = "none";
      audioElement.muted = !workshopActive || !stepAudioEnabled || isOthersMutedLocally;
      audioElement.srcObject = remoteStream;
      document.body.appendChild(audioElement);

      const peerData = {
        peerConnection,
        remoteStream,
        audioElement,
        pendingIceCandidates: [],
        remoteSpeakingCleanup: null,
      };

      peersRef.current.set(cleanedRemoteParticipantId, peerData);

      localStream.getAudioTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) return;

        sendWorkshopVoiceSignal(activeRoomId, cleanedRemoteParticipantId, {
          from: localParticipantIdRef,
          type: "ice",
          payload: event.candidate.toJSON(),
        }).catch((error) => {
          console.error("Impossible d'envoyer le ICE candidate:", error);
        });
      };

      peerConnection.ontrack = (event) => {
        const [stream] = event.streams || [];

        if (stream) {
          audioElement.srcObject = stream;

          if (typeof peerData.remoteSpeakingCleanup === "function") {
            peerData.remoteSpeakingCleanup();
          }

          peerData.remoteSpeakingCleanup = startVoiceActivityObserver({
            stream,
            threshold: REMOTE_SPEAKING_THRESHOLD,
            audioContextRef: remoteAudioContextRef,
            onSpeakingChange: (isSpeaking) => {
              setRemoteParticipantSpeaking(cleanedRemoteParticipantId, isSpeaking);
            },
          });
        } else if (event.track) {
          peerData.remoteStream.addTrack(event.track);

          if (!peerData.remoteSpeakingCleanup) {
            peerData.remoteSpeakingCleanup = startVoiceActivityObserver({
              stream: peerData.remoteStream,
              threshold: REMOTE_SPEAKING_THRESHOLD,
              audioContextRef: remoteAudioContextRef,
              onSpeakingChange: (isSpeaking) => {
                setRemoteParticipantSpeaking(cleanedRemoteParticipantId, isSpeaking);
              },
            });
          }
        }

        void audioElement.play().catch(() => {});
      };

      peerConnection.onconnectionstatechange = () => {
        const currentState = peerConnection.connectionState;
        if (currentState === "failed" || currentState === "closed") {
          closePeer(cleanedRemoteParticipantId);
        }
      };

      if (shouldCreateOffer) {
        (async () => {
          try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            await sendWorkshopVoiceSignal(activeRoomId, cleanedRemoteParticipantId, {
              from: localParticipantIdRef,
              type: "offer",
              payload: { type: offer.type, sdp: offer.sdp },
            });
          } catch (error) {
            console.error("Impossible de créer/envoyer une offre WebRTC:", error);
          }
        })();
      }

      return peerData;
    },
    [closePeer, isOthersMutedLocally, setRemoteParticipantSpeaking, stepAudioEnabled, workshopActive]
  );

  const handleIncomingSignal = useCallback(
    async (signal) => {
      const activeRoomId = connectedRoomIdRef.current;
      const localParticipantIdRef = participantRef.current?.id || "";

      if (!activeRoomId || !localParticipantIdRef || !signal?.id) return;

      const signalId = String(signal.id || "").trim();
      const signalType = String(signal.type || "").trim();
      const remoteParticipantId = String(signal.from || "").trim();

      if (!signalId) return;

      if (!remoteParticipantId || remoteParticipantId === localParticipantIdRef) {
        ackWorkshopVoiceSignal(activeRoomId, localParticipantIdRef, signalId).catch(() => {});
        return;
      }

      let peerData = ensurePeerConnection(remoteParticipantId, false);

      if (!peerData) {
        ackWorkshopVoiceSignal(activeRoomId, localParticipantIdRef, signalId).catch(() => {});
        return;
      }

      try {
        if (signalType === "offer") {
          await peerData.peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.payload)
          );
          await flushPendingIceCandidates(peerData);

          const answer = await peerData.peerConnection.createAnswer();
          await peerData.peerConnection.setLocalDescription(answer);

          await sendWorkshopVoiceSignal(activeRoomId, remoteParticipantId, {
            from: localParticipantIdRef,
            type: "answer",
            payload: { type: answer.type, sdp: answer.sdp },
          });
        } else if (signalType === "answer") {
          await peerData.peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.payload)
          );
          await flushPendingIceCandidates(peerData);
        } else if (signalType === "ice") {
          if (!signal.payload) {
            // Message vide: rien à traiter.
          } else if (peerData.peerConnection.remoteDescription) {
            await peerData.peerConnection.addIceCandidate(new RTCIceCandidate(signal.payload));
          } else {
            peerData.pendingIceCandidates.push(signal.payload);
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement d'un signal WebRTC:", error);
      } finally {
        ackWorkshopVoiceSignal(activeRoomId, localParticipantIdRef, signalId).catch((error) => {
          console.error("Impossible d'acquitter le signal WebRTC:", error);
        });
      }
    },
    [ensurePeerConnection, flushPendingIceCandidates]
  );

  const leaveRoom = useCallback(async () => {
    if (leaveInProgressRef.current) return;
    leaveInProgressRef.current = true;

    const activeRoomId = connectedRoomIdRef.current || roomId;
    const participantId = participantRef.current?.id || "";

    joinedRef.current = false;
    participantRef.current = null;
    connectedRoomIdRef.current = "";

    setIsTalkPressed(false);
    setStatus("idle");
    setLocalParticipantId("");
    setLocalParticipantName("");
    setParticipants([]);
    setRemoteSpeakingById({});

    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (typeof onDisconnectCancelRef.current === "function") {
      await onDisconnectCancelRef.current();
    }
    onDisconnectCancelRef.current = null;

    closeAllPeers();
    await stopLocalStream();
    await closeAudioContext(remoteAudioContextRef);

    if (activeRoomId && participantId) {
      removeWorkshopVoiceParticipant(activeRoomId, participantId).catch((error) => {
        console.error("Impossible de supprimer le participant audio:", error);
      });
    }

    leaveInProgressRef.current = false;
  }, [closeAllPeers, roomId, stopLocalStream]);

  const joinRoom = useCallback(async () => {
    if (!isSupported) {
      setErrorMessage("Votre navigateur ne supporte pas WebRTC.");
      return;
    }

    if (!roomId) {
      setErrorMessage("Session audio introuvable.");
      return;
    }

    if (!workshopActive) {
      setErrorMessage("L'audio n'est pas disponible hors atelier.");
      return;
    }

    if (joinedRef.current || status === "joining") {
      return;
    }

    setStatus("joining");
    setErrorMessage("");

    try {
      const currentParticipantCount = await getWorkshopVoiceParticipantCount(roomId);
      if (currentParticipantCount >= maxParticipants) {
        throw new Error(`Salle audio pleine (${maxParticipants} participants maximum).`);
      }

      const localIdentity = buildParticipantIdentity(instanceIdRef.current);
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });

      localStreamRef.current = localStream;
      localVoiceObserverCleanupRef.current = startVoiceActivityObserver({
        stream: localStream,
        threshold: LOCAL_SPEAKING_THRESHOLD,
        audioContextRef: localAudioContextRef,
        onSpeakingChange: (isSpeaking) => {
          setIsLocalVoiceDetected((previous) => (previous === isSpeaking ? previous : isSpeaking));
        },
      });

      participantRef.current = localIdentity;
      connectedRoomIdRef.current = roomId;

      await setWorkshopVoiceParticipant(roomId, localIdentity);
      onDisconnectCancelRef.current = await registerWorkshopVoiceDisconnectCleanup(
        roomId,
        localIdentity.id
      );

      heartbeatIntervalRef.current = window.setInterval(() => {
        touchWorkshopVoiceParticipant(roomId, localIdentity.id).catch((error) => {
          console.error("Impossible de rafraîchir la présence audio:", error);
        });
      }, HEARTBEAT_INTERVAL_MS);

      joinedRef.current = true;
      setLocalParticipantId(localIdentity.id);
      setLocalParticipantName(localIdentity.name);
      setStatus("joined");
    } catch (error) {
      console.error("Impossible de rejoindre la salle audio:", error);

      const message = String(error?.message || "").trim();
      setErrorMessage(message || "Impossible de rejoindre la salle audio.");
      setStatus("error");

      await leaveRoom();
    }
  }, [isSupported, leaveRoom, maxParticipants, roomId, status, workshopActive]);

  const startTalking = useCallback(() => {
    if (!isJoined) return;
    if (!workshopActive || !stepAudioEnabled) return;
    setIsTalkPressed(true);
  }, [isJoined, stepAudioEnabled, workshopActive]);

  const stopTalking = useCallback(() => {
    setIsTalkPressed(false);
  }, []);

  const toggleOthersMutedLocally = useCallback(() => {
    setIsOthersMutedLocally((previous) => !previous);
  }, []);

  useEffect(() => {
    const currentStream = localStreamRef.current;
    if (!currentStream) return;

    currentStream.getAudioTracks().forEach((track) => {
      track.enabled = isTransmitting;
    });
  }, [isTransmitting]);

  useEffect(() => {
    if (workshopActive && stepAudioEnabled) return;
    setIsTalkPressed(false);
  }, [stepAudioEnabled, workshopActive]);

  useEffect(() => {
    if (!isTalkPressed) return () => {};

    const forceStopTalking = () => {
      setIsTalkPressed(false);
    };

    window.addEventListener("pointerup", forceStopTalking);
    window.addEventListener("pointercancel", forceStopTalking);
    window.addEventListener("blur", forceStopTalking);

    return () => {
      window.removeEventListener("pointerup", forceStopTalking);
      window.removeEventListener("pointercancel", forceStopTalking);
      window.removeEventListener("blur", forceStopTalking);
    };
  }, [isTalkPressed]);

  useEffect(() => {
    const shouldMuteRemoteAudio = !workshopActive || !stepAudioEnabled || isOthersMutedLocally;

    peersRef.current.forEach((peerData) => {
      if (!peerData?.audioElement) return;
      peerData.audioElement.muted = shouldMuteRemoteAudio;
    });
  }, [isOthersMutedLocally, stepAudioEnabled, workshopActive]);

  useEffect(() => {
    if (!isJoined) return () => {};

    const activeRoomId = connectedRoomIdRef.current;
    const participantId = participantRef.current?.id || "";
    if (!activeRoomId || !participantId) return () => {};

    const unsubscribeParticipants = subscribeWorkshopVoiceParticipants(
      activeRoomId,
      (nextParticipants) => {
        setParticipants(Array.isArray(nextParticipants) ? nextParticipants : []);
      },
      (error) => {
        console.error("Erreur de synchronisation des participants audio:", error);
        setErrorMessage("La synchronisation des participants audio a échoué.");
      }
    );

    const unsubscribeSignals = subscribeWorkshopVoiceSignals(
      activeRoomId,
      participantId,
      (signal) => {
        void handleIncomingSignal(signal);
      },
      (error) => {
        console.error("Erreur de signalisation audio:", error);
        setErrorMessage("La signalisation audio est interrompue.");
      }
    );

    return () => {
      unsubscribeParticipants();
      unsubscribeSignals();
      setParticipants([]);
    };
  }, [handleIncomingSignal, isJoined]);

  useEffect(() => {
    if (!isJoined) return;

    const localId = localParticipantId;
    if (!localId) return;

    const remoteParticipants = participants.filter(
      (participant) => String(participant.id || "").trim() && participant.id !== localId
    );
    const remoteIds = new Set(remoteParticipants.map((participant) => participant.id));

    remoteParticipants.forEach((participant) => {
      const shouldCreateOffer = localId.localeCompare(participant.id) < 0;
      ensurePeerConnection(participant.id, shouldCreateOffer);
    });

    Array.from(peersRef.current.keys()).forEach((remoteParticipantId) => {
      if (!remoteIds.has(remoteParticipantId)) {
        closePeer(remoteParticipantId);
      }
    });
  }, [closePeer, ensurePeerConnection, isJoined, localParticipantId, participants]);

  useEffect(() => {
    if (!joinedRef.current) return;
    if (workshopActive) return;
    void leaveRoom();
  }, [leaveRoom, workshopActive]);

  useEffect(() => {
    if (!joinedRef.current) return;
    if (!roomId) {
      void leaveRoom();
      return;
    }

    if (connectedRoomIdRef.current !== roomId) {
      void leaveRoom();
    }
  }, [leaveRoom, roomId]);

  useEffect(() => {
    return () => {
      void leaveRoom();
    };
  }, [leaveRoom]);

  const remoteParticipants = useMemo(
    () => participants.filter((participant) => participant.id !== localParticipantId),
    [localParticipantId, participants]
  );

  const remoteSpeakingCount = useMemo(() => {
    return remoteParticipants.reduce((count, participant) => {
      return remoteSpeakingById[participant.id] ? count + 1 : count;
    }, 0);
  }, [remoteParticipants, remoteSpeakingById]);

  const localIndicatorState = useMemo(() => {
    if (!isJoined) return "idle";
    if (isLocalVoiceDetected && isTransmitting) return "talking";
    if (isLocalVoiceDetected && !isTransmitting) return "captured_not_sent";
    return "silent";
  }, [isJoined, isLocalVoiceDetected, isTransmitting]);

  return {
    isSupported,
    status,
    isJoining,
    isJoined,
    errorMessage,
    localParticipantId,
    localParticipantName,
    participants,
    participantCount: participants.length,
    remoteParticipantCount: remoteParticipants.length,
    remoteSpeakingCount,
    isTalkPressed,
    isTransmitting,
    isLocalVoiceDetected,
    localIndicatorState,
    isOthersMutedLocally,
    joinRoom,
    leaveRoom,
    startTalking,
    stopTalking,
    toggleOthersMutedLocally,
  };
}

export default useWorkshopVoiceRoom;
