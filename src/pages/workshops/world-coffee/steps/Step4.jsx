/**
 * @module workshops/world-coffee/steps/Step4
 * @description World Cafe step 4 screen for first rotation and idea enrichment comments.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect, useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_ARRAY = Object.freeze([]);

/**
 * Renders World Cafe step 4 (first rotation comments on round-1 ideas).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Session payload.
 * @returns {JSX.Element} The rendered step 4 screen.
 */
export default function Step4({ step, sessionTitle, collaboration, session }) {
  const subgroup = collaboration?.activeSubgroup || null;
  const subgroupLabel = subgroup?.label || "Sous-groupe";
  const activeIdeas = collaboration?.activeIdeas;
  const ideas = useMemo(() => {
    if (!Array.isArray(activeIdeas)) return EMPTY_ARRAY;

    return activeIdeas.filter(
      (idea) => !idea?.roundId || String(idea.roundId).trim() === "round-1"
    );
  }, [activeIdeas]);
  const commentsByIdea =
    collaboration?.commentsByIdea && typeof collaboration.commentsByIdea === "object"
      ? collaboration.commentsByIdea
      : {};
  const currentParticipantId = String(collaboration?.participant?.id || "").trim();
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const hasUnassignedDescriptions = Boolean(collaboration?.hasUnassignedDescriptions);
  const descriptionCount = Array.isArray(collaboration?.descriptions)
    ? collaboration.descriptions.length
    : 0;
  const subgroupCount = Array.isArray(collaboration?.subgroups)
    ? collaboration.subgroups.length
    : 0;
  const round2RotationApplied = Boolean(collaboration?.round2RotationApplied);
  const sessionId = String(session?.sessionId || session?.id || "").trim();
  const ensureRound2RotationAction = collaboration?.actions?.ensureRound2Rotation;
  const isWaitingForRotation = subgroupCount > 0 && !round2RotationApplied;

  const challenge =
    String(collaboration?.activeSubgroupDescription?.text || "").trim() ||
    "Le sujet du sous-groupe apparaitra ici une fois la rotation terminee.";
  const facilitatorId = String(subgroup?.facilitatorId || "").trim();
  const facilitatorLabel = facilitatorId
    ? collaboration?.getParticipantLabel?.(facilitatorId) || "Facilitateur"
    : "Facilitateur non defini";

  useEffect(() => {
    if (!sessionId || !currentParticipantId || !ensureRound2RotationAction) return;
    if (subgroupCount === 0) return;
    if (round2RotationApplied) return;

    ensureRound2RotationAction();
  }, [
    currentParticipantId,
    ensureRound2RotationAction,
    round2RotationApplied,
    sessionId,
    subgroupCount,
  ]);

  const addComment = (ideaId) => {
    if (isLoading) return;
    collaboration?.actions?.addIdeaComment?.(ideaId, "");
  };

  const updateComment = (ideaId, commentId, value) => {
    if (isLoading) return;

    const currentValue = String(
      (commentsByIdea[ideaId] || EMPTY_ARRAY).find((comment) => comment.id === commentId)?.text || ""
    );
    if (currentValue === value) return;

    collaboration?.actions?.updateIdeaCommentText?.(ideaId, commentId, value);
  };

  const removeComment = (ideaId, commentId) => {
    if (isLoading) return;
    collaboration?.actions?.removeIdeaComment?.(ideaId, commentId);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        <p className="text-xs text-gray-500">
          {subgroupLabel} - {facilitatorLabel}
        </p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {descriptionCount > 0 && subgroupCount === 0 && hasUnassignedDescriptions && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Aucun sous-groupe disponible: assignez d&apos;abord un facilitateur a chaque sujet a l&apos;etape 2.
        </p>
      )}

      {isWaitingForRotation ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Permutation des groupes en cours...
        </div>
      ) : !subgroup ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Rotation des groupes en cours...
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Aucune idee du round 1 disponible pour ce sujet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Idees du premier round</h3>
              <p className="text-xs text-gray-500">{subgroupLabel}</p>
            </div>
          </div>

          <ul className="space-y-4">
            {ideas.map((idea) => {
              const ideaComments = (commentsByIdea[idea.id] || EMPTY_ARRAY).filter(
                (comment) => !comment?.roundId || comment.roundId === "round-2"
              );

              return (
                <li
                  key={idea.id}
                  className="text-sm text-gray-700 bg-violet-100 border border-violet-200 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {idea.text || <span className="text-gray-400">-</span>}
                    </p>
                  </div>

                  <div className="mt-2 space-y-2">
                    {ideaComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="relative bg-blue-100 border border-blue-200 rounded-lg p-2"
                      >
                        <textarea
                          className="w-full bg-transparent resize-none focus:outline-none text-gray-800 text-sm"
                          placeholder="Enrichir l'idée"
                          value={comment.text || ""}
                          onChange={(event) => updateComment(idea.id, comment.id, event.target.value)}
                          rows={2}
                        />

                        <button
                          type="button"
                          onClick={() => removeComment(idea.id, comment.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                          aria-label="Supprimer le commentaire"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => addComment(idea.id)}
                      className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center shadow-sm hover:bg-blue-600 transition"
                      aria-label="Enrichir l'idée"
                      title="Enrichir l'idée"
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </WorkshopStepLayout>
  );
}
