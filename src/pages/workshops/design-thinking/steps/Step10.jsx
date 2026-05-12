/**
 * @module workshops/design-thinking/steps/Step10
 * @description Design Thinking step 10 screen for collective conclusion and readonly test feedback.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const DEFAULT_COLUMNS = [
  {
    id: "works",
    label: "Ce qui fonctionne",
    noteBgClass: "bg-green-100",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
  },
  {
    id: "problems",
    label: "Ce qui pose problème",
    noteBgClass: "bg-red-100",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
  },
  {
    id: "improvements",
    label: "Ce qui peut être amélioré",
    noteBgClass: "bg-blue-100",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
  },
];

const groupNotesByColumn = (notes = []) => {
  const grouped = {
    works: [],
    problems: [],
    improvements: [],
  };

  notes.forEach((note) => {
    const columnId = String(note?.columnId || "").trim();
    if (!grouped[columnId]) return;
    grouped[columnId].push(note);
  });

  return grouped;
};

function Step10({ step, sessionTitle, collaboration }) {
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const problemStatement =
    String(collaboration?.problemStatement || "").trim() ||
    "La problématique sera visible ici dès qu'elle est définie à l'étape 3.";
  const conclusion = String(collaboration?.conclusion || "");

  const columns =
    Array.isArray(collaboration?.prototypeFeedbackColumns) &&
    collaboration.prototypeFeedbackColumns.length > 0
      ? collaboration.prototypeFeedbackColumns
      : DEFAULT_COLUMNS;
  const prototypeFeedbackNotes = Array.isArray(collaboration?.prototypeFeedbackNotes)
    ? collaboration.prototypeFeedbackNotes
    : [];
  const prototypeFeedbackNotesByColumn =
    collaboration?.prototypeFeedbackNotesByColumn &&
    typeof collaboration.prototypeFeedbackNotesByColumn === "object"
      ? collaboration.prototypeFeedbackNotesByColumn
      : groupNotesByColumn(prototypeFeedbackNotes);

  const handleConclusionChange = (event) => {
    const nextConclusion = event.target.value;
    if (isLoading || nextConclusion === conclusion) return;
    collaboration?.actions?.setConclusion?.(nextConclusion, conclusion);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Problématique</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{problemStatement}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <textarea
        className="w-full h-40 p-4 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
        placeholder="Rédigez la conclusion du groupe..."
        disabled={isLoading}
        value={conclusion}
        onChange={handleConclusionChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((column) => {
          const columnNotes = prototypeFeedbackNotesByColumn[column.id] || [];

          return (
            <section
              key={column.id}
              className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{column.label}</h3>

              {columnNotes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucun feedback dans cette colonne pour le moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {columnNotes.map((note) => (
                    <article
                      key={note.id}
                      className={`rounded-lg shadow-md p-4 min-h-20 ${column.noteBgClass}`}
                    >
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">
                        {String(note.text || "").trim() || "—"}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </WorkshopStepLayout>
  );
}

export default Step10;
