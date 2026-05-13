/**
 * @module components/workshops/RankedVotingNotes
 * @description Shared ranked voted notes list for workshop summary screens.
 */

export default function RankedVotingNotes({
  rankedNotes = [],
  emptyMessage,
  noteClassName = "bg-yellow-100",
}) {
  if (!Array.isArray(rankedNotes) || rankedNotes.length === 0) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
      {rankedNotes.map((note, index) => (
        <article
          key={note.id}
          className={`relative ${noteClassName} rounded-lg shadow-md p-4 min-h-37.5 flex flex-col`}
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
                <div key={comment.id} className="bg-violet-50 border border-violet-100 rounded-lg p-2">
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
  );
}
