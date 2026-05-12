import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/matrice-croisee/steps/Step3
 * @description Matrice croisee step 3 screen for collaborative idea notes by matrix cell.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);
const initialStructureByParticipantSession = new Set();

const COLUMN_PLACEHOLDERS = ["Enfants", "Adultes", "Seniors"];
const ROW_PLACEHOLDERS = ["mobile", "tablette", "ordinateur"];

const GRID_UNIT_WIDTH_PX = 160;
const GRID_UNIT_HEIGHT_PX = 120;
const GRID_GAP_X_PX = 8;
const GRID_GAP_Y_PX = 6;
const CELL_PADDING_X_PX = 12;
const CELL_PADDING_Y_PX = 9;

const getColumnPlaceholder = (index) => COLUMN_PLACEHOLDERS[index] || `Colonne ${index + 1}`;
const getRowPlaceholder = (index) => ROW_PLACEHOLDERS[index] || `Rang ${index + 1}`;
const defaultBuildCellKey = (rowId, columnId) => `${rowId}__${columnId}`;

const getCellPixelWidth = (widthUnits = 1) => {
  const units = Math.max(1, Number(widthUnits) || 1);
  return (
    units * GRID_UNIT_WIDTH_PX +
    Math.max(0, units - 1) * GRID_GAP_X_PX +
    CELL_PADDING_X_PX * 2
  );
};

const getCellPixelHeight = (heightUnits = 1) => {
  const units = Math.max(1, Number(heightUnits) || 1);
  return (
    units * GRID_UNIT_HEIGHT_PX +
    Math.max(0, units - 1) * GRID_GAP_Y_PX +
    CELL_PADDING_Y_PX * 2
  );
};

/**
 * Renders Matrice croisee step 3 (cross-combination exploration).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Workshop session payload.
 * @returns {JSX.Element} The rendered step 3 screen.
 */
