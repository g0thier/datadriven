import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/design-thinking/steps/Step5
 * @description Design Thinking step 5 screen for note rotation and enrichment.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

/**
 * Renders Design Thinking step 5 (rotation and enrichment).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 5 screen.
 *
 * @example
 * import Step5 from "./steps/Step5.jsx";
 *
 * // Real usage references:
 * // - src/pages/workshops/paper-brain/data.js
 * // - src/pages/workshops/WorkshopRunner.jsx
 * <Step5 step={step} sessionTitle={sessionTitle} collaboration={collaboration} />;
 */
function Step5({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = collaboration?.commentsByNote || {};
  const currentParticipantId = collaboration?.participant?.id || "";
  const getParticipantLabel = collaboration?.getParticipantLabel;
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.problemStatement || "").trim() ||
    "La problématique sera visible ici dès qu'elle est définie à l'étape 3.";

  const participantNotes = useMemo(() => {
    const groupedByParticipant = new Map();

    notes.forEach((note) => {
      if (!note?.authorId) return;

      if (!groupedByParticipant.has(note.authorId)) {
        groupedByParticipant.set(note.authorId, []);
      }

      groupedByParticipant.get(note.authorId).push(note);
    });

    return Array.from(groupedByParticipant.entries())
      .map(([participantId, participantItems]) => ({
        participantId,
        label:
          typeof getParticipantLabel === "function"
            ? getParticipantLabel(participantId)
            : `Participant ${participantId}`,
        notes: participantItems,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [getParticipantLabel, notes]);

  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const participantIds = participantNotes.map((participantItem) => participantItem.participantId);

  const activeParticipantId = participantIds.includes(selectedParticipantId)
    ? selectedParticipantId
    : participantIds[0] || "";
  const currentParticipantIndex = participantIds.indexOf(activeParticipantId);

  const currentParticipantGroup =
    currentParticipantIndex >= 0 ? participantNotes[currentParticipantIndex] : null;
  const visibleNotes = currentParticipantGroup?.notes || [];
  const isOwnNotes = currentParticipantGroup?.participantId === currentParticipantId;

  const goToPreviousParticipant = () => {
    if (participantNotes.length === 0) return;

    const previousIndex =
      currentParticipantIndex <= 0 ? participantNotes.length - 1 : currentParticipantIndex - 1;
    setSelectedParticipantId(participantIds[previousIndex]);
  };

  const goToNextParticipant = () => {
    if (participantNotes.length === 0) return;

    const nextIndex =
      currentParticipantIndex === participantNotes.length - 1 ? 0 : currentParticipantIndex + 1;
    setSelectedParticipantId(participantIds[nextIndex]);
  };

  const addComment = (noteId) => {
    if (isLoading) return;
    collaboration?.actions?.addComment?.(noteId, "");
  };

  const updateComment = (noteId, commentId, value) => {
    if (isLoading) return;

    const currentValue = String(
      (commentsByNote[noteId] || []).find((comment) => comment.id === commentId)?.text || ""
    );
    if (currentValue === value) return;

    collaboration?.actions?.updateCommentText?.(noteId, commentId, value);
  };

  const removeComment = (noteId, commentId) => {
    if (isLoading) return;
    collaboration?.actions?.removeComment?.(noteId, commentId);
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

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      {participantNotes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
          Aucune note disponible pour le moment.
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center col-span-full mb-3 px-2">
            <button
              type="button"
              className="rounded-full bg-violet-500 text-white w-8 h-8 flex items-center justify-center shadow-md hover:bg-violet-600 transition"
              onClick={goToPreviousParticipant}
              aria-label="Participant précédent"
            >
              <span className="relative -top-px">&lt;</span>
            </button>

            {isOwnNotes ? (
              <p className="text-gray-600 text-sm">
                Vos notes parmi {participantNotes.length} participants.
              </p>
            ) : (
              <p className="text-gray-600 text-sm">
                Notes du participant ({currentParticipantIndex + 1}/
                {participantNotes.length})
              </p>
            )}

            <button
              type="button"
              className="rounded-full bg-violet-500 text-white w-8 h-8 flex items-center justify-center shadow-md hover:bg-violet-600 transition"
              onClick={goToNextParticipant}
              aria-label="Participant suivant"
            >
              <span className="relative -top-px">&gt;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
            {visibleNotes.map((note) => {
              const noteComments = commentsByNote[note.id] || [];
              const foreignComments = noteComments.filter(
                (comment) => comment.authorId !== currentParticipantId
              );
              const ownComments = noteComments.filter(
                (comment) => comment.authorId === currentParticipantId
              );

              return (
                <div
                  key={note.id}
                  className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-37.5 flex flex-col"
                >
                  <p className="text-gray-600 mb-1 text-sm whitespace-pre-wrap">
                    {note.text || <span className="text-gray-400">—</span>}
                  </p>

                  <div className="mt-2 space-y-2">
                    {foreignComments.map((comment) => (
                      <div key={comment.id} className="bg-transparent">
                        <p className="text-violet-500 text-xs whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    ))}

                    {ownComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="relative bg-violet-100 border border-violet-200 rounded-lg p-2"
                      >
                        <textarea
                          className="w-full bg-transparent resize-none focus:outline-none text-gray-800 text-sm"
                          placeholder="Ajouter un commentaire…"
                          value={comment.text || ""}
                          onChange={(event) =>
                            updateComment(note.id, comment.id, event.target.value)
                          }
                          rows={2}
                        />

                        <button
                          type="button"
                          onClick={() => removeComment(note.id, comment.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                          aria-label="Supprimer le commentaire"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {!isOwnNotes && (
                    <button
                      type="button"
                      onClick={() => addComment(note.id)}
                      className="absolute bottom-3 right-3 w-5 h-5 -mb-1 -mr-1 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                      aria-label="Ajouter un commentaire"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </WorkshopStepLayout>
  );
}

export default Step5;
