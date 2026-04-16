import { useEffect, useMemo, useRef } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
import { getHatConfigById } from "../sixHats.constants";

export default function HatListStep({ step, sessionTitle, collaboration, hatId }) {
  const hat = getHatConfigById(hatId);
  const items = useMemo(() => {
    if (!hat?.id) return [];
    return Array.isArray(collaboration?.itemsByHat?.[hat.id]) ? collaboration.itemsByHat[hat.id] : [];
  }, [collaboration, hat]);

  const currentParticipantId = collaboration?.participant?.id || "";
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici des qu'il est defini a l'etape 1.";

  const itemInputRefs = useRef({});
  const pendingFocusItemIdRef = useRef("");

  const addHatItemAction = collaboration?.actions?.addHatItem;

  const updateItem = (itemId, text) => {
    if (!hat?.id || isLoading) return;

    const currentText = String(items.find((item) => item.id === itemId)?.text || "");
    if (currentText === text) return;

    collaboration?.actions?.updateHatItemText?.(hat.id, itemId, text, currentText);
  };

  const removeItem = (itemId) => {
    if (!hat?.id || isLoading) return;
    collaboration?.actions?.removeHatItem?.(hat.id, itemId);
  };

  const createItem = async ({ focusNewInput = false } = {}) => {
    if (!hat?.id || isLoading) return;
    if (typeof addHatItemAction !== "function") return;

    const createdId = await addHatItemAction(hat.id, { text: "" });

    if (focusNewInput && createdId) {
      pendingFocusItemIdRef.current = createdId;
    }
  };

  useEffect(() => {
    const pendingFocusItemId = pendingFocusItemIdRef.current;
    if (!pendingFocusItemId) return;

    const inputElement = itemInputRefs.current[pendingFocusItemId];
    if (!inputElement) return;

    inputElement.focus();
    pendingFocusItemIdRef.current = "";
  }, [items]);

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

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {hat?.label || "Chapeau"}
            </h3>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Ajoutez une premiere contribution avec le bouton +.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-3 marker:text-gray-400">
            {items.map((item) => {
              const isMine = item.authorId === currentParticipantId;

              return (
                <li key={item.id} className="text-sm text-gray-700">
                  {isMine ? (
                    <div className="relative bg-violet-100 border border-violet-200 rounded-lg px-2 py-1.5 -ml-1">
                      <input
                        type="text"
                        ref={(element) => {
                          if (element) {
                            itemInputRefs.current[item.id] = element;
                            return;
                          }

                          delete itemInputRefs.current[item.id];
                        }}
                        className="w-full bg-transparent focus:outline-none text-gray-800 text-sm pr-5"
                        placeholder={hat?.inputPlaceholder || "Ajouter une contribution..."}
                        value={item.text || ""}
                        onChange={(event) => updateItem(item.id, event.target.value)}
                      />

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                        aria-label="Supprimer la contribution"
                      >
                        x
                      </button>
                    </div>
                  ) : (
                    <div className="py-1">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {item.text || <span className="text-gray-400">-</span>}
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
              void createItem();
            }}
            className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
            aria-label="Ajouter une contribution"
            title="Ajouter une contribution"
          >
            +
          </button>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}
