import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const CANVAS_WIDTH = 3600;
const CANVAS_HEIGHT = 2400;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

const CHALLENGE_WIDTH = 230;
const NOTE_WIDTH = 230;
const NOTE_HEIGHT = 160;
const NOTE_GAP = 44;

const MIN_RADIUS = 340;
const MAX_RADIUS = Math.min(CENTER_X, CENTER_Y) - 240;

function computeRingRadius(noteCount) {
  if (noteCount <= 1) return MIN_RADIUS;

  const requiredCircumference = noteCount * (NOTE_WIDTH + NOTE_GAP);
  const adaptiveRadius = requiredCircumference / (2 * Math.PI);

  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, adaptiveRadius));
}

function buildRadialPosition(index, total, radius) {
  if (total <= 0) {
    return {
      x: CENTER_X - NOTE_WIDTH / 2,
      y: CENTER_Y - NOTE_HEIGHT / 2,
    };
  }

  const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;

  return {
    x: CENTER_X + radius * Math.cos(angle) - NOTE_WIDTH / 2,
    y: CENTER_Y + radius * Math.sin(angle) - NOTE_HEIGHT / 2,
  };
}

function Step2({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.description || "").trim() ||
    "Le sujet sera visible ici dès qu'il est défini à l'étape 1.";

  const [zoom, setZoom] = useState(100);
  const scale = zoom / 100;

  const scrollContainerRef = useRef(null);
  const hasCenteredInitialViewRef = useRef(false);

  useEffect(() => {
    if (hasCenteredInitialViewRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollLeft = Math.max(0, (CANVAS_WIDTH * scale - container.clientWidth) / 2);
    container.scrollTop = Math.max(0, (CANVAS_HEIGHT * scale - container.clientHeight) / 2);
    hasCenteredInitialViewRef.current = true;
  }, [scale]);

  const ringRadius = useMemo(() => computeRingRadius(notes.length), [notes.length]);
  const ringDiameter = ringRadius * 2;

  const notesWithDisplayPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition: buildRadialPosition(index, notes.length, ringRadius),
    }));
  }, [notes, ringRadius]);

  const addEmptyNote = () => {
    if (isLoading) return;
    collaboration?.actions?.addNote?.({ text: "" });
  };

  const updateNote = (noteId, value) => {
    if (isLoading) return;

    const currentValue = String(notes.find((note) => note.id === noteId)?.text || "");
    if (currentValue === value) return;

    collaboration?.actions?.updateNoteText?.(noteId, value);
  };

  const removeNote = (noteId) => {
    if (isLoading) return;
    collaboration?.actions?.removeNote?.(noteId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">{notes.length} branches</p>

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

        <div
          ref={scrollContainerRef}
          className="w-full aspect-square overflow-auto rounded-xl border border-slate-200"
        >
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

            <div
              className="absolute rounded-full border-2 border-dashed border-violet-300/80 pointer-events-none"
              style={{
                transform: `translate(${(CENTER_X - ringRadius) * scale}px, ${(CENTER_Y - ringRadius) *
                  scale}px) scale(${scale})`,
                transformOrigin: "top left",
                width: ringDiameter,
                height: ringDiameter,
              }}
            />

            <div
              className="absolute select-none touch-none"
              style={{
                transform: `translate(${(CENTER_X - CHALLENGE_WIDTH / 2) * scale}px, ${(CENTER_Y - 90) *
                  scale}px) scale(${scale})`,
                transformOrigin: "top left",
                width: CHALLENGE_WIDTH,
              }}
            >
              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-md p-6 min-h-40">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Défi</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{challenge}</p>

                <button
                  type="button"
                  onClick={addEmptyNote}
                  disabled={isLoading}
                  className="absolute bottom-3 right-3 w-8 h-8 -mb-5 -mr-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Ajouter une branche"
                >
                  +
                </button>
              </div>
            </div>

            {notesWithDisplayPosition.map((note) => (
              <div
                key={note.id}
                className="absolute select-none touch-none"
                style={{
                  transform: `translate(${note.displayPosition.x * scale}px, ${note.displayPosition.y *
                    scale}px) scale(${scale})`,
                  transformOrigin: "top left",
                  width: NOTE_WIDTH,
                }}
              >
                <div className="relative bg-yellow-100 border border-yellow-200 rounded-lg shadow-md p-4 h-40 flex flex-col">
                  <textarea
                    className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800 text-sm"
                    placeholder="Écrivez une catégorie..."
                    value={note.text || ""}
                    onChange={(event) => updateNote(note.id, event.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                    aria-label="Supprimer la note"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}

export default Step2;
