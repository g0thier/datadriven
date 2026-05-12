/**
 * @module workshops/design-thinking/steps/Step2
 * @description Design Thinking step 2 screen for collaborative shared notes.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect, useMemo, useRef } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

/**
 * Renders Design Thinking step 2 (shared empathy notes).
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.step - Step metadata (label, description, duration, etc.).
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 2 screen.
 */
export default function Step2({ sessionTitle, step, collaboration }) {
  const sharedNotes = useMemo(
    () => (Array.isArray(collaboration?.sharedNotes) ? collaboration.sharedNotes : []),
    [collaboration]
  );

  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi sera visible ici dès qu'il est défini à l'étape 1.";

  const addSharedNoteAction = collaboration?.actions?.addSharedNote;
  const updateSharedNoteTextAction = collaboration?.actions?.updateSharedNoteText;
  const removeSharedNoteAction = collaboration?.actions?.removeSharedNote;

  const noteInputRefs = useRef({});
  const pendingFocusNoteIdRef = useRef("");

  const syncTextareaHeight = (element) => {
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  };

  const updateNote = (noteId, value) => {
    if (isLoading || !noteId) return;

    const currentValue = String(sharedNotes.find((note) => note.id === noteId)?.text || "");
    if (currentValue === value) return;

    updateSharedNoteTextAction?.(noteId, value, currentValue);
  };

  const removeNote = (noteId) => {
    if (isLoading || !noteId) return;
    removeSharedNoteAction?.(noteId);
  };

  const createNote = async ({ focusNewInput = false } = {}) => {
    if (isLoading) return;
    if (typeof addSharedNoteAction !== "function") return;

    const createdId = await addSharedNoteAction({ text: "" });
    if (focusNewInput && createdId) {
      pendingFocusNoteIdRef.current = createdId;
    }
  };

  useEffect(() => {
    sharedNotes.forEach((note) => {
      syncTextareaHeight(noteInputRefs.current[note.id]);
    });

    const pendingFocusNoteId = pendingFocusNoteIdRef.current;
    if (!pendingFocusNoteId) return;

    const inputElement = noteInputRefs.current[pendingFocusNoteId];
    if (!inputElement) return;

    syncTextareaHeight(inputElement);
    inputElement.focus();
    pendingFocusNoteIdRef.current = "";
  }, [sharedNotes]);

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6">
        {sharedNotes.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune prise de note disponible pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {sharedNotes.map((note) => (
              <li key={note.id} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-4 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" aria-hidden="true" />
                <div className="relative bg-blue-100 border border-blue-200 rounded-lg px-2 py-1.5 flex-1">
                  <textarea
                    rows={1}
                    ref={(element) => {
                      if (element) {
                        noteInputRefs.current[note.id] = element;
                        syncTextareaHeight(element);
                        return;
                      }

                      delete noteInputRefs.current[note.id];
                    }}
                    className="w-full bg-transparent focus:outline-none text-gray-800 text-sm pr-5 resize-none overflow-hidden"
                    placeholder="Ajouter une observation..."
                    value={note.text || ""}
                    onChange={(event) => {
                      syncTextareaHeight(event.target);
                      updateNote(note.id, event.target.value);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                    aria-label="Supprimer la contribution"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void createNote({ focusNewInput: true });
            }}
            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md hover:bg-blue-600 transition"
            aria-label="Ajouter une contribution"
            title="Ajouter une contribution"
          >
            +
          </button>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}
