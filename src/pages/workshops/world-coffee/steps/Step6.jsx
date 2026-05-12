import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/world-coffee/steps/Step6
 * @description World Cafe step 6 screen for return rotation and subgroup synthesis.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useEffect, useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_ARRAY = Object.freeze([]);
const buildIdeaReplyKey = (ideaId) => `idea-${String(ideaId || "").trim()}`;

/**
 * Renders World Cafe step 6 (return rotation and read-only consolidation).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @param {Object} props.session - Session payload.
 * @returns {JSX.Element} The rendered step 6 screen.
 */
export default function Step6({ step, sessionTitle, collaboration, session }) {
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
  const returnRotationApplied = Boolean(collaboration?.returnRotationApplied);
  const sessionId = String(session?.sessionId || session?.id || "").trim();
  const ensureReturnRotationAction = collaboration?.actions?.ensureReturnRotation;
  const isWaitingForRotation = subgroupCount > 0 && !returnRotationApplied;

  const activeSubgroupSynthesis = collaboration?.activeSubgroupSynthesis || null;
  const synthesisText = String(activeSubgroupSynthesis?.text ?? "");

  const challenge =
    String(collaboration?.activeSubgroupDescription?.text || "").trim() ||
    "Le sujet du sous-groupe apparaîtra ici une fois la rotation terminée.";
  const facilitatorId = String(subgroup?.facilitatorId || "").trim();
  const facilitatorLabel = facilitatorId
    ? collaboration?.getParticipantLabel?.(facilitatorId) || "Facilitateur"
    : "Facilitateur non défini";

  useEffect(() => {
    if (!sessionId || !currentParticipantId || !ensureReturnRotationAction) return;
    if (subgroupCount === 0) return;
    if (returnRotationApplied) return;

    ensureReturnRotationAction();
  }, [
    currentParticipantId,
    ensureReturnRotationAction,
    returnRotationApplied,
    sessionId,
    subgroupCount,
  ]);

  const updateSynthesis = (value) => {
    if (isLoading) return;
    if (value === synthesisText) return;

    collaboration?.actions?.updateSubgroupSynthesis?.(value, synthesisText);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        <p className="text-xs text-gray-500">
          {subgroupLabel} - {facilitatorLabel}
        </p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      {descriptionCount > 0 && subgroupCount === 0 && hasUnassignedDescriptions && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Aucun sous-groupe disponible pour le moment.
        </p>
      )}

      {isWaitingForRotation ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Retour des groupes en cours...
        </div>
      ) : !subgroup ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Rotation des groupes en cours...
        </div>
      ) : (
        <>
          {ideas.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
              Aucune idée du round 1 disponible pour ce sujet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Idées</h3>
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
                        {ideaComments.map((comment) => {
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

                              {commentReplies.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {commentReplies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className="bg-green-100 border border-green-200 rounded-lg p-2"
                                    >
                                      <p className="text-gray-800 text-sm whitespace-pre-wrap">
                                        {reply.text || <span className="text-gray-400">-</span>}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {ideaDirectReplies.length > 0 && (
                          <div className="space-y-2">
                            {ideaDirectReplies.map((reply) => (
                              <div
                                key={reply.id}
                                className="bg-green-100 border border-green-300 rounded-lg p-2"
                              >
                                <p className="text-gray-800 text-sm whitespace-pre-wrap">
                                  {reply.text || <span className="text-gray-400">-</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-6 mt-4">
            <div className="mb-2">
              <h3 className="text-base font-semibold text-gray-800">Synthèse</h3>
              <p className="text-xs text-gray-500">{subgroupLabel}</p>
            </div>

            <textarea
              className="w-full min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Synthèse du groupe..."
              value={synthesisText}
              onChange={(event) => updateSynthesis(event.target.value)}
            />
          </div>
        </>
      )}
    </WorkshopStepLayout>
  );
}
