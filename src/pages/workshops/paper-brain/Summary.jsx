import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
import WorkshopInfoCard from "../../../components/workshops/WorkshopInfoCard.jsx";
import WorkshopSyncErrorAlert from "../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/paper-brain/PaperBrainSummary
 * @description Workshop-specific summary view for the Paper Brain workflow.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo } from "react";

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

/**
 * Renders the Paper Brain workshop summary screen.
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Workshop session title.
 * @param {Object} props.collaboration - Collaboration state from usePaperBrainCollaboration.
 * @returns {JSX.Element} The rendered Paper Brain summary.
 *
 * @example
 * import PaperBrainSummary from "./paper-brain/Summary.jsx";
 *
 * // Real usage reference: src/pages/workshops/WorkshopSummaryPage.jsx
 * <PaperBrainSummary sessionTitle={sessionTitle} collaboration={collaboration} />;
 */
export default function PaperBrainSummary({ sessionTitle, collaboration }) {
  const notes = Array.isArray(collaboration?.notes) ? collaboration.notes : EMPTY_ARRAY;
  const commentsByNote =
    collaboration?.commentsByNote && typeof collaboration.commentsByNote === "object"
      ? collaboration.commentsByNote
      : EMPTY_OBJECT;
  const votesByNote =
    collaboration?.votesByNote && typeof collaboration.votesByNote === "object"
      ? collaboration.votesByNote
      : EMPTY_OBJECT;
  const syncError = collaboration?.syncError || "";
  const currentParticipantId = collaboration?.participant?.id || "";

  const challenge =
    String(collaboration?.description || "").trim() ||
    "Le défi n'a pas été renseigné pendant l'atelier.";

  const rankedNotes = useMemo(() => {
    return notes
      .map((note) => {
        const stickerSet = votesByNote[note.id];
        const stickerCount = stickerSet instanceof Set ? stickerSet.size : 0;
        const hasMine =
          stickerSet instanceof Set && currentParticipantId
            ? stickerSet.has(currentParticipantId)
            : false;
        const otherCount = Math.max(0, stickerCount - (hasMine ? 1 : 0));
        const comments = commentsByNote[note.id] || [];

        return {
          ...note,
          stickerCount,
          hasMine,
          otherCount,
          comments,
          commentCount: comments.length,
        };
      })
      .filter((note) => note.stickerCount > 0)
      .sort((a, b) => {
        if (b.stickerCount !== a.stickerCount) {
          return b.stickerCount - a.stickerCount;
        }

        if (b.commentCount !== a.commentCount) {
          return b.commentCount - a.commentCount;
        }

        if (a.createdAt !== b.createdAt) {
          return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
        }

        return String(a.id || "").localeCompare(String(b.id || ""));
      });
  }, [commentsByNote, currentParticipantId, notes, votesByNote]);

  return (
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>

      <WorkshopInfoCard title="Sujet de l'atelier" className="mb-6">
        <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
      </WorkshopInfoCard>

      <WorkshopSyncErrorAlert message={syncError} className="mb-4" />

      <WorkshopInfoCard title={`Résultats votés (${rankedNotes.length})`}>

          {rankedNotes.length === 0 ? (
            <p className="text-gray-500">
              Aucune note n'a reçu de gommette pendant la priorisation.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
              {rankedNotes.map((note, index) => (
                <article
                  key={note.id}
                  className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-37.5 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-600">#{index + 1}</span>

                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            note.hasMine ? "bg-green-500" : "bg-transparent border border-green-300"
                          }`}
                          title={note.hasMine ? "Ta gommette" : "Pas de gommette"}
                        />

                        {Array.from({ length: note.otherCount }).map((_, stickerIndex) => (
                          <div
                            key={stickerIndex}
                            className="w-3 h-3 rounded-full bg-blue-500"
                            title="Gommette d'un autre participant"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {note.text || <span className="text-gray-400">—</span>}
                  </p>

                  {!!note.commentCount && (
                    <div className="mt-3 space-y-2">
                      {note.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-violet-50 border border-violet-100 rounded-lg p-2"
                        >
                          <p className="text-violet-700 text-xs whitespace-pre-wrap">
                            {comment.text || <span className="text-violet-300">—</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
        )}
      </WorkshopInfoCard>
    </WorkshopSummaryLayout>
  );
}
