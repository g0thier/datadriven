/**
 * @module workshops/world-coffee/steps/Step1
 * @description World Cafe step 1 screen for defining shared descriptions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect, useRef } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_ARRAY = Object.freeze([]);

/**
 * Renders World Cafe step 1 (shared descriptions list).
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.step - Step metadata (label, description, duration, etc.).
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 1 screen.
 */
export default function Step1({ sessionTitle, step, collaboration }) {
  const descriptions = Array.isArray(collaboration?.descriptions)
    ? collaboration.descriptions
    : EMPTY_ARRAY;
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const addDescriptionAction = collaboration?.actions?.addDescription;
  const descriptionInputRefs = useRef({});
  const pendingFocusDescriptionIdRef = useRef("");

  const updateDescription = (descriptionId, text) => {
    if (isLoading) return;

    const currentText = String(
      descriptions.find((description) => description.id === descriptionId)?.text || ""
    );
    if (currentText === text) return;

    collaboration?.actions?.updateDescription?.(descriptionId, text, currentText);
  };

  const removeDescription = (descriptionId) => {
    if (isLoading) return;
    collaboration?.actions?.removeDescription?.(descriptionId);
  };

  const createDescription = async ({ focusNewInput = false } = {}) => {
    if (isLoading) return;
    if (typeof addDescriptionAction !== "function") return;

    const createdId = await addDescriptionAction({ text: "" });

    if (focusNewInput && createdId) {
      pendingFocusDescriptionIdRef.current = createdId;
    }
  };

  useEffect(() => {
    const pendingFocusDescriptionId = pendingFocusDescriptionIdRef.current;
    if (!pendingFocusDescriptionId) return;

    const inputElement = descriptionInputRefs.current[pendingFocusDescriptionId];
    if (!inputElement) return;

    inputElement.focus();
    pendingFocusDescriptionIdRef.current = "";
  }, [descriptions]);

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6">
        {descriptions.length === 0 ? (
          <p className="text-sm text-gray-500">Ajoutez une première description avec le bouton +.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-3 marker:text-gray-400">
            {descriptions.map((description) => {
              return (
                <li key={description.id} className="text-sm text-gray-700">
                  <div className="relative bg-violet-100 border border-violet-200 rounded-lg px-2 py-1.5 -ml-1">
                    <input
                      type="text"
                      ref={(element) => {
                        if (element) {
                          descriptionInputRefs.current[description.id] = element;
                          return;
                        }

                        delete descriptionInputRefs.current[description.id];
                      }}
                      className="w-full bg-transparent focus:outline-none text-gray-800 text-sm pr-5"
                      placeholder="Décrire le sujet..."
                      value={description.text || ""}
                      onChange={(event) => updateDescription(description.id, event.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => removeDescription(description.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                      aria-label="Supprimer la description"
                    >
                      x
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void createDescription({ focusNewInput: true });
            }}
            className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
            aria-label="Ajouter une description"
            title="Ajouter une description"
          >
            +
          </button>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}
