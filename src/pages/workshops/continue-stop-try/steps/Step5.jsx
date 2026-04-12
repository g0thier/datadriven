/**
 * @module workshops/continue-stop-try/steps/Step5
 * @description Continue Stop Try step 5 screen for voted stack and per-column commitments.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const DEFAULT_COLUMNS = [
  {
    id: "continue",
    label: "On continue",
    noteBgClass: "bg-green-100",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
  },
  {
    id: "stop",
    label: "On arrête",
    noteBgClass: "bg-red-100",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
  },
  {
    id: "try",
    label: "On tente",
    noteBgClass: "bg-blue-100",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
  },
];

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

const buildRankedNotesByColumn = (notesByColumn, votesByNote) => {
  const buildSorted = (items = []) => {
    return items
      .map((note) => {
        const stickerSet = votesByNote[note.id];
        const stickerCount = stickerSet instanceof Set ? stickerSet.size : 0;

        return {
          ...note,
          stickerCount,
        };
      })
      .filter((note) => note.stickerCount > 0)
      .sort((a, b) => {
        if (b.stickerCount !== a.stickerCount) {
          return b.stickerCount - a.stickerCount;
        }

        if (a.createdAt !== b.createdAt) {
          return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
        }

        return String(a.id || "").localeCompare(String(b.id || ""));
      });
  };

  return {
    continue: buildSorted(notesByColumn.continue || []),
    stop: buildSorted(notesByColumn.stop || []),
    try: buildSorted(notesByColumn.try || []),
  };
};

function Step5({ step, sessionTitle, collaboration }) {
  const columns = Array.isArray(collaboration?.columns) && collaboration.columns.length > 0
    ? collaboration.columns
    : DEFAULT_COLUMNS;

  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const notesByColumn =
    collaboration?.notesByColumn && typeof collaboration.notesByColumn === "object"
      ? collaboration.notesByColumn
      : groupNotesByColumn(notes);

  const votesByNote = collaboration?.votesByNote || {};

  const rankedNotesByColumn =
    collaboration?.rankedNotesByColumn && typeof collaboration.rankedNotesByColumn === "object"
      ? collaboration.rankedNotesByColumn
      : buildRankedNotesByColumn(notesByColumn, votesByNote);

  const step5PlaceholdersByColumn =
    collaboration?.step5PlaceholdersByColumn &&
    typeof collaboration.step5PlaceholdersByColumn === "object"
      ? collaboration.step5PlaceholdersByColumn
      : { continue: "", stop: "", try: "" };

  const currentParticipantId = collaboration?.participant?.id || "";
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi sera visible ici dès qu'il est défini à l'étape 1.";

  const handlePlaceholderChange = (columnId, value) => {
    collaboration?.actions?.setStep5Placeholder?.(columnId, value);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((column) => {
          const rankedNotes = rankedNotesByColumn[column.id] || [];
          const placeholderText = step5PlaceholdersByColumn[column.id] || "";

          return (
            <section
              key={column.id}
              className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{column.label}</h3>

              <textarea
                className="w-full h-28 p-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Définir l'engagement..."
                value={placeholderText}
                onChange={(event) => handlePlaceholderChange(column.id, event.target.value)}
              />

              {rankedNotes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucune note votée dans cette colonne.
                </p>
              ) : (
                <div className="space-y-3">
                  {rankedNotes.map((note, index) => {
                    const stickerSet = votesByNote[note.id] || new Set();
                    const hasMine = stickerSet.has(currentParticipantId);
                    const otherCount = Math.max(0, stickerSet.size - (hasMine ? 1 : 0));

                    return (
                      <article
                        key={note.id}
                        className={`rounded-lg shadow-md p-4 min-h-28 ${column.noteBgClass}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-600">#{index + 1}</span>

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
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </WorkshopStepLayout>
  );
}

export default Step5;
