import zebra from "../assets/zebra.svg";
import MaterialIcon from "../components/MaterialIcon";

function formatRemainingTime(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function WorkshopWaitingPage({
  sessionTitle,
  startAt,
  remainingMs,
}) {
  const startLabel = startAt.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full bg-amber-300 min-h-screen overflow-hidden relative">
      <img
        src={zebra}
        alt="Zebra"
        className="absolute bottom-0 left-0 w-[60%] h-[60%] object-cover"
      />

      <div className="flex items-center justify-center flex-col min-h-screen relative px-6 text-center">
        <h1 className="text-5xl text-gray-800 font-bold mb-4">
          Atelier en attente
        </h1>

        <p className="text-gray-700 max-w-2xl">
          L&apos;atelier <strong>{sessionTitle}</strong> va commencer le{" "}
          <strong>{startLabel}</strong>.
        </p>

        <div className="mt-8 bg-white p-6 rounded-2xl shadow-md min-w-65">
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
            <MaterialIcon name="timer" size={22} />
            <span className="font-medium">Début dans</span>
          </div>

          <div className="text-5xl text-gray-800 font-bold tracking-tight tabular-nums">
            {formatRemainingTime(remainingMs)}
          </div>
        </div>
      </div>
    </div>
  );
}
