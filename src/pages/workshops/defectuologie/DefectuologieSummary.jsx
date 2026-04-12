import DefectuologieResultsBoard from "./DefectuologieResultsBoard.jsx";

export default function DefectuologieSummary({ sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const step1Description = String(collaboration?.step1Description || "");
  const resultsBySubgroup = Array.isArray(collaboration?.resultsBySubgroup)
    ? collaboration.resultsBySubgroup
    : [];

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

        <DefectuologieResultsBoard
          resultsBySubgroup={resultsBySubgroup}
          step1Description={step1Description}
        />
      </div>
    </div>
  );
}
