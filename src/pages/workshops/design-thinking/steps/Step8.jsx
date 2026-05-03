/**
 * @module workshops/design-thinking/steps/Step8
 * @description Design Thinking step 8 screen for read-only prototyping board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

function buildGridPosition(index = 0) {
  const col = index % 5;
  const row = Math.floor(index / 5);

  return {
    x: 40 + col * 290,
    y: 40 + row * 220,
  };
}

function normalizePosition(position = {}, fallback = buildGridPosition(0)) {
  const x = Number(position?.x);
  const y = Number(position?.y);

  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
}

/**
 * Renders Design Thinking step 8 (prototyping) with a read-only board.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 8 screen.
 */
function Step8({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = collaboration?.commentsByNote || {};
  const votesByNote = collaboration?.votesByNote || {};

  const currentParticipantId = collaboration?.participant?.id || "";
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.problemStatement || "").trim() ||
    "La problématique sera visible ici dès qu'elle est définie à l'étape 3.";

  const [zoom, setZoom] = useState(50);
  const scale = zoom / 100;

  const notesWithPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition: normalizePosition(note.position, buildGridPosition(index)),
    }));
  }, [notes]);

  const CANVAS_WIDTH = 2800;
  const CANVAS_HEIGHT = 1600;

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
        <div className="flex items-center justify-end mb-3">
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
            Les notes apparaîtront ici dès qu'elles seront créées en étape 4.
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

                return (
                  <div
                    key={note.id}
                    className="absolute select-none touch-none"
                    style={{
                      transform: `translate(${note.displayPosition.x * scale}px, ${note.displayPosition.y *
                        scale}px) scale(${scale})`,
                      transformOrigin: "top left",
                      width: 260,
                    }}
                  >
                    <div className="relative rounded-lg shadow-md p-4 bg-yellow-100">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs text-gray-500"></span>

                        <div className="flex items-center gap-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              hasMine
                                ? "bg-green-500"
                                : "bg-transparent border border-green-300"
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

                      {!!comments.length && (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
