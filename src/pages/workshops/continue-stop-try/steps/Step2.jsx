/**
 * @module workshops/continue-stop-try/steps/Step2
 * @description Continue Stop Try step 2 screen for individual note creation per column.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const initialNoteCreationByParticipantColumn = new Set();

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

function Step2({ step, sessionTitle, collaboration, session }) {
  const columns = Array.isArray(collaboration?.columns) && collaboration.columns.length > 0
    ? collaboration.columns
    : DEFAULT_COLUMNS;

  const myNotes = Array.isArray(collaboration?.myNotes) ? collaboration.myNotes : [];
  const myNotesByColumn =
    collaboration?.myNotesByColumn && typeof collaboration.myNotesByColumn === "object"
      ? collaboration.myNotesByColumn
      : groupNotesByColumn(myNotes);

  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const participantId = collaboration?.participant?.id || "";
  const sessionId = session?.sessionId || session?.id || "";
  const step1Description = String(collaboration?.step1Description || "").trim() || "Le sujet de l'atelier sera affiché ici dès qu'il sera renseigné.";

  const addNote = collaboration?.actions?.addNote;
  const updateNoteText = collaboration?.actions?.updateNoteText;
  const removeNoteAction = collaboration?.actions?.removeNote;

  useEffect(() => {
    if (isLoading) return;
    if (typeof addNote !== "function") return;
    if (!sessionId || !participantId) return;

    columns.forEach((column) => {
      const columnNotes = myNotesByColumn[column.id] || [];
      if (columnNotes.length > 0) return;

      const initialNoteKey = `${sessionId}:${participantId}:${column.id}`;
      if (initialNoteCreationByParticipantColumn.has(initialNoteKey)) return;

      initialNoteCreationByParticipantColumn.add(initialNoteKey);

      addNote({ columnId: column.id, text: "" }).then((createdNoteId) => {
        if (!createdNoteId) {
          initialNoteCreationByParticipantColumn.delete(initialNoteKey);
        }
      });
    });
  }, [addNote, columns, isLoading, myNotesByColumn, participantId, sessionId]);

  const handleChange = (noteId, value) => {
    if (isLoading) return;

    const currentValue = String(myNotes.find((note) => note.id === noteId)?.text || "");
    if (currentValue === value) return;

    updateNoteText?.(noteId, value);
  };

  const addEmptyNote = (columnId) => {
    if (isLoading) return;
    addNote?.({ columnId, text: "" });
  };

  const removeNote = (columnId, noteId) => {
    if (isLoading) return;
    const columnNotes = myNotesByColumn[columnId] || [];
    if (columnNotes.length <= 1) return;
    removeNoteAction?.(noteId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{step1Description}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((column) => {
          const columnNotes = myNotesByColumn[column.id] || [];

          return (
            <section
              key={column.id}
              className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{column.label}</h3>

              <div className="space-y-4">
                {columnNotes.map((note, index) => {
                  const isLast = index === columnNotes.length - 1;

                  return (
                    <article
                      key={note.id}
                      className={`relative rounded-lg shadow-md p-4 min-h-37.5 flex flex-col ${column.noteBgClass}`}
                    >
                      <textarea
                        className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800"
                        placeholder="Écrivez une idée..."
                        value={note.text || ""}
                        onChange={(event) => handleChange(note.id, event.target.value)}
                      />

                      {columnNotes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeNote(column.id, note.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                          aria-label="Supprimer la note"
                        >
                          ✕
                        </button>
                      )}

                      {isLast && (
                        <button
                          type="button"
                          onClick={() => addEmptyNote(column.id)}
                          className="absolute bottom-3 right-3 w-8 h-8 -mb-5 -mr-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                          aria-label={`Ajouter une note ${column.label}`}
                        >
                          +
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </WorkshopStepLayout>
  );
}

export default Step2;
