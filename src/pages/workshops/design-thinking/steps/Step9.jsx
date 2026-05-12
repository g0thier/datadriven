import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/design-thinking/steps/Step9
 * @description Design Thinking step 9 screen for collective prototype feedback notes.
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

function Step9({ step, sessionTitle, collaboration }) {
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

  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const problemStatement =
    String(collaboration?.problemStatement || "").trim() ||
    "La problématique sera visible ici dès qu'elle est définie à l'étape 3.";

  const addPrototypeFeedbackNote = collaboration?.actions?.addPrototypeFeedbackNote;
  const updatePrototypeFeedbackNoteText =
    collaboration?.actions?.updatePrototypeFeedbackNoteText;
  const removePrototypeFeedbackNote = collaboration?.actions?.removePrototypeFeedbackNote;

  const addEmptyNote = (columnId) => {
    if (isLoading) return;
    addPrototypeFeedbackNote?.({ columnId, text: "" });
  };

  const handleChange = (noteId, value, previousValue) => {
    if (isLoading) return;
    updatePrototypeFeedbackNoteText?.(noteId, value, previousValue);
  };

  const removeNote = (noteId) => {
    if (isLoading) return;
    removePrototypeFeedbackNote?.(noteId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{problemStatement}</p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((column) => {
          const columnNotes = prototypeFeedbackNotesByColumn[column.id] || [];

          return (
            <section
              key={column.id}
              className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{column.label}</h3>

              <div className="space-y-4">
                {columnNotes.map((note) => (
                  <article
                    key={note.id}
                    className={`relative rounded-lg shadow-md p-4 min-h-37.5 flex flex-col ${column.noteBgClass}`}
                  >
                    <textarea
                      className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800"
                      placeholder="Écrivez un feedback..."
                      value={note.text || ""}
                      onChange={(event) =>
                        handleChange(note.id, event.target.value, String(note.text || ""))
                      }
                      disabled={isLoading}
                    />

                    <button
                      type="button"
                      onClick={() => removeNote(note.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                      aria-label="Supprimer la note"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </article>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addEmptyNote(column.id)}
                className="mt-4 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition disabled:opacity-50"
                aria-label={`Ajouter une note ${column.label}`}
                disabled={isLoading}
              >
                +
              </button>
            </section>
          );
        })}
      </div>
    </WorkshopStepLayout>
  );
}

export default Step9;