export default function Step3({ step, sessionTitle, collaboration, session }) {
  const columnItems = Array.isArray(collaboration?.columnItems)
    ? collaboration.columnItems
    : EMPTY_ARRAY;
  const rowItems = Array.isArray(collaboration?.rowItems) ? collaboration.rowItems : EMPTY_ARRAY;
  const cellNotesByKey =
    collaboration?.cellNotesByKey && typeof collaboration.cellNotesByKey === "object"
      ? collaboration.cellNotesByKey
      : EMPTY_OBJECT;
  const buildCellKey = useMemo(() => {
    return typeof collaboration?.buildCellKey === "function"
      ? collaboration.buildCellKey
      : defaultBuildCellKey;
  }, [collaboration?.buildCellKey]);

  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const participantId = collaboration?.participant?.id || "";
  const sessionId = session?.sessionId || session?.id || "";
  const step1Description = String(collaboration?.step1Description || "").trim() || "Le sujet de l'atelier sera affiché ici dès qu'il sera renseigné.";

  const initializeStructure = collaboration?.actions?.initializeStructure;
  const addCellNoteAction = collaboration?.actions?.addCellNote;
  const updateCellNoteTextAction = collaboration?.actions?.updateCellNoteText;
  const removeCellNoteAction = collaboration?.actions?.removeCellNote;

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

  const getCellNotes = useCallback((rowId, columnId) => {
    const cellKey = buildCellKey(rowId, columnId);
    const notes = cellNotesByKey[cellKey];
    return Array.isArray(notes) ? notes : EMPTY_ARRAY;
  }, [buildCellKey, cellNotesByKey]);

  const seedColumnWidthById = useMemo(() => {
    return columnItems.reduce((accumulator, columnItem) => {
      const maxWidthForColumn = rowItems.reduce((maxWidth, rowItem) => {
        const count = getCellNotes(rowItem.id, columnItem.id).length;
        const widthUnits = Math.ceil(Math.sqrt(Math.max(0, count)));
        return Math.max(maxWidth, widthUnits || 1);
      }, 1);

      accumulator[columnItem.id] = Math.max(1, maxWidthForColumn);
      return accumulator;
    }, {});
  }, [columnItems, getCellNotes, rowItems]);

  const rowHeightById = useMemo(() => {
    return rowItems.reduce((accumulator, rowItem) => {
      const maxHeightForRow = columnItems.reduce((maxHeight, columnItem) => {
        const count = getCellNotes(rowItem.id, columnItem.id).length;
        const columnWidth = Math.max(1, seedColumnWidthById[columnItem.id] || 1);
        const heightUnits = Math.ceil(Math.max(0, count) / columnWidth);
        return Math.max(maxHeight, heightUnits || 1);
      }, 1);

      accumulator[rowItem.id] = Math.max(1, maxHeightForRow);
      return accumulator;
    }, {});
  }, [columnItems, getCellNotes, rowItems, seedColumnWidthById]);

  const columnWidthById = useMemo(() => {
    return columnItems.reduce((accumulator, columnItem) => {
      const maxWidthForColumn = rowItems.reduce((maxWidth, rowItem) => {
        const count = getCellNotes(rowItem.id, columnItem.id).length;
        const rowHeight = Math.max(1, rowHeightById[rowItem.id] || 1);
        const widthUnits = Math.ceil(Math.max(0, count) / rowHeight);
        return Math.max(maxWidth, widthUnits || 1);
      }, 1);

      accumulator[columnItem.id] = Math.max(1, maxWidthForColumn);
      return accumulator;
    }, {});
  }, [columnItems, getCellNotes, rowHeightById, rowItems]);

  const rowHeaderWidth = getCellPixelWidth(1);
  const baseCellHeight = getCellPixelHeight(1);
  const hasMatrixStructure = columnItems.length > 0 && rowItems.length > 0;

  const addCellNote = (rowId, columnId) => {
    if (isLoading) return;
    addCellNoteAction?.(rowId, columnId, { text: "" });
  };

  const updateCellNoteText = (rowId, columnId, noteId, value, notes) => {
    if (isLoading) return;

    const currentValue = String(
      (Array.isArray(notes) ? notes : EMPTY_ARRAY).find((note) => note.id === noteId)?.text || ""
    );
    if (currentValue === value) return;

    updateCellNoteTextAction?.(rowId, columnId, noteId, value, currentValue);
  };

  const removeCellNote = (rowId, columnId, noteId) => {
    if (isLoading) return;
    removeCellNoteAction?.(rowId, columnId, noteId);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{step1Description}</p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <div className="bg-white rounded-2xl shadow-md p-4">
        {hasMatrixStructure ? (
          <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="inline-flex flex-col gap-3 min-w-max">
              <div className="flex gap-3 items-start">
                <div
                  className="rounded-lg border border-slate-200 bg-white/70"
                  style={{
                    width: rowHeaderWidth,
                    minHeight: baseCellHeight,
                  }}
                />

                {columnItems.map((columnItem, columnIndex) => {
                  const widthUnits = Math.max(1, columnWidthById[columnItem.id] || 1);
                  const columnCellWidth = Math.max(
                    rowHeaderWidth,
                    getCellPixelWidth(widthUnits)
                  );

                  return (
                    <div
                      key={columnItem.id}
                      className="rounded-lg border border-violet-200 bg-violet-100 shadow-sm p-3"
                      style={{
                        width: columnCellWidth,
                        minHeight: baseCellHeight,
                      }}
                    >
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">
                        {String(columnItem.text || "").trim() || getColumnPlaceholder(columnIndex)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {rowItems.map((rowItem, rowIndex) => {
                const rowHeightUnits = Math.max(1, rowHeightById[rowItem.id] || 1);
                const cellHeight = getCellPixelHeight(rowHeightUnits);

                return (
                  <div key={rowItem.id} className="flex gap-3 items-start">
                    <div
                      className="rounded-lg border border-blue-200 bg-blue-100 shadow-sm p-3"
                      style={{
                        width: rowHeaderWidth,
                        minHeight: Math.max(baseCellHeight, cellHeight),
                      }}
                    >
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">
                        {String(rowItem.text || "").trim() || getRowPlaceholder(rowIndex)}
                      </p>
                    </div>

                    {columnItems.map((columnItem) => {
                      const widthUnits = Math.max(1, columnWidthById[columnItem.id] || 1);
                      const cellWidth = getCellPixelWidth(widthUnits);
                      const cellNotes = getCellNotes(rowItem.id, columnItem.id);

                      return (
                        <div
                          key={`${rowItem.id}:${columnItem.id}`}
                          className="relative rounded-lg border border-dashed border-slate-300 bg-white"
                          style={{
                            width: cellWidth,
                            height: cellHeight,
                          }}
                        >
                          {cellNotes.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => addCellNote(rowItem.id, columnItem.id)}
                              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                              aria-label="Ajouter un post-it"
                            >
                              +
                            </button>
                          ) : (
                            <>
                              <div
                                className="absolute inset-0 overflow-hidden"
                                style={{
                                  padding: `${CELL_PADDING_Y_PX}px ${CELL_PADDING_X_PX}px`,
                                }}
                              >
                                <div
                                  className="grid"
                                  style={{
                                    gridTemplateColumns: `repeat(${widthUnits}, minmax(0, 1fr))`,
                                    gridTemplateRows: `repeat(${rowHeightUnits}, ${GRID_UNIT_HEIGHT_PX}px)`,
                                    gridAutoRows: `${GRID_UNIT_HEIGHT_PX}px`,
                                    gridAutoFlow: "column",
                                    columnGap: `${GRID_GAP_X_PX}px`,
                                    rowGap: `${GRID_GAP_Y_PX}px`,
                                  }}
                                >
                                  {cellNotes.map((note) => (
                                    <article
                                      key={note.id}
                                      className="relative rounded-lg bg-yellow-100 border border-yellow-200 shadow-sm"
                                    >
                                      <textarea
                                        className="absolute inset-0 w-full h-full p-2 pr-6 bg-transparent resize-none focus:outline-none text-gray-800 text-xs"
                                        placeholder="Idée..."
                                        value={note.text || ""}
                                        onChange={(event) =>
                                          updateCellNoteText(
                                            rowItem.id,
                                            columnItem.id,
                                            note.id,
                                            event.target.value,
                                            cellNotes
                                          )
                                        }
                                      />

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeCellNote(rowItem.id, columnItem.id, note.id)
                                        }
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                                        aria-label="Supprimer le post-it"
                                      >
                                        ✕
                                      </button>
                                    </article>
                                  ))}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => addCellNote(rowItem.id, columnItem.id)}
                                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                                aria-label="Ajouter un post-it"
                              >
                                +
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
