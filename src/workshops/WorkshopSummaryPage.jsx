import PaperBrainSummary from "./paper-brain/PaperBrainSummary.jsx";

function GenericWorkshopSummary({ sessionTitle }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{sessionTitle}</h1>
          <p className="text-gray-600">
            Le récapitulatif détaillé de cet atelier sera bientôt disponible.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WorkshopSummaryPage({ workshopId, sessionTitle, collaboration }) {
  if (workshopId === "paper-brain") {
    return (
      <PaperBrainSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  return <GenericWorkshopSummary sessionTitle={sessionTitle} />;
}
