/**
 * @module workshops/speed-boat/steps/Step3
 * @description Speed Boat step 3 screen for displaying challenge and objective context.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect } from "react";
import speedBoatAnchorImg from "../../../../assets/workshops/speed-boat/speed-boat-anchor.png";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const initialBrakeCreationByParticipant = new Set();

/**
 * Renders Speed Boat step 3 (obstacle identification context).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Workshop session payload.
 * @returns {JSX.Element} The rendered step 3 screen.
 */
export default function Step3({ step, sessionTitle, collaboration, session }) {
  const myBrakeNotes = collaboration?.myBrakeNotes || [];
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const participantId = collaboration?.participant?.id || "";
  const sessionId = session?.sessionId || session?.id || "";
  const initialNoteKey = `${sessionId}:${participantId}`;
  const challenge = String(collaboration?.step1Description || "").trim() || "Le sujet de l'atelier sera affiché ici dès qu'il sera renseigné.";
  const objective = String(collaboration?.step2Objective || "").trim() || "L'objectif de l'atelier sera affiché ici dès qu'il sera renseigné.";
  const addBrakeNote = collaboration?.actions?.addBrakeNote;
  const updateBrakeNoteText = collaboration?.actions?.updateBrakeNoteText;
  const removeBrakeNoteAction = collaboration?.actions?.removeBrakeNote;

  useEffect(() => {
    if (isLoading) return;
    if (myBrakeNotes.length > 0) return;
    if (typeof addBrakeNote !== "function") return;
    if (!sessionId || !participantId) return;
    if (initialBrakeCreationByParticipant.has(initialNoteKey)) return;

    initialBrakeCreationByParticipant.add(initialNoteKey);

    let isCancelled = false;

    const createInitialNote = async () => {
      const createdNoteId = await addBrakeNote({ text: "" });
      if (!createdNoteId && !isCancelled) {
        initialBrakeCreationByParticipant.delete(initialNoteKey);
      }
    };

    createInitialNote();

    return () => {
      isCancelled = true;
    };
  }, [addBrakeNote, initialNoteKey, isLoading, myBrakeNotes.length, participantId, sessionId]);

  const handleChange = (noteId, value) => {
    if (isLoading) return;

    const currentValue = String(myBrakeNotes.find((note) => note.id === noteId)?.text || "");
    if (currentValue === value) return;

    updateBrakeNoteText?.(noteId, value);
  };

  const addEmptyNote = () => {
    if (isLoading) return;
    addBrakeNote?.({ text: "" });
  };

  const removeNote = (noteId) => {
    if (isLoading) return;
    if (myBrakeNotes.length <= 1) return;
    removeBrakeNoteAction?.(noteId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
              Défi
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{challenge}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
              Objectif
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{objective}</p>
          </div>
        </div>

        <div className="md:col-span-1 bg-white rounded-2xl shadow-md overflow-hidden relative min-h-64 md:min-h-0 md:h-full">
          <img
            src={speedBoatAnchorImg}
            alt="Ancre Speed Boat"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {myBrakeNotes.map((note, index) => {
          const isLast = index === myBrakeNotes.length - 1;

          return (
            <div
              key={note.id}
              className="relative bg-red-100 rounded-lg shadow-md p-4 min-h-37.5 flex flex-col"
            >
              <textarea
                className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800"
                placeholder="Écrivez un frein..."
                value={note.text || ""}
                onChange={(event) => handleChange(note.id, event.target.value)}
              />

              {myBrakeNotes.length > 1 && (
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
                  className="absolute bottom-3 right-3 w-8 h-8 -mb-5 -mr-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition"
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
