import { useEffect } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const initialNoteCreationByParticipant = new Set();

function Step2({ step, sessionTitle, collaboration, session }) {
  const myNotes = collaboration?.myNotes || [];
  const isLoading = Boolean(collaboration?.isLoading);
  const participantId = collaboration?.participant?.id || "";
  const sessionId = session?.sessionId || session?.id || "";
  const initialNoteKey = `${sessionId}:${participantId}`;

  const addNote = collaboration?.actions?.addNote;
  const updateNoteText = collaboration?.actions?.updateNoteText;
  const removeNoteAction = collaboration?.actions?.removeNote;

  // Conserve l'UX d'origine: toujours au moins un post-it visible.
  useEffect(() => {
    if (isLoading) return;
    if (myNotes.length > 0) return;
    if (typeof addNote !== "function") return;
    if (!sessionId || !participantId) return;
    if (initialNoteCreationByParticipant.has(initialNoteKey)) return;

    initialNoteCreationByParticipant.add(initialNoteKey);

    let isCancelled = false;

    const createInitialNote = async () => {
      const createdNoteId = await addNote({ text: "" });

      // Autorise un retry si l'écriture initiale échoue.
      if (!createdNoteId && !isCancelled) {
        initialNoteCreationByParticipant.delete(initialNoteKey);
      }
    };

    createInitialNote();

    return () => {
      isCancelled = true;
    };
  }, [addNote, initialNoteKey, isLoading, myNotes.length, participantId, sessionId]);

  const handleChange = (noteId, value) => {
    updateNoteText?.(noteId, value);
  };

  const addEmptyNote = () => {
    addNote?.({ text: "" });
  };

  const removeNote = (noteId) => {
    if (myNotes.length <= 1) return;
    removeNoteAction?.(noteId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {myNotes.map((note, index) => {
          const isLast = index === myNotes.length - 1;

          return (
            <div
              key={note.id}
              className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-37.5 flex flex-col"
            >
              <textarea
                className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800"
                placeholder="Écrivez une idée..."
                value={note.text || ""}
                onChange={(event) => handleChange(note.id, event.target.value)}
              />

              {myNotes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                  aria-label="Supprimer la note"
                >
                  ✕
                </button>
              )}

              {isLast && (
                <button
                  type="button"
                  onClick={addEmptyNote}
                  className="absolute bottom-3 right-3 w-8 h-8 -mb-5 -mr-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                  aria-label="Ajouter une note"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
    </WorkshopStepLayout>
  );
}

export default Step2;
