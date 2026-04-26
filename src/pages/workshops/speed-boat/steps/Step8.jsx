/**
 * @module workshops/speed-boat/steps/Step8
 * @description Speed Boat step 8 screen for final overview with full boat visual and lever board.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo, useState } from "react";
import speedBoatFullImg from "../../../../assets/workshops/speed-boat/speed-boat-full.png";
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
 * Renders Speed Boat step 8 (final action plan visual review).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 8 screen.
 */
export default function Step8({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.leverNotes ?? [], [collaboration?.leverNotes]);
  const syncError = collaboration?.syncError || "";

  const challenge = String(collaboration?.step1Description || "").trim() || "...";
  const objective = String(collaboration?.step2Objective || "").trim() || "...";

  const [zoom, setZoom] = useState(20);
  const scale = zoom / 100;

  const notesWithDisplayPosition = useMemo(() => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden relative min-h-64 md:min-h-0 md:h-full">
          <img
            src={speedBoatFullImg}
            alt="Bateau Speed Boat complet"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">{notes.length} leviers</p>

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
              Les leviers apparaîtront ici dès qu'ils seront créés en étape 5.
            </div>
          ) : (
            <div className="w-full aspect-square overflow-auto rounded-xl border border-slate-200">
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

                {notesWithDisplayPosition.map((note) => (
                  <div
                    key={note.id}
                    className="absolute select-none"
                    style={{
                      transform: `translate(${note.displayPosition.x * scale}px, ${
                        note.displayPosition.y * scale
                      }px) scale(${scale})`,
                      transformOrigin: "top left",
                      width: 260,
                    }}
                  >
                    <div className="relative bg-blue-100 rounded-lg shadow-md p-4">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {note.text || <span className="text-gray-400">—</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </WorkshopStepLayout>
  );
}
