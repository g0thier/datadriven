/**
 * @module workshops/matrice-croisee/steps/Step4
 * @description Matrice croisee step 4 screen for sticker voting on matrix notes.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useEffect, useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_SET = Object.freeze(new Set());
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
 * Renders Matrice croisee step 4 (sticker voting on matrix notes).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Workshop session payload.
 * @returns {JSX.Element} The rendered step 4 screen.
 */
export default function Step4({ step, sessionTitle, collaboration, session }) {
  const columnItems = Array.isArray(collaboration?.columnItems)
    ? collaboration.columnItems
    : EMPTY_ARRAY;
  const rowItems = Array.isArray(collaboration?.rowItems) ? collaboration.rowItems : EMPTY_ARRAY;
  const cellNotesByKey =
    collaboration?.cellNotesByKey && typeof collaboration.cellNotesByKey === "object"
      ? collaboration.cellNotesByKey
      : EMPTY_OBJECT;
  const votesByNote =
    collaboration?.votesByNote && typeof collaboration.votesByNote === "object"
      ? collaboration.votesByNote
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
  const step1Description = String(collaboration?.step1Description || "").trim() || "...";
  const remainingVotes = Number.isFinite(collaboration?.remainingVotes)
    ? collaboration.remainingVotes
    : 0;
  const maxStickers = Number.isFinite(collaboration?.maxStickers)
    ? collaboration.maxStickers
    : 1;

  const initializeStructure = collaboration?.actions?.initializeStructure;
  const toggleVoteAction = collaboration?.actions?.toggleVote;

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

  const getCellNotes = useCallback(
    (rowId, columnId) => {
      const cellKey = buildCellKey(rowId, columnId);
      const notes = cellNotesByKey[cellKey];
      return Array.isArray(notes) ? notes : EMPTY_ARRAY;
    },
    [buildCellKey, cellNotesByKey]
  );

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

  const getVoteSet = useCallback(
    (noteId) => {
      const voteSet = votesByNote[noteId];
      return voteSet instanceof Set ? voteSet : EMPTY_SET;
    },
    [votesByNote]
  );

  const maxVoteCount = useMemo(() => {
    return Object.values(votesByNote).reduce((maxCount, voteSet) => {
      if (!(voteSet instanceof Set)) return maxCount;
      return Math.max(maxCount, voteSet.size);
    }, 0);
  }, [votesByNote]);

  const hasTopVoteTie = useMemo(() => {
    if (maxVoteCount <= 0) return false;

    let topNotesCount = 0;

    for (const rowItem of rowItems) {
      for (const columnItem of columnItems) {
        const cellNotes = getCellNotes(rowItem.id, columnItem.id);

        for (const note of cellNotes) {
          const voteCount = getVoteSet(note.id).size;
          if (voteCount === maxVoteCount) {
            topNotesCount += 1;
            if (topNotesCount > 1) return true;
          }
        }
      }
    }

    return false;
  }, [columnItems, getCellNotes, getVoteSet, maxVoteCount, rowItems]);

  const toggleSticker = useCallback(
    (noteId, hasMine) => {
      if (isLoading || !noteId) return;
      if (!hasMine && remainingVotes <= 0) return;
      toggleVoteAction?.(noteId);
    },
    [isLoading, remainingVotes, toggleVoteAction]
  );

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{step1Description}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-md p-4">


        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Gommettes à distribuer :</span>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(0, maxStickers) }).map((_, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full ${
                    index < remainingVotes ? "bg-green-400" : "bg-green-200"
                  }`}
                  title={index < remainingVotes ? "Disponible" : "Déjà utilisée"}
                />
              ))}
            </div>
          </div>
        </div>

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
                          {cellNotes.length === 0 ? null : (
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
                                {cellNotes.map((note) => {
                                  const voteSet = getVoteSet(note.id);
                                  const voteCount = voteSet.size;
                                  const hasMine = voteSet.has(participantId);
                                  const otherCount = Math.max(0, voteSet.size - (hasMine ? 1 : 0));
                                  const isDisabled = !hasMine && remainingVotes <= 0;
                                  const isTopVoted = voteCount > 0 && voteCount === maxVoteCount;
                                  const isTopVotedTie = isTopVoted && hasTopVoteTie;
                                  const noteStateClass = isDisabled
                                    ? "bg-yellow-50"
                                    : "bg-yellow-100 cursor-pointer hover:bg-yellow-200";
                                  const noteBorderClass = isTopVotedTie
                                    ? "border border-orange-300"
                                    : isTopVoted
                                    ? "border border-green-300"
                                    : isDisabled
                                      ? "border border-yellow-100"
                                      : "border border-yellow-200";

                                  return (
                                    <article
                                      key={note.id}
                                      onClick={() => toggleSticker(note.id, hasMine)}
                                      className={`relative rounded-lg shadow-sm p-2 transition ${noteStateClass} ${noteBorderClass}`}
                                      title="Cliquer pour ajouter/retirer une gommette"
                                    >
                                      <div className="flex items-center justify-end gap-1 mb-1">
                                        <div
                                          className={`w-3 h-3 rounded-full ${
                                            hasMine
                                              ? "bg-green-500"
                                              : "bg-transparent border border-green-300"
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

                                      <p className="text-gray-700 text-xs whitespace-pre-wrap wrap-break-word">
                                        {note.text || <span className="text-gray-400">—</span>}
                                      </p>
                                    </article>
                                  );
                                })}
                              </div>
                            </div>
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
        {hasTopVoteTie && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Ex aequo : si le vote reste à égalité, une seule note sera sélectionnée
            dans l'étape suivante.
          </p>
        )}
      </div>
    </WorkshopStepLayout>
  );
}
