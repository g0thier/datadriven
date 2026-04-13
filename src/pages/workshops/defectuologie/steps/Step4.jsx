import { useEffect, useMemo, useRef } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

export default function Step4({ step, sessionTitle, collaboration }) {
  const subgroup = collaboration?.activeSubgroup || null;
  const subgroupLabel = subgroup?.label || "Sous-groupe";
  const solutions = useMemo(() => {
    if (!Array.isArray(collaboration?.activeSolutions)) return [];
    return collaboration.activeSolutions;
  }, [collaboration?.activeSolutions]);
  const selectedDefect = collaboration?.selectedDefect || null;
  const currentParticipantId = collaboration?.participant?.id || "";
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici des qu'il est defini a l'etape 1.";

  const addSolutionAction = collaboration?.actions?.addSolution;
  const solutionInputRefs = useRef({});
  const pendingFocusSolutionIdRef = useRef("");

  const updateSolution = (solutionId, text) => {
    if (isLoading) return;

    const currentText = String(solutions.find((solution) => solution.id === solutionId)?.text || "");
    if (currentText === text) return;

    collaboration?.actions?.updateSolutionText?.(solutionId, text, currentText);
  };

  const removeSolution = (solutionId) => {
    if (isLoading) return;
    collaboration?.actions?.removeSolution?.(solutionId);
  };

  const createSolution = async ({ focusNewInput = false } = {}) => {
    if (isLoading) return;
    if (typeof addSolutionAction !== "function") return;

    const createdId = await addSolutionAction({ text: "" });

    if (focusNewInput && createdId) {
      pendingFocusSolutionIdRef.current = createdId;
    }
  };

  useEffect(() => {
    const pendingFocusSolutionId = pendingFocusSolutionIdRef.current;
    if (!pendingFocusSolutionId) return;

    const inputElement = solutionInputRefs.current[pendingFocusSolutionId];
    if (!inputElement) return;

    inputElement.focus();
    pendingFocusSolutionIdRef.current = "";
  }, [solutions]);

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
        <>
          <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
            <p className="text-xs text-gray-500 mb-2">Defaut retenu ({subgroupLabel})</p>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {selectedDefect?.text || <span className="text-gray-400">Aucun defaut retenu.</span>}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Solutions proposees</h3>
                <p className="text-xs text-gray-500">{subgroupLabel}</p>
              </div>
            </div>

            {solutions.length === 0 ? (
              <p className="text-sm text-gray-500">Ajoutez une premiere solution avec le bouton +.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-3 marker:text-gray-400">
                {solutions.map((solution) => {
                  const isMine = solution.authorId === currentParticipantId;

                  return (
                    <li key={solution.id} className="text-sm text-gray-700">
                      {isMine ? (
                        <div className="relative bg-violet-100 border border-violet-200 rounded-lg px-2 py-1.5 -ml-1">
                          <input
                            type="text"
                            ref={(element) => {
                              if (element) {
                                solutionInputRefs.current[solution.id] = element;
                                return;
                              }

                              delete solutionInputRefs.current[solution.id];
                            }}
                            className="w-full bg-transparent focus:outline-none text-gray-800 text-sm pr-5"
                            placeholder="Proposer une solution..."
                            value={solution.text || ""}
                            onChange={(event) => updateSolution(solution.id, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

                              event.preventDefault();
                              void createSolution({ focusNewInput: true });
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => removeSolution(solution.id)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                            aria-label="Supprimer la solution"
                          >
                            x
                          </button>
                        </div>
                      ) : (
                        <div className="py-1">
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {solution.text || <span className="text-gray-400">-</span>}
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void createSolution();
                }}
                className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                aria-label="Ajouter une solution"
                title="Ajouter une solution"
              >
                +
              </button>
            </div>
          </div>
        </>
      )}
    </WorkshopStepLayout>
  );
}
