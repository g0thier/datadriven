import SixHatsResultsBoard from "./SixHatsResultsBoard.jsx";

export default function SixHatsSummary({ sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const step1Description = String(collaboration?.step1Description || "");
  const blueConclusion = String(collaboration?.blueConclusion || "");
  const itemsByHat = collaboration?.itemsByHat && typeof collaboration.itemsByHat === "object"
    ? collaboration.itemsByHat
    : {};

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier termine</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">{sessionTitle}</h1>

        {!!syncError && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {syncError}
          </p>
        )}

        <SixHatsResultsBoard
          step1Description={step1Description}
          itemsByHat={itemsByHat}
          blueConclusion={blueConclusion}
        />
      </div>
    </div>
  );
}
