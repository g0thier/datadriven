import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

export default function Step6({ step, sessionTitle, collaboration }) {
  const subgroup = collaboration?.activeSubgroup || null;
  const subgroupLabel = subgroup?.label || "Sous-groupe";
  const selectedDefect = collaboration?.selectedDefect || null;
  const selectedSolution = collaboration?.selectedSolution || null;
  const proposalText = String(collaboration?.proposal || "");
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.description || "").trim() ||
    "Le sujet sera visible ici dès qu'il est défini à l'étape 1.";

  const handleChange = (event) => {
    const nextProposal = event.target.value;
    if (isLoading || nextProposal === proposalText) return;

    collaboration?.actions?.setProposal?.(nextProposal);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      {!subgroup ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Attribution du sous-groupe en cours...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-xs text-gray-500 mb-2">Défaut retenu ({subgroupLabel})</p>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {selectedDefect?.text || <span className="text-gray-400">Aucun défaut retenu.</span>}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-xs text-gray-500 mb-2">Solution retenue ({subgroupLabel})</p>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {selectedSolution?.text || <span className="text-gray-400">Aucune solution retenue.</span>}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-xs text-gray-500 mb-2">Proposition du groupe</p>
            <textarea
              className="w-full h-40 p-4 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Formaliser la proposition finale du groupe..."
              value={proposalText}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
      )}
    </WorkshopStepLayout>
  );
}
