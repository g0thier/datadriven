import WorkshopEmptyStateCard from "../../../components/workshops/WorkshopEmptyStateCard.jsx";
import WorkshopInfoCard from "../../../components/workshops/WorkshopInfoCard.jsx";

export default function DefectuologieResultsBoard({
  resultsBySubgroup = [],
  description = "",
}) {
  const challenge =
    String(description || "").trim() ||
    "Le défi n'a pas été renseigné pendant l'atelier.";

  return (
    <div className="space-y-4">
      <WorkshopInfoCard title="Sujet de l'atelier">
        <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
      </WorkshopInfoCard>

      {!Array.isArray(resultsBySubgroup) || resultsBySubgroup.length === 0 ? (
        <WorkshopEmptyStateCard
          message="Aucune proposition de sous-groupe n'est disponible pour le moment."
          className="bg-white rounded-2xl shadow-md border-0"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {resultsBySubgroup.map((result) => {
            const defectText = String(result?.selectedDefect?.text || "").trim();
            const solutionText = String(result?.selectedSolution?.text || "").trim();
            const proposalText = String(result?.proposalText || "").trim();

            return (
              <article key={result.subgroupId} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-800">
                    {result?.subgroupLabel || "Sous-groupe"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {result?.participantCount || 0} personnes
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-amber-700 mb-1">Défaut</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {defectText || <span className="text-gray-400">Aucun défaut retenu.</span>}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1">
                      Solution
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {solutionText || <span className="text-gray-400">Aucune solution retenue.</span>}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">
                      Proposition
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {proposalText || <span className="text-gray-400">Aucune proposition rédigée.</span>}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
