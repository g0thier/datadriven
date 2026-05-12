/**
 * @module workshops/speed-boat/steps/Step7
 * @description Speed Boat step 7 screen for voting and prioritization on brake notes.
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
 * Renders Speed Boat step 7 (brake prioritization with stickers).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 7 screen.
 */
export default function Step7({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.brakeNotes ?? [], [collaboration?.brakeNotes]);
  const votesByNote = collaboration?.votesByNote || {};
  const currentParticipantId = collaboration?.participant?.id || "";
  const remainingVotes = Number.isFinite(collaboration?.remainingVotes)
    ? collaboration.remainingVotes
    : 0;
  const maxStickers = Number.isFinite(collaboration?.maxStickers)
    ? collaboration.maxStickers
    : 3;
  const syncError = collaboration?.syncError || "";

  const challenge = String(collaboration?.step1Description || "").trim() || "...";
  const objective = String(collaboration?.step2Objective || "").trim() || "...";

  const [zoom, setZoom] = useState(100);
  const scale = zoom / 100;

  const notesWithPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition: normalizePosition(note.position, buildGridPosition(index)),
    }));
  }, [notes]);

  const toggleSticker = (noteId, hasMine) => {
    if (!hasMine && remainingVotes <= 0) return;
    collaboration?.actions?.toggleBrakeVote?.(noteId);
  };

  const CANVAS_WIDTH = 2800;
  const CANVAS_HEIGHT = 1600;

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Défi</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{challenge}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
            Objectif
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{objective}</p>
        </div>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

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
            Les freins apparaîtront ici dès qu'ils seront créés en étape 3.
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
                        isDisabled ? "bg-red-50" : "bg-red-100 cursor-pointer"
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
