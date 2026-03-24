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

  if (!workshopActive || !stepAudioEnabled) {
    return null;
  }

  const othersAreSpeaking = remoteSpeakingCount > 0;
  const isLocalTransmissionActive = localIndicatorState === "talking";
  const localButtonBorderClassName = isLocalTransmissionActive
    ? "border-emerald-500"
    : "border-gray-200";
  const isRemoteReceptionActive = othersAreSpeaking && !isOthersMutedLocally;
  const remoteButtonBorderClassName = isRemoteReceptionActive
    ? "border-blue-500"
    : "border-gray-200";

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

  return (
    <aside className="fixed left-6 bottom-6 z-9999 w-[min(22rem,calc(100vw-3rem))] bg-white rounded-2xl shadow-md border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <MaterialIcon name="headset_mic" size={20} className="text-violet-600" />
          <h2 className="font-semibold text-gray-800 truncate">Audio atelier</h2>
        </div>

        {isJoined ? (
          <button
            type="button"
            onClick={() => {
              void leaveRoom();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <MaterialIcon name="call_end" size={16} />
            Quitter
          </button>
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
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-semibold text-white transition ${
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
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                  isOthersMutedLocally
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${isOthersMutedLocally ? "border-amber-200" : remoteButtonBorderClassName}`}
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
