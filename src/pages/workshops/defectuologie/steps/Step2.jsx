import { useEffect, useMemo, useRef } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

export default function Step2({ step, sessionTitle, collaboration }) {
  const subgroup = collaboration?.activeSubgroup || null;
  const subgroupLabel = subgroup?.label || "Sous-groupe";
  const defects = useMemo(() => {
    if (!Array.isArray(collaboration?.activeDefects)) return [];
    return collaboration.activeDefects;
  }, [collaboration?.activeDefects]);
  const currentParticipantId = collaboration?.participant?.id || "";
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici dès qu'il est défini à l'étape 1.";

  const addDefectAction = collaboration?.actions?.addDefect;
  const defectInputRefs = useRef({});
  const pendingFocusDefectIdRef = useRef("");

  const updateDefect = (defectId, text) => {
    if (isLoading) return;

    const currentText = String(defects.find((defect) => defect.id === defectId)?.text || "");
    if (currentText === text) return;

    collaboration?.actions?.updateDefectText?.(defectId, text, currentText);
  };

  const removeDefect = (defectId) => {
    if (isLoading) return;
    collaboration?.actions?.removeDefect?.(defectId);
  };

  const createDefect = async ({ focusNewInput = false } = {}) => {
    if (isLoading) return;
    if (typeof addDefectAction !== "function") return;

    const createdId = await addDefectAction({ text: "" });

    if (focusNewInput && createdId) {
      pendingFocusDefectIdRef.current = createdId;
    }
  };

  useEffect(() => {
    const pendingFocusDefectId = pendingFocusDefectIdRef.current;
    if (!pendingFocusDefectId) return;

    const inputElement = defectInputRefs.current[pendingFocusDefectId];
    if (!inputElement) return;

    inputElement.focus();
    pendingFocusDefectIdRef.current = "";
  }, [defects]);

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
              <h3 className="text-base font-semibold text-gray-800">Défauts identifiés</h3>
              <p className="text-xs text-gray-500">{subgroupLabel}</p>
            </div>
          </div>

          {defects.length === 0 ? (
            <p className="text-sm text-gray-500">Ajoutez un premier défaut avec le bouton +.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-3 marker:text-gray-400">
              {defects.map((defect) => {
                const isMine = defect.authorId === currentParticipantId;

                return (
                  <li key={defect.id} className="text-sm text-gray-700">
                    {isMine ? (
                      <div className="relative bg-violet-100 border border-violet-200 rounded-lg px-2 py-1.5 -ml-1">
                        <input
                          type="text"
                          ref={(element) => {
                            if (element) {
                              defectInputRefs.current[defect.id] = element;
                              return;
                            }

                            delete defectInputRefs.current[defect.id];
                          }}
                          className="w-full bg-transparent focus:outline-none text-gray-800 text-sm pr-5"
                          placeholder="Décrire un défaut..."
                          value={defect.text || ""}
                          onChange={(event) => updateDefect(defect.id, event.target.value)}
                        />

                        <button
                          type="button"
                          onClick={() => removeDefect(defect.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                          aria-label="Supprimer le défaut"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="py-1">
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                          {defect.text || <span className="text-gray-400">-</span>}
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
                void createDefect();
              }}
              className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
              aria-label="Ajouter un défaut"
              title="Ajouter un défaut"
            >
              +
            </button>
          </div>
        </div>
      )}
    </WorkshopStepLayout>
  );
}
