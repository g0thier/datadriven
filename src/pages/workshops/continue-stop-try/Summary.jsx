/**
 * @module workshops/continue-stop-try/ContinueStopTrySummary
 * @description Workshop-specific summary view for the Continue Stop Try workflow.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

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

const EMPTY_ARRAY = Object.freeze([]);

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

export default function ContinueStopTrySummary({ sessionTitle, collaboration }) {
  const columns = Array.isArray(collaboration?.columns) && collaboration.columns.length > 0
    ? collaboration.columns
    : DEFAULT_COLUMNS;

  const notes = Array.isArray(collaboration?.notes) ? collaboration.notes : EMPTY_ARRAY;

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
    "Le défi n'a pas été renseigné pendant l'atelier.";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">{sessionTitle}</h1>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Sujet de l'atelier</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
        </div>

        {!!syncError && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {syncError}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columns.map((column) => {
            const rankedNotes = rankedNotesByColumn[column.id] || [];
            const placeholderText = String(step5PlaceholdersByColumn[column.id] || "").trim();

            return (
              <section
                key={column.id}
                className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{column.label}</h3>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4 min-h-28">
                  {placeholderText ? (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{placeholderText}</p>
                  ) : (
                    <p className="text-gray-400 text-sm">Aucun engagement rédigé.</p>
                  )}
                </div>

                {rankedNotes.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune note votée dans cette colonne.</p>
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
      </div>
    </div>
  );
}
