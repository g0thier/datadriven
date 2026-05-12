/**
 * @module workshops/world-coffee/steps/Step5
 * @description World Cafe step 5 screen for second rotation and reply enrichment.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect, useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_ARRAY = Object.freeze([]);
const buildIdeaReplyKey = (ideaId) => `idea-${String(ideaId || "").trim()}`;

/**
 * Renders World Cafe step 5 (second rotation comment replies on round-2 comments).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Session payload.
 * @returns {JSX.Element} The rendered step 5 screen.
 */
export default function Step5({ step, sessionTitle, collaboration, session }) {
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
  const repliesByComment =
    collaboration?.repliesByComment && typeof collaboration.repliesByComment === "object"
      ? collaboration.repliesByComment
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
  const round3RotationApplied = Boolean(collaboration?.round3RotationApplied);
  const sessionId = String(session?.sessionId || session?.id || "").trim();
  const ensureRound3RotationAction = collaboration?.actions?.ensureRound3Rotation;
  const isWaitingForRotation = subgroupCount > 0 && !round3RotationApplied;

  const challenge =
    String(collaboration?.activeSubgroupDescription?.text || "").trim() ||
    "Le sujet du sous-groupe apparaîtra ici une fois la rotation terminée.";
  const facilitatorId = String(subgroup?.facilitatorId || "").trim();
  const facilitatorLabel = facilitatorId
    ? collaboration?.getParticipantLabel?.(facilitatorId) || "Facilitateur"
    : "Facilitateur non défini";

  useEffect(() => {
    if (!sessionId || !currentParticipantId || !ensureRound3RotationAction) return;
    if (subgroupCount === 0) return;
    if (round3RotationApplied) return;

    ensureRound3RotationAction();
  }, [
    currentParticipantId,
    ensureRound3RotationAction,
    round3RotationApplied,
    sessionId,
    subgroupCount,
  ]);

  const addReply = (targetId) => {
    if (isLoading) return;
    collaboration?.actions?.addCommentReply?.(targetId, "");
  };

  const updateReply = (targetId, replyId, value) => {
    if (isLoading) return;

    const currentValue = String(
      (repliesByComment[targetId] || EMPTY_ARRAY).find((reply) => reply.id === replyId)?.text || ""
    );
    if (currentValue === value) return;

    collaboration?.actions?.updateCommentReplyText?.(targetId, replyId, value);
  };

  const removeReply = (targetId, replyId) => {
    if (isLoading) return;
    collaboration?.actions?.removeCommentReply?.(targetId, replyId);
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
          Aucun sous-groupe disponible: assignez d&apos;abord un facilitateur à chaque sujet à l&apos;étape 2.
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
          Aucune idée du round 1 disponible pour ce sujet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Idées du premier round</h3>
              <p className="text-xs text-gray-500">{subgroupLabel}</p>
            </div>
          </div>

          <ul className="space-y-4">
            {ideas.map((idea) => {
              const ideaComments = (commentsByIdea[idea.id] || EMPTY_ARRAY).filter(
                (comment) => !comment?.roundId || comment.roundId === "round-2"
              );
              const ideaReplyKey = buildIdeaReplyKey(idea.id);
              const ideaDirectReplies = (repliesByComment[ideaReplyKey] || EMPTY_ARRAY).filter(
                (reply) => !reply?.roundId || reply.roundId === "round-3"
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
                    {ideaComments.length === 0 ? (
                      <div>
                        {ideaDirectReplies.length > 0 && (
                          <div className="space-y-2">
                            {ideaDirectReplies.map((reply) => (
                              <div
                                key={reply.id}
                                className="relative bg-green-100 border border-green-300 rounded-lg p-2"
                              >
                                <textarea
                                  className="w-full bg-transparent resize-none focus:outline-none text-gray-800 text-sm"
                                  placeholder="Sur-enrichir l'idée"
                                  value={reply.text || ""}
                                  onChange={(event) =>
                                    updateReply(ideaReplyKey, reply.id, event.target.value)
                                  }
                                  rows={2}
                                />

                                <button
                                  type="button"
                                  onClick={() => removeReply(ideaReplyKey, reply.id)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                                  aria-label="Supprimer la réponse"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => addReply(ideaReplyKey)}
                            className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center shadow-sm hover:bg-green-600 transition"
                            aria-label="Sur-enrichir l'idée"
                            title="Sur-enrichir l'idée"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : (
                      ideaComments.map((comment) => {
                        const commentReplies = (repliesByComment[comment.id] || EMPTY_ARRAY).filter(
                          (reply) => !reply?.roundId || reply.roundId === "round-3"
                        );

                        return (
                        <div
                          key={comment.id}
                          className="bg-blue-100 border border-blue-200 rounded-lg p-2"
                        >
                          <p className="text-gray-800 text-sm whitespace-pre-wrap">
                            {comment.text || <span className="text-gray-400">-</span>}
                          </p>

                          <div className="mt-2 space-y-2">
                            {commentReplies.map((reply) => (
                              <div
                                key={reply.id}
                                className="relative bg-green-100 border border-green-200 rounded-lg p-2"
                              >
                                <textarea
                                  className="w-full bg-transparent resize-none focus:outline-none text-gray-800 text-sm"
                                  placeholder="Sur-enrichir l'idée"
                                  value={reply.text || ""}
                                  onChange={(event) =>
                                    updateReply(comment.id, reply.id, event.target.value)
                                  }
                                  rows={2}
                                />

                                <button
                                  type="button"
                                  onClick={() => removeReply(comment.id, reply.id)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                                  aria-label="Supprimer la réponse"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => addReply(comment.id)}
                              className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center shadow-sm hover:bg-green-600 transition"
                              aria-label="Sur-enrichir l'idée"
                              title="Sur-enrichir l'idée"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        );
                      })
                    )}
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
