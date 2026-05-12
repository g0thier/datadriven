/**
 * @module workshops/world-coffee/steps/Step3
 * @description World Cafe step 3 screen for first-round subgroup ideas.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect, useMemo, useRef } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_ARRAY = Object.freeze([]);

/**
 * Renders World Cafe step 3 (first-round ideas by subgroup).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 3 screen.
 */
export default function Step3({ step, sessionTitle, collaboration }) {
  const subgroup = collaboration?.activeSubgroup || null;
  const subgroupLabel = subgroup?.label || "Sous-groupe";
  const ideas = useMemo(() => {
    if (!Array.isArray(collaboration?.activeIdeas)) return EMPTY_ARRAY;
    return collaboration.activeIdeas;
  }, [collaboration?.activeIdeas]);
  const currentParticipantId = String(collaboration?.participant?.id || "").trim();
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const hasUnassignedDescriptions = Boolean(collaboration?.hasUnassignedDescriptions);
  const descriptionCount = Array.isArray(collaboration?.descriptions)
    ? collaboration.descriptions.length
    : 0;
  const subgroupCount = Array.isArray(collaboration?.subgroups)
    ? collaboration.subgroups.length
    : 0;

  const challenge =
    String(collaboration?.activeSubgroupDescription?.text || "").trim() ||
    "Le sujet du sous-groupe apparaîtra ici une fois l'attribution terminée.";
  const facilitatorId = String(subgroup?.facilitatorId || "").trim();
  const facilitatorLabel = facilitatorId
    ? collaboration?.getParticipantLabel?.(facilitatorId) || "Facilitateur"
    : "Facilitateur non défini";

  const addIdeaAction = collaboration?.actions?.addIdea;
  const ideaInputRefs = useRef({});
  const pendingFocusIdeaIdRef = useRef("");

  const updateIdea = (ideaId, text) => {
    if (isLoading) return;

    const currentText = String(ideas.find((idea) => idea.id === ideaId)?.text || "");
    if (currentText === text) return;

    collaboration?.actions?.updateIdeaText?.(ideaId, text, currentText);
  };

  const removeIdea = (ideaId) => {
    if (isLoading) return;
    collaboration?.actions?.removeIdea?.(ideaId);
  };

  const createIdea = async ({ focusNewInput = false } = {}) => {
    if (isLoading) return;
    if (typeof addIdeaAction !== "function") return;

    const createdId = await addIdeaAction({ text: "" });

    if (focusNewInput && createdId) {
      pendingFocusIdeaIdRef.current = createdId;
    }
  };

  useEffect(() => {
    const pendingFocusIdeaId = pendingFocusIdeaIdRef.current;
    if (!pendingFocusIdeaId) return;

    const inputElement = ideaInputRefs.current[pendingFocusIdeaId];
    if (!inputElement) return;

    inputElement.focus();
    pendingFocusIdeaIdRef.current = "";
  }, [ideas]);

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        <p className="text-xs text-gray-500">
          {subgroupLabel} - {facilitatorLabel}
        </p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {descriptionCount > 0 && subgroupCount === 0 && hasUnassignedDescriptions && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Aucun sous-groupe disponible pour le moment.
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
              <h3 className="text-base font-semibold text-gray-800">Idées du premier round</h3>
              <p className="text-xs text-gray-500">{subgroupLabel}</p>
            </div>
          </div>

          {ideas.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune idée disponible pour le moment.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-3 marker:text-gray-400">
              {ideas.map((idea) => {
                const isMine = idea.authorId === currentParticipantId;

                return (
                  <li key={idea.id} className="text-sm text-gray-700">
                    {isMine ? (
                      <div className="relative bg-violet-100 border border-violet-200 rounded-lg px-2 py-1.5 -ml-1">
                        <input
                          type="text"
                          ref={(element) => {
                            if (element) {
                              ideaInputRefs.current[idea.id] = element;
                              return;
                            }

                            delete ideaInputRefs.current[idea.id];
                          }}
                          className="w-full bg-transparent focus:outline-none text-gray-800 text-sm pr-5"
                          placeholder="Décrire une idée..."
                          value={idea.text || ""}
                          onChange={(event) => updateIdea(idea.id, event.target.value)}
                        />

                        <button
                          type="button"
                          onClick={() => removeIdea(idea.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                          aria-label="Supprimer l'idée"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="py-1">
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                          {idea.text || <span className="text-gray-400">-</span>}
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
                void createIdea({ focusNewInput: true });
              }}
              className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
              aria-label="Ajouter une idée"
              title="Ajouter une idée"
            >
              +
            </button>
          </div>
        </div>
      )}
    </WorkshopStepLayout>
  );
}
