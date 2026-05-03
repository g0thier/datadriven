/**
 * @module workshops/design-thinking/steps/Step8
 * @description Design Thinking step 8 screen for read-only ranked voted notes.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_OBJECT = Object.freeze({});

/**
 * Renders Design Thinking step 8 (prototyping) with ranked voted notes.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 8 screen.
 */
function Step8({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const rawCommentsByNote = collaboration?.commentsByNote;
  const rawVotesByNote = collaboration?.votesByNote;

  const commentsByNote = useMemo(
    () => (rawCommentsByNote && typeof rawCommentsByNote === "object" ? rawCommentsByNote : EMPTY_OBJECT),
    [rawCommentsByNote]
  );
  const votesByNote = useMemo(
    () => (rawVotesByNote && typeof rawVotesByNote === "object" ? rawVotesByNote : EMPTY_OBJECT),
    [rawVotesByNote]
  );

  const currentParticipantId = collaboration?.participant?.id || "";
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.problemStatement || "").trim() ||
    "La problématique sera visible ici dès qu'elle est définie à l'étape 3.";

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
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-md p-4">
        {rankedNotes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-8 text-center text-gray-500">
            Aucune note n'a reçu de gommette pendant la priorisation.
          </div>
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

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            Rappelez-vous : ce prototype doit être testé au plus tôt dans des conditions
            réelles d'usage.
          </p>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}

export default Step8;
