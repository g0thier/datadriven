/**
 * @module workshops/design-thinking/DesignThinkingSummary
 * @description Workshop-specific summary view for the Design Thinking workflow.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo } from "react";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});
const DEFAULT_COLUMNS = [
  {
    id: "works",
    label: "Ce qui fonctionne",
    noteBgClass: "bg-green-100",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
  },
  {
    id: "problems",
    label: "Ce qui pose problème",
    noteBgClass: "bg-red-100",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
  },
  {
    id: "improvements",
    label: "Ce qui peut être amélioré",
    noteBgClass: "bg-blue-100",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
  },
];

const groupNotesByColumn = (notes = []) => {
  const grouped = {
    works: [],
    problems: [],
    improvements: [],
  };

  notes.forEach((note) => {
    const columnId = String(note?.columnId || "").trim();
    if (!grouped[columnId]) return;
    grouped[columnId].push(note);
  });

  return grouped;
};

export default function DesignThinkingSummary({ sessionTitle, collaboration }) {
  const notes = Array.isArray(collaboration?.notes) ? collaboration.notes : EMPTY_ARRAY;
  const sharedNotes = Array.isArray(collaboration?.sharedNotes) ? collaboration.sharedNotes : EMPTY_ARRAY;
  const prototypeFeedbackNotes = Array.isArray(collaboration?.prototypeFeedbackNotes)
    ? collaboration.prototypeFeedbackNotes
    : EMPTY_ARRAY;
  const columns = Array.isArray(collaboration?.prototypeFeedbackColumns) &&
    collaboration.prototypeFeedbackColumns.length > 0
    ? collaboration.prototypeFeedbackColumns
    : DEFAULT_COLUMNS;

  const commentsByNote =
    collaboration?.commentsByNote && typeof collaboration.commentsByNote === "object"
      ? collaboration.commentsByNote
      : EMPTY_OBJECT;
  const votesByNote =
    collaboration?.votesByNote && typeof collaboration.votesByNote === "object"
      ? collaboration.votesByNote
      : EMPTY_OBJECT;
  const prototypeFeedbackNotesByColumn =
    collaboration?.prototypeFeedbackNotesByColumn &&
    typeof collaboration.prototypeFeedbackNotesByColumn === "object"
      ? collaboration.prototypeFeedbackNotesByColumn
      : groupNotesByColumn(prototypeFeedbackNotes);

  const syncError = collaboration?.syncError || "";
  const currentParticipantId = collaboration?.participant?.id || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi n'a pas été renseigné pendant l'atelier.";
  const problemStatement =
    String(collaboration?.problemStatement || "").trim() ||
    "La problématique n'a pas été renseignée pendant l'atelier.";
  const conclusion =
    String(collaboration?.conclusion || "").trim() ||
    "La conclusion n'a pas été renseignée pendant l'atelier.";

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">{sessionTitle}</h1>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Définition du défi</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Prises de notes (Empathie)</h2>
          {sharedNotes.length === 0 ? (
            <p className="text-gray-500">Aucune prise de note n'a été renseignée.</p>
          ) : (
            <ul className="space-y-2">
              {sharedNotes.map((note) => (
                <li key={note.id} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" aria-hidden="true" />
                  <p className="whitespace-pre-wrap">{String(note.text || "").trim() || "-"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Problématique</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{problemStatement}</p>
        </div>

        {!!syncError && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {syncError}
          </p>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Meilleures idées ({rankedNotes.length})
          </h2>

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-6">
          {columns.map((column) => {
            const columnNotes = prototypeFeedbackNotesByColumn[column.id] || [];

            return (
              <section
                key={column.id}
                className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{column.label}</h3>

                {columnNotes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucun feedback dans cette colonne pour le moment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {columnNotes.map((note) => (
                      <article
                        key={note.id}
                        className={`rounded-lg shadow-md p-4 min-h-20 ${column.noteBgClass}`}
                      >
                        <p className="text-gray-800 whitespace-pre-wrap text-sm">
                          {String(note.text || "").trim() || "—"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Conclusion</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{conclusion}</p>
        </div>
      </div>
    </div>
  );
}
