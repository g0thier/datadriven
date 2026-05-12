import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

export default function Step3({ step, sessionTitle, collaboration }) {
  const subgroup = collaboration?.activeSubgroup || null;
  const subgroupLabel = subgroup?.label || "Sous-groupe";
  const defects = Array.isArray(collaboration?.activeDefects) ? collaboration.activeDefects : [];
  const votesByItem = collaboration?.defectVotesByItem || {};
  const currentParticipantId = collaboration?.participant?.id || "";
  const remainingVotes = Number.isFinite(collaboration?.remainingDefectVotes)
    ? collaboration.remainingDefectVotes
    : 0;
  const maxStickers = Number.isFinite(collaboration?.maxStickers) ? collaboration.maxStickers : 1;
  const syncError = collaboration?.syncError || "";

  const topTie = Boolean(collaboration?.defectTopTie);

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici dès qu'il est défini à l'étape 1.";

  const toggleVote = (defectId, hasMine) => {
    if (!hasMine && remainingVotes <= 0) return;
    collaboration?.actions?.toggleDefectVote?.(defectId);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {!subgroup ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Attribution du sous-groupe en cours...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Vote sur les défauts</h3>
              <p className="text-xs text-gray-500">{subgroupLabel}</p>
            </div>

            <div className="flex items-center gap-1" title="Gommettes restantes">
              {Array.from({ length: maxStickers }).map((_, index) => (
                <div
                  key={index}
                  className={`w-5 h-5 rounded-full ${
                    index < remainingVotes ? "bg-green-400" : "bg-green-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {topTie && (
            <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Ex æquo détecté sur la meilleure idée. Le groupe doit choisir une idée finale.
            </p>
          )}

          {defects.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun défaut disponible pour voter.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-3 marker:text-gray-400">
              {defects.map((defect) => {
                const stickerSet = votesByItem[defect.id] || new Set();
                const hasMine = stickerSet.has(currentParticipantId);
                const otherCount = Math.max(0, stickerSet.size - (hasMine ? 1 : 0));
                const isDisabled = !hasMine && remainingVotes <= 0;

                return (
                  <li key={defect.id} className="text-sm text-gray-700">
                    <div
                      className={`rounded-lg border px-3 py-2 ${
                        isDisabled
                          ? "bg-gray-50 border-slate-200"
                          : "bg-white border-slate-300 cursor-pointer hover:border-violet-300"
                      }`}
                      onClick={() => toggleVote(defect.id, hasMine)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-700 text-sm whitespace-pre-wrap flex-1">
                          {defect.text || <span className="text-gray-400">-</span>}
                        </p>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          aria-label="Etat des gommettes"
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              hasMine ? "bg-green-500" : "bg-transparent border border-green-300"
                            }`}
                            title={hasMine ? "Ta gommette" : "Pas de gommette"}
                          />

                          {Array.from({ length: otherCount }).map((_, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-full bg-blue-500"
                              title="Gommette d'un autre participant"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </WorkshopStepLayout>
  );
}
