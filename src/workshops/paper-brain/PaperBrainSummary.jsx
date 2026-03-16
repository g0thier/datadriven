import { useMemo } from "react";

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

function formatCount(value, singular, plural) {
  return `${value} ${value > 1 ? plural : singular}`;
}

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

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi n'a pas été renseigné pendant l'atelier.";

  const rankedNotes = useMemo(() => {
    return notes
      .map((note) => {
        const stickers = votesByNote[note.id];
        const stickerCount = stickers instanceof Set ? stickers.size : 0;
        const comments = commentsByNote[note.id] || [];

        return {
          ...note,
          stickerCount,
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
  }, [commentsByNote, notes, votesByNote]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">{sessionTitle}</h1>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Demande formulée</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
        </div>

        {!!syncError && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {syncError}
          </p>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Résultats votés ({rankedNotes.length})
          </h2>

          {rankedNotes.length === 0 ? (
            <p className="text-gray-500">
              Aucune note n'a reçu de gommette pendant la priorisation.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rankedNotes.map((note, index) => (
                <article
                  key={note.id}
                  className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-37.5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-600">#{index + 1}</span>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {formatCount(note.stickerCount, "gommette", "gommettes")}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                        {formatCount(note.commentCount, "commentaire", "commentaires")}
                      </span>
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
        </div>
      </div>
    </div>
  );
}
