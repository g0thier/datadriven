/**
 * @module components/workshops/VotingNotes
 * @description Shared workshop screen for note prioritization with stickers.
 */

import { useMemo, useState } from "react";
import WorkshopStepLayout from "../../pages/workshops/WorkshopStepLayout.jsx";
import WorkshopSyncErrorAlert from "./WorkshopSyncErrorAlert.jsx";
import {
  buildGridPosition,
  normalizePosition,
} from "./workshopBoardGeometry.js";

const CANVAS_WIDTH = 2800;
const CANVAS_HEIGHT = 1600;
const DEFAULT_CHALLENGE_FALLBACK = "Le sujet de l'atelier sera affiché ici dès qu'il sera renseigné.";
const DEFAULT_EMPTY_MESSAGE = "Les contributions apparaîtront ici dès qu'elles seront ajoutées.";

function resolveChallengeText({ collaboration, fieldName, fallbackText }) {
  const value = String(collaboration?.[fieldName] || "").trim();
  return value || fallbackText;
}

export default function VotingNotes({ step, sessionTitle, collaboration }) {
  const notesField = String(step?.notesField || "notes");
  const notes = useMemo(() => {
    const candidate = collaboration?.[notesField];
    return Array.isArray(candidate) ? candidate : [];
  }, [collaboration, notesField]);

  const commentsByNote =
    collaboration?.commentsByNote && typeof collaboration.commentsByNote === "object"
      ? collaboration.commentsByNote
      : {};
  const votesByNote =
    collaboration?.votesByNote && typeof collaboration.votesByNote === "object"
      ? collaboration.votesByNote
      : {};

  const currentParticipantId = collaboration?.participant?.id || "";
  const remainingVotes = Number.isFinite(collaboration?.remainingVotes)
    ? collaboration.remainingVotes
    : 0;
  const maxStickers = Number.isFinite(collaboration?.maxStickers)
    ? collaboration.maxStickers
    : 3;

  const syncError = collaboration?.syncError || "";

  const challengeField = String(step?.challengeField || "description");
  const challengeFallback = String(step?.challengeFallback || "").trim() || DEFAULT_CHALLENGE_FALLBACK;
  const challenge = resolveChallengeText({
    collaboration,
    fieldName: challengeField,
    fallbackText: challengeFallback,
  });

  const gridConfig =
    step?.gridPositionConfig && typeof step.gridPositionConfig === "object"
      ? step.gridPositionConfig
      : {};

  const [zoom, setZoom] = useState(100);
  const scale = zoom / 100;

  const notesWithPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition: normalizePosition(note.position, buildGridPosition(index, gridConfig)),
    }));
  }, [gridConfig, notes]);

  const toggleVoteActionName = String(step?.toggleVoteAction || "toggleVote");

  const toggleSticker = (noteId, hasMine) => {
    if (!hasMine && remainingVotes <= 0) return;
    collaboration?.actions?.[toggleVoteActionName]?.(noteId);
  };

  const emptyMessage = String(step?.emptyMessage || "").trim() || DEFAULT_EMPTY_MESSAGE;

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Gommettes à distribuer :</span>

            <div className="flex items-center gap-1">
              {Array.from({ length: maxStickers }).map((_, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full ${
                    index < remainingVotes ? "bg-green-400" : "bg-green-200"
                  }`}
                  title={index < remainingVotes ? "Disponible" : "Déjà utilisée"}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-12 text-right">{zoom}%</span>

            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-40 accent-slate-600"
            />
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-8 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="w-full overflow-auto rounded-xl border border-slate-200">
            <div
              className="relative origin-top-left"
              style={{
                width: CANVAS_WIDTH * scale,
                height: CANVAS_HEIGHT * scale,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.08) 1px, transparent 1px)",
                  backgroundSize: `${60 * scale}px ${60 * scale}px`,
                }}
              />

              {notesWithPosition.map((note) => {
                const stickerSet = votesByNote[note.id] || new Set();
                const hasMine = stickerSet.has(currentParticipantId);
                const otherCount = Math.max(0, stickerSet.size - (hasMine ? 1 : 0));
                const comments = commentsByNote[note.id] || [];
                const isDisabled = !hasMine && remainingVotes <= 0;

                return (
                  <div
                    key={note.id}
                    className="absolute select-none touch-none"
                    style={{
                      transform: `translate(${note.displayPosition.x * scale}px, ${
                        note.displayPosition.y * scale
                      }px) scale(${scale})`,
                      transformOrigin: "top left",
                      width: 260,
                    }}
                  >
                    <div
                      className={`relative rounded-lg shadow-md p-4 ${
                        isDisabled ? "bg-yellow-50" : "bg-yellow-100 cursor-pointer"
                      }`}
                      title="Cliquer pour ajouter/retirer une gommette"
                      onClick={() => toggleSticker(note.id, hasMine)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs text-gray-500"></span>

                        <div className="flex items-center gap-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              hasMine ? "bg-green-500" : "bg-transparent border border-green-300"
                            }`}
                            title={hasMine ? "Ta gommette" : "Pas de gommette"}
                          />

                          {Array.from({ length: otherCount }).map((_, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-full bg-blue-500"
                              title="Gommette d'un autre participant"
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {note.text || <span className="text-gray-400">—</span>}
                      </p>

                      {comments.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-violet-50 border border-violet-100 rounded-lg p-2"
                            >
                              <p className="text-violet-700 text-xs whitespace-pre-wrap">
                                {comment.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </WorkshopStepLayout>
  );
}
