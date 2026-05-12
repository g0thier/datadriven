/**
 * @module workshops/continue-stop-try/steps/Step4
 * @description Continue Stop Try step 4 screen for dot voting in 3 column dashboards.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const DEFAULT_COLUMNS = [
  {
    id: "continue",
    label: "On continue",
    noteBgClass: "bg-green-100",
    noteMutedBgClass: "bg-green-50",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
    indicatorClass: "bg-green-500",
    indicatorSoftClass: "bg-green-200",
  },
  {
    id: "stop",
    label: "On arrête",
    noteBgClass: "bg-red-100",
    noteMutedBgClass: "bg-red-50",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
    indicatorClass: "bg-red-500",
    indicatorSoftClass: "bg-red-200",
  },
  {
    id: "try",
    label: "On tente",
    noteBgClass: "bg-blue-100",
    noteMutedBgClass: "bg-blue-50",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
    indicatorClass: "bg-blue-500",
    indicatorSoftClass: "bg-blue-200",
  },
];

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 1200;
const NOTE_WIDTH = 200;

function buildGridPosition(index = 0) {
  const col = index % 2;
  const row = Math.floor(index / 2);

  return {
    x: 24 + col * 220,
    y: 24 + row * 170,
  };
}

function normalizePosition(position = {}, fallback = buildGridPosition(0)) {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
}

const groupNotesByColumn = (notes = []) => {
  const grouped = {
    continue: [],
    stop: [],
    try: [],
  };

  notes.forEach((note) => {
    const columnId = String(note?.columnId || "").trim();
    if (!grouped[columnId]) return;
    grouped[columnId].push(note);
  });

  return grouped;
};

function Step4({ step, sessionTitle, collaboration }) {
  const columns = Array.isArray(collaboration?.columns) && collaboration.columns.length > 0
    ? collaboration.columns
    : DEFAULT_COLUMNS;

  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const notesByColumn =
    collaboration?.notesByColumn && typeof collaboration.notesByColumn === "object"
      ? collaboration.notesByColumn
      : groupNotesByColumn(notes);

  const votesByNote = collaboration?.votesByNote || {};
  const currentParticipantId = collaboration?.participant?.id || "";
  const remainingVotesByColumn =
    collaboration?.remainingVotesByColumn &&
    typeof collaboration.remainingVotesByColumn === "object"
      ? collaboration.remainingVotesByColumn
      : { continue: 0, stop: 0, try: 0 };

  const maxStickers = Number.isFinite(collaboration?.maxStickers)
    ? collaboration.maxStickers
    : 3;

  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi sera visible ici dès qu'il est défini à l'étape 1.";

  const [zoom, setZoom] = useState(50);
  const scale = zoom / 100;

  const toggleSticker = (noteId, hasMine, columnId) => {
    if (!hasMine && (remainingVotesByColumn[columnId] || 0) <= 0) return;
    collaboration?.actions?.toggleVote?.(noteId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="flex items-center justify-end mb-3 gap-3">
        <span className="text-xs text-gray-500 w-12 text-right">{zoom}%</span>

        <input
          type="range"
          min="20"
          max="100"
          step="5"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-40 accent-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((column) => {
          const columnNotes = notesByColumn[column.id] || [];
          const remainingVotes = remainingVotesByColumn[column.id] || 0;

          return (
            <section
              key={column.id}
              className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  {column.label} ({columnNotes.length})
                </h3>

                <div className="flex items-center gap-1" title="Gommettes restantes dans cette colonne">
                  {Array.from({ length: maxStickers }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full ${
                        index < remainingVotes ? column.indicatorClass : column.indicatorSoftClass
                      }`}
                    />
                  ))}
                </div>
              </div>

              {columnNotes.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-8 text-center text-gray-500 bg-white">
                  Cette colonne se remplira après l'étape 2.
                </div>
              ) : (
                <div className="w-full overflow-auto rounded-xl border border-slate-200 bg-white">
                  <div
                    className="relative origin-top-left"
                    style={{
                      width: CANVAS_WIDTH * scale,
                      height: CANVAS_HEIGHT * scale,
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.08) 1px, transparent 1px)",
                        backgroundSize: `${56 * scale}px ${56 * scale}px`,
                      }}
                    />

                    {columnNotes.map((note, index) => {
                      const displayPosition = normalizePosition(note.position, buildGridPosition(index));
                      const stickerSet = votesByNote[note.id] || new Set();
                      const hasMine = stickerSet.has(currentParticipantId);
                      const otherCount = Math.max(0, stickerSet.size - (hasMine ? 1 : 0));
                      const isDisabled = !hasMine && remainingVotes <= 0;

                      return (
                        <div
                          key={note.id}
                          className="absolute select-none touch-none"
                          style={{
                            transform: `translate(${displayPosition.x * scale}px, ${
                              displayPosition.y * scale
                            }px) scale(${scale})`,
                            transformOrigin: "top left",
                            width: NOTE_WIDTH,
                          }}
                        >
                          <div
                            className={`relative rounded-lg shadow-md p-4 min-h-28 ${
                              isDisabled ? column.noteMutedBgClass : `${column.noteBgClass} cursor-pointer`
                            }`}
                            role="button"
                            tabIndex={0}
                            title="Cliquer pour ajouter/retirer une gommette"
                            onClick={() => toggleSticker(note.id, hasMine, column.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleSticker(note.id, hasMine, column.id);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-xs text-gray-500"></span>

                              <div className="flex items-center gap-1">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    hasMine ? "bg-green-600" : "bg-transparent border border-green-300"
                                  }`}
                                  title={hasMine ? "Ta gommette" : "Pas de gommette"}
                                />

                                {Array.from({ length: otherCount }).map((_, stickerIndex) => (
                                  <div
                                    key={stickerIndex}
                                    className="w-3 h-3 rounded-full bg-blue-500"
                                    title="Gommette d'un autre participant"
                                  />
                                ))}
                              </div>
                            </div>

                            <p className="text-gray-700 text-sm whitespace-pre-wrap">
                              {note.text || <span className="text-gray-400">—</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </WorkshopStepLayout>
  );
}

export default Step4;
