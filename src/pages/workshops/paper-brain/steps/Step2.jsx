import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/paper-brain/steps/Step2
 * @description Paper Brain step 2 screen for individual note creation.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const initialNoteCreationByParticipant = new Set();

/**
 * Renders Paper Brain step 2 (individual idea generation).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Workshop session payload.
 * @returns {JSX.Element} The rendered step 2 screen.
 *
 * @example
 * import Step2 from "./steps/Step2.jsx";
 *
 * // Real usage references:
 * // - src/pages/workshops/paper-brain/data.js
 * // - src/pages/workshops/WorkshopRunner.jsx
 * <Step2 step={step} sessionTitle={sessionTitle} collaboration={collaboration} session={session} />;
 */
function Step2({ step, sessionTitle, collaboration, session }) {
  const myNotes = collaboration?.myNotes || [];
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const participantId = collaboration?.participant?.id || "";
  const sessionId = session?.sessionId || session?.id || "";
  const initialNoteKey = `${sessionId}:${participantId}`;
  const description = String(collaboration?.description || "").trim() || "Le sujet de l'atelier sera affiché ici dès qu'il sera renseigné.";

  const addNote = collaboration?.actions?.addNote;
  const updateNoteText = collaboration?.actions?.updateNoteText;
  const removeNoteAction = collaboration?.actions?.removeNote;

  // Conserve l'UX d'origine: toujours au moins une note visible.
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
    if (isLoading) return;

    const currentValue = String(myNotes.find((note) => note.id === noteId)?.text || "");
    if (currentValue === value) return;

    updateNoteText?.(noteId, value);
  };

  const addEmptyNote = () => {
    if (isLoading) return;
    addNote?.({ text: "" });
  };

  const removeNote = (noteId) => {
    if (isLoading) return;
    if (myNotes.length <= 1) return;
    removeNoteAction?.(noteId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{description}</p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

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
