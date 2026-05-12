import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/matrice-croisee/steps/Step2
 * @description Matrice croisee step 2 screen for matrix structure definition.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { Fragment, useEffect } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const initialStructureByParticipantSession = new Set();

const COLUMN_PLACEHOLDERS = ["Enfants", "Adultes", "Seniors"];
const ROW_PLACEHOLDERS = ["mobile", "tablette", "ordinateur"];

const getColumnPlaceholder = (index) => COLUMN_PLACEHOLDERS[index] || `Colonne ${index + 1}`;
const getRowPlaceholder = (index) => ROW_PLACEHOLDERS[index] || `Rang ${index + 1}`;

/**
 * Renders Matrice croisee step 2 (matrix structure setup).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Workshop session payload.
 * @returns {JSX.Element} The rendered step 2 screen.
 */
export default function Step2({ step, sessionTitle, collaboration, session }) {
  const columnItems = Array.isArray(collaboration?.columnItems) ? collaboration.columnItems : [];
  const rowItems = Array.isArray(collaboration?.rowItems) ? collaboration.rowItems : [];
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const participantId = collaboration?.participant?.id || "";
  const sessionId = session?.sessionId || session?.id || "";
  const step1Description = String(collaboration?.step1Description || "").trim() || "Le sujet de l'atelier sera affiché ici dès qu'il sera renseigné.";

  const initializeStructure = collaboration?.actions?.initializeStructure;
  const addColumnItemAction = collaboration?.actions?.addColumnItem;
  const updateColumnItemTextAction = collaboration?.actions?.updateColumnItemText;
  const removeColumnItemAction = collaboration?.actions?.removeColumnItem;
  const addRowItemAction = collaboration?.actions?.addRowItem;
  const updateRowItemTextAction = collaboration?.actions?.updateRowItemText;
  const removeRowItemAction = collaboration?.actions?.removeRowItem;

  useEffect(() => {
    if (isLoading) return;
    if (columnItems.length > 0 && rowItems.length > 0) return;
    if (typeof initializeStructure !== "function") return;
    if (!sessionId || !participantId) return;

    const initializeKey = `${sessionId}:${participantId}`;
    if (initialStructureByParticipantSession.has(initializeKey)) return;

    initialStructureByParticipantSession.add(initializeKey);

    let isCancelled = false;

    const ensureStructure = async () => {
      const isInitialized = await initializeStructure();

      if (!isInitialized && !isCancelled) {
        initialStructureByParticipantSession.delete(initializeKey);
      }
    };

    ensureStructure();

    return () => {
      isCancelled = true;
    };
  }, [
    columnItems.length,
    initializeStructure,
    isLoading,
    participantId,
    rowItems.length,
    sessionId,
  ]);

  const updateColumnItemText = (itemId, value) => {
    if (isLoading) return;

    const currentValue = String(columnItems.find((item) => item.id === itemId)?.text || "");
    if (currentValue === value) return;

    updateColumnItemTextAction?.(itemId, value, currentValue);
  };

  const updateRowItemText = (itemId, value) => {
    if (isLoading) return;

    const currentValue = String(rowItems.find((item) => item.id === itemId)?.text || "");
    if (currentValue === value) return;

    updateRowItemTextAction?.(itemId, value, currentValue);
  };

  const addColumnItem = () => {
    if (isLoading) return;
    addColumnItemAction?.({ text: "" });
  };

  const addRowItem = () => {
    if (isLoading) return;
    addRowItemAction?.({ text: "" });
  };

  const removeColumnItem = (itemId) => {
    if (isLoading || columnItems.length <= 1) return;
    removeColumnItemAction?.(itemId);
  };

  const removeRowItem = (itemId) => {
    if (isLoading || rowItems.length <= 1) return;
    removeRowItemAction?.(itemId);
  };

  const hasMatrixStructure = columnItems.length > 0 && rowItems.length > 0;
  const gridTemplateColumns = `repeat(${Math.max(1, columnItems.length + 1)}, minmax(12rem, 1fr))`;

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{step1Description}</p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <div className="bg-white rounded-2xl shadow-md p-4">
        {hasMatrixStructure ? (
          <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div
              className="inline-grid gap-3 min-w-max"
              style={{ gridTemplateColumns }}
            >
              <div className="aspect-4/3 rounded-lg border border-slate-200 bg-white/70" />

              {columnItems.map((item, index) => {
                const isLast = index === columnItems.length - 1;

                return (
                  <div
                    key={item.id}
                    className="relative aspect-4/3 rounded-lg border border-violet-200 bg-violet-100 shadow-sm"
                  >
                    <textarea
                      className="absolute inset-0 w-full h-full p-3 pr-8 bg-transparent focus:outline-none text-gray-800 text-sm resize-none"
                      placeholder={getColumnPlaceholder(index)}
                      value={item.text || ""}
                      onChange={(event) => updateColumnItemText(item.id, event.target.value)}
                    />

                    {columnItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumnItem(item.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                        aria-label="Supprimer la colonne"
                      >
                        ✕
                      </button>
                    )}

                    {isLast && (
                      <button
                        type="button"
                        onClick={addColumnItem}
                        className="absolute bottom-3 right-3 w-8 h-8 -mb-5 -mr-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                        aria-label="Ajouter une colonne"
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}

              {rowItems.map((rowItem, rowIndex) => {
                const isLastRow = rowIndex === rowItems.length - 1;

                return (
                  <Fragment key={rowItem.id}>
                    <div
                      className="relative aspect-4/3 rounded-lg border border-blue-200 bg-blue-100 shadow-sm"
                    >
                      <textarea
                        className="absolute inset-0 w-full h-full p-3 pr-8 bg-transparent focus:outline-none text-gray-800 text-sm resize-none"
                        placeholder={getRowPlaceholder(rowIndex)}
                        value={rowItem.text || ""}
                        onChange={(event) => updateRowItemText(rowItem.id, event.target.value)}
                      />

                      {rowItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRowItem(rowItem.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                          aria-label="Supprimer le rang"
                        >
                          ✕
                        </button>
                      )}

                      {isLastRow && (
                        <button
                          type="button"
                          onClick={addRowItem}
                          className="absolute bottom-3 right-3 w-8 h-8 -mb-5 -mr-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                          aria-label="Ajouter un rang"
                        >
                          +
                        </button>
                      )}
                    </div>

                    {columnItems.map((columnItem) => (
                      <div
                        key={`${rowItem.id}:${columnItem.id}`}
                        className="aspect-4/3 rounded-lg border border-dashed border-slate-300 bg-white"
                      />
                    ))}
                  </Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-600 text-center">
            Initialisation de la matrice en cours...
          </div>
        )}
      </div>
    </WorkshopStepLayout>
  );
}
