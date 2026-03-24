import { useState } from "react";
import MaterialIcon from "../MaterialIcon.jsx";
import useWorkshopVoiceRoom from "../../hooks/useWorkshopVoiceRoom.js";

export default function WorkshopVoiceOverlay({
  roomId,
  workshopActive,
  stepAudioEnabled,
  maxParticipants = 8,
}) {
  const voiceRoom = useWorkshopVoiceRoom({
    roomId,
    workshopActive,
    stepAudioEnabled,
    maxParticipants,
  });

  const {
    isSupported,
    isJoining,
    isJoined,
    errorMessage,
    participantCount,
    remoteParticipantCount,
    remoteSpeakingCount,
    isTalkPressed,
    isOthersMutedLocally,
    localIndicatorState,
    joinRoom,
    leaveRoom,
    startTalking,
    stopTalking,
    toggleOthersMutedLocally,
  } = voiceRoom;
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!workshopActive || !stepAudioEnabled) {
    return null;
  }

  const othersAreSpeaking = remoteSpeakingCount > 0;
  const isLocalTransmissionActive = localIndicatorState === "talking";
  const localButtonBorderClassName = isLocalTransmissionActive
    ? "border-2 border-emerald-500"
    : "border border-gray-200";
  const isRemoteReceptionActive = othersAreSpeaking && !isOthersMutedLocally;
  const remoteButtonBorderClassName = isRemoteReceptionActive
    ? "border-2 border-blue-500"
    : "border border-gray-200";
  const sharedControlButtonShapeClassName =
    "inline-flex h-10 items-center justify-center rounded-xl transition";

  const handlePressToTalkKeyDown = (event) => {
    if (event.repeat) return;
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    startTalking();
  };

  const handlePressToTalkKeyUp = (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    stopTalking();
  };

  if (isJoined && isCollapsed) {
    return (
      <aside className="fixed left-6 bottom-6 z-9999 bg-white rounded-2xl shadow-md border border-gray-100 p-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onPointerDown={startTalking}
            onPointerUp={stopTalking}
            onPointerLeave={stopTalking}
            onPointerCancel={stopTalking}
            onKeyDown={handlePressToTalkKeyDown}
            onKeyUp={handlePressToTalkKeyUp}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition ${
              isTalkPressed ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-500 hover:bg-indigo-600"
            } ${localButtonBorderClassName}`}
            aria-label={isTalkPressed ? "Vous transmettez" : "Maintenir pour parler"}
            title={isTalkPressed ? "Vous transmettez" : "Maintenir pour parler"}
          >
            <MaterialIcon name={isTalkPressed ? "mic" : "mic_none"} size={18} />
          </button>

          <button
            type="button"
            onClick={toggleOthersMutedLocally}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
              isOthersMutedLocally
                ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : `bg-white text-gray-700 hover:bg-gray-50 ${remoteButtonBorderClassName}`
            }`}
            aria-label={isOthersMutedLocally ? "Rétablir le son des autres" : "Couper le son des autres"}
            title={isOthersMutedLocally ? "Rétablir le son des autres" : "Couper le son des autres"}
          >
            <MaterialIcon name={isOthersMutedLocally ? "volume_off" : "volume_up"} size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
              void leaveRoom();
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-red-100 hover:border-red-200 transition"
            aria-label="Quitter"
            title="Quitter"
          >
            <MaterialIcon name="call_end" size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            aria-label="Agrandir"
            title="Agrandir"
          >
            <MaterialIcon name="unfold_more" size={18} />
          </button>
        </div>

        {!!errorMessage && <p className="mt-2 text-xs text-rose-600">{errorMessage}</p>}
      </aside>
    );
  }

  return (
    <aside className="fixed left-6 bottom-6 z-9999 w-[min(22rem,calc(100vw-3rem))] bg-white rounded-2xl shadow-md border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <MaterialIcon name="headset_mic" size={20} className="text-violet-600" />
          <h2 className="font-semibold text-gray-800 truncate">Audio atelier</h2>
        </div>

        {isJoined ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(true);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <MaterialIcon name="unfold_less" size={16} />
              Réduire
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                void leaveRoom();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-red-100 hover:border-red-200 transition"
            >
              <MaterialIcon name="call_end" size={16} />
              Quitter
            </button>
          </div>
        ) : null}
      </div>

      {!isSupported ? (
        <p className="text-sm text-rose-600">
          WebRTC n&apos;est pas supporté sur ce navigateur.
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            {participantCount}/{maxParticipants} connectés • {remoteParticipantCount} autres
            participants
          </p>

          {!isJoined ? (
            <button
              type="button"
              disabled={isJoining}
              onClick={() => {
                setIsCollapsed(false);
                void joinRoom();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-white font-semibold transition hover:bg-violet-600 disabled:opacity-65 disabled:cursor-not-allowed"
            >
              <MaterialIcon name={isJoining ? "hourglass_top" : "phone_in_talk"} size={18} />
              {isJoining ? "Connexion..." : "Rejoindre l'appel"}
            </button>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onPointerDown={startTalking}
                onPointerUp={stopTalking}
                onPointerLeave={stopTalking}
                onPointerCancel={stopTalking}
                onKeyDown={handlePressToTalkKeyDown}
                onKeyUp={handlePressToTalkKeyUp}
                className={`w-full gap-2 px-4 font-semibold text-white ${sharedControlButtonShapeClassName} ${
                  isTalkPressed ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-500 hover:bg-indigo-600"
                } ${localButtonBorderClassName}`}
                aria-pressed={isTalkPressed}
              >
                <MaterialIcon name={isTalkPressed ? "mic" : "mic_none"} size={18} />
                {isTalkPressed ? "Vous transmettez" : "Maintenir pour parler"}
              </button>

              <button
                type="button"
                onClick={toggleOthersMutedLocally}
                className={`w-full gap-2 px-4 text-sm font-semibold ${sharedControlButtonShapeClassName} ${
                  isOthersMutedLocally
                    ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : `bg-white text-gray-700 hover:bg-gray-50 ${remoteButtonBorderClassName}`
                }`}
              >
                <MaterialIcon
                  name={isOthersMutedLocally ? "volume_off" : "volume_up"}
                  size={18}
                />
                {isOthersMutedLocally ? "Rétablir le son des autres" : "Couper le son des autres"}
              </button>
            </div>
          )}
        </>
      )}

      {!!errorMessage && <p className="mt-3 text-xs text-rose-600">{errorMessage}</p>}
    </aside>
  );
}
