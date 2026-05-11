/**
 * @module workshops/world-coffee/WorldCoffeeRestitutionView
 * @description Read-only restitution view reused by World Cafe step 7 and summary.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo, useState } from "react";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});
const buildIdeaReplyKey = (ideaId) => `idea-${String(ideaId || "").trim()}`;

/**
 * Renders the World Cafe restitution content in read-only mode.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.collaboration - Collaboration payload from useWorldCoffeeCollaboration.
 * @returns {JSX.Element} Read-only restitution view.
 */
export default function WorldCoffeeRestitutionView({ collaboration }) {
  const syncError = collaboration?.syncError || "";
  const [openIdeasBySubgroupIds, setOpenIdeasBySubgroupIds] = useState(() => new Set());

  const subgroups = Array.isArray(collaboration?.subgroups)
    ? collaboration.subgroups
    : EMPTY_ARRAY;
  const descriptions = Array.isArray(collaboration?.descriptions)
    ? collaboration.descriptions
    : EMPTY_ARRAY;
  const ideasBySubgroup =
    collaboration?.ideasBySubgroup && typeof collaboration.ideasBySubgroup === "object"
      ? collaboration.ideasBySubgroup
      : EMPTY_OBJECT;
  const commentsByIdea =
    collaboration?.commentsByIdea && typeof collaboration.commentsByIdea === "object"
      ? collaboration.commentsByIdea
      : EMPTY_OBJECT;
  const repliesByComment =
    collaboration?.repliesByComment && typeof collaboration.repliesByComment === "object"
      ? collaboration.repliesByComment
      : EMPTY_OBJECT;
  const synthesisBySubgroup =
    collaboration?.synthesisBySubgroup && typeof collaboration.synthesisBySubgroup === "object"
      ? collaboration.synthesisBySubgroup
      : EMPTY_OBJECT;

  const descriptionsById = useMemo(() => {
    return descriptions.reduce((accumulator, description) => {
      accumulator[description.id] = description;
      return accumulator;
    }, {});
  }, [descriptions]);

  const toggleIdeasBySubgroup = (subgroupId) => {
    const cleanedSubgroupId = String(subgroupId || "").trim();
    if (!cleanedSubgroupId) return;

    setOpenIdeasBySubgroupIds((currentOpenIds) => {
      const nextOpenIds = new Set(currentOpenIds);

      if (nextOpenIds.has(cleanedSubgroupId)) {
        nextOpenIds.delete(cleanedSubgroupId);
      } else {
        nextOpenIds.add(cleanedSubgroupId);
      }

      return nextOpenIds;
    });
  };

  return (
    <>
      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {subgroups.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
          Aucun sous-groupe disponible pour la restitution.
        </div>
      ) : (
        <div className="space-y-6">
          {subgroups.map((subgroup) => {
            const subgroupId = String(subgroup?.id || "").trim();
            const panelId = subgroupId ? `subgroup-ideas-panel-${subgroupId}` : "";
            const buttonId = subgroupId ? `subgroup-ideas-trigger-${subgroupId}` : "";
            const areIdeasExpanded = subgroupId ? openIdeasBySubgroupIds.has(subgroupId) : false;
            const subgroupIdeas = (ideasBySubgroup[subgroup.id] || EMPTY_ARRAY).filter(
              (idea) => !idea?.roundId || String(idea.roundId).trim() === "round-1"
            );
            const subgroupSynthesisText = String(
              synthesisBySubgroup?.[subgroup.id]?.text || ""
            ).trim();
            const subgroupDescription = descriptionsById[subgroup.descriptionId]?.text || "";

            return (
              <article key={subgroup.id} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-800">
                    {subgroup?.label || "Sous-groupe"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {Array.isArray(subgroup?.participantIds) ? subgroup.participantIds.length : 0} personnes
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-600 mb-1">Sujet</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {subgroupDescription || <span className="text-gray-400">Sujet non défini.</span>}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Synthèse</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {subgroupSynthesisText || <span className="text-gray-400">Aucune synthèse rédigée.</span>}
                  </p>
                </div>

                {subgroupIdeas.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-gray-500 text-center">
                    Aucune idée pour ce sous-groupe.
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <button
                      id={buttonId}
                      type="button"
                      className="w-full flex items-center justify-between gap-3 text-left"
                      onClick={() => toggleIdeasBySubgroup(subgroupId)}
                      aria-expanded={areIdeasExpanded}
                      aria-controls={panelId}
                    >
                      <span className="text-xs uppercase tracking-wide text-violet-700">Idées</span>
                      <span className="flex items-center gap-2 text-xs text-violet-700">
                        <span>{subgroupIdeas.length}</span>
                        <span aria-hidden="true" className="text-sm">
                          {areIdeasExpanded ? "▾" : "▸"}
                        </span>
                      </span>
                    </button>

                    {areIdeasExpanded && (
                      <div id={panelId} role="region" aria-labelledby={buttonId} className="mt-2">
                        <ul className="space-y-4">
                          {subgroupIdeas.map((idea) => {
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
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                  {idea.text || <span className="text-gray-400">-</span>}
                                </p>

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
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
