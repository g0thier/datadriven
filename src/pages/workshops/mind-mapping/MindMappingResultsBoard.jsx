export default function MindMappingResultsBoard({
  challenge = "",
  syncError = "",
  rankedConceptCards = [],
  isLoading = false,
  isEditableReformulation = false,
  onReformulationChange,
}) {
  const votedConceptCount = Array.isArray(rankedConceptCards) ? rankedConceptCards.length : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Demande formulée</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
      </div>

      {!!syncError && (
        <p className="text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {votedConceptCount === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
          Aucun concept avec gommette n'est disponible pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {rankedConceptCards.map((item, index) => (
            <article key={item.concept.id} className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-base font-semibold text-gray-800">Concept #{index + 1}</h3>
                <span className="text-xs text-gray-500">
                  {item.voteCount} vote{item.voteCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
                  <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-yellow-700 mb-1">Note 1</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.fromNoteText}</p>
                  </section>

                  <section className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Idée 1</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.fromIdeaText}</p>
                  </section>

                  <section className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-orange-700 mb-1">Concept</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.conceptText}</p>
                  </section>

                  <section className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Idée 2</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.toIdeaText}</p>
                  </section>

                  <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-yellow-700 mb-1">Note 2</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.toNoteText}</p>
                  </section>
                </div>

                {isEditableReformulation ? (
                  <textarea
                    className="w-full h-28 p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reformuler l'idée finale..."
                    value={item.reformulationText}
                    onChange={(event) =>
                      onReformulationChange?.(
                        item.concept.id,
                        event.target.value,
                        item.reformulationText
                      )
                    }
                    disabled={isLoading}
                  />
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1">
                      Reformulation finale
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {item.reformulationText.trim() || (
                        <span className="text-gray-400">Aucune reformulation rédigée.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
