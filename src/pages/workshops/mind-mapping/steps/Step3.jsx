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

const SUBNOTE_WIDTH = 120;
const SUBNOTE_HEIGHT = 120;
const SUBNOTE_GAP = 48;

const MIN_NOTE_RING_RADIUS = 340;
const MAX_NOTE_RING_RADIUS = Math.min(CENTER_X, CENTER_Y) - 240;

const MIN_SUBNOTE_RING_RADIUS = 170;
const MAX_SUBNOTE_RING_RADIUS = 300;
const CHALLENGE_ESTIMATED_HEIGHT = 160;
const MAIN_RING_PAIR_GAP = 24;
const MAIN_RING_CHALLENGE_GAP = 28;
const SUBNOTE_CLUSTER_PADDING = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeRingRadius({
  itemCount,
  itemWidth,
  gap,
  minRadius,
  maxRadius,
}) {
  if (itemCount <= 1) return minRadius;

  const requiredCircumference = itemCount * (itemWidth + gap);
  const adaptiveRadius = requiredCircumference / (2 * Math.PI);

  return Math.max(minRadius, Math.min(maxRadius, adaptiveRadius));
}

function buildRadialPosition({
  index,
  total,
  radius,
  centerX,
  centerY,
  itemWidth,
  itemHeight,
}) {
  if (total <= 0) {
    return {
      x: centerX - itemWidth / 2,
      y: centerY - itemHeight / 2,
    };
  }

  const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;

  return {
    x: centerX + radius * Math.cos(angle) - itemWidth / 2,
    y: centerY + radius * Math.sin(angle) - itemHeight / 2,
  };
}

function computeMainRingRadius({
  noteCount,
  noteFootprints = [],
  baseRadius,
  minRadius,
  maxRadius,
  challengeHalfDiagonal,
}) {
  if (noteCount <= 0) return minRadius;

  const maxFootprint = noteFootprints.reduce((maxValue, value) => Math.max(maxValue, value), 0);
  const requiredByChallenge = challengeHalfDiagonal + maxFootprint + MAIN_RING_CHALLENGE_GAP;

  let requiredByPairs = minRadius;
  if (noteCount > 1) {
    const denominator = 2 * Math.sin(Math.PI / noteCount);

    if (denominator > 0) {
      for (let index = 0; index < noteCount; index += 1) {
        const nextIndex = (index + 1) % noteCount;
        const required = (noteFootprints[index] + noteFootprints[nextIndex] + MAIN_RING_PAIR_GAP) / denominator;
        requiredByPairs = Math.max(requiredByPairs, required);
      }
    }
  }

  const required = Math.max(baseRadius, requiredByChallenge, requiredByPairs, minRadius);
  return clamp(required, minRadius, maxRadius);
}

function Step3({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = useMemo(
    () => collaboration?.commentsByNote || {},
    [collaboration?.commentsByNote]
  );
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici des qu'il est defini a l'etape 1.";

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

  const noteRingRadius = useMemo(
    () => {
      const noteCount = notes.length;

      const baseRadius = computeRingRadius({
        itemCount: noteCount,
        itemWidth: NOTE_WIDTH,
        gap: NOTE_GAP,
        minRadius: MIN_NOTE_RING_RADIUS,
        maxRadius: MAX_NOTE_RING_RADIUS,
      });

      const subnoteHalfDiagonal = Math.hypot(SUBNOTE_WIDTH / 2, SUBNOTE_HEIGHT / 2);
      const noteHalfDiagonal = Math.hypot(NOTE_WIDTH / 2, NOTE_HEIGHT / 2);

      const noteFootprints = notes.map((note) => {
        const comments = commentsByNote[note.id] || [];
        const subnoteRingRadius = computeRingRadius({
          itemCount: comments.length,
          itemWidth: SUBNOTE_WIDTH,
          gap: SUBNOTE_GAP,
          minRadius: MIN_SUBNOTE_RING_RADIUS,
          maxRadius: MAX_SUBNOTE_RING_RADIUS,
        });

        const subnoteClusterFootprint =
          subnoteRingRadius + subnoteHalfDiagonal + SUBNOTE_CLUSTER_PADDING;

        return Math.max(noteHalfDiagonal, subnoteClusterFootprint);
      });

      const challengeHalfDiagonal = Math.hypot(
        CHALLENGE_WIDTH / 2,
        CHALLENGE_ESTIMATED_HEIGHT / 2
      );

      return computeMainRingRadius({
        noteCount,
        noteFootprints,
        baseRadius,
        minRadius: MIN_NOTE_RING_RADIUS,
        maxRadius: MAX_NOTE_RING_RADIUS,
        challengeHalfDiagonal,
      });
    },
    [commentsByNote, notes]
  );
  const noteRingDiameter = noteRingRadius * 2;

  const notesWithDisplayPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition: buildRadialPosition({
        index,
        total: notes.length,
        radius: noteRingRadius,
        centerX: CENTER_X,
        centerY: CENTER_Y,
        itemWidth: NOTE_WIDTH,
        itemHeight: NOTE_HEIGHT,
      }),
    }));
  }, [noteRingRadius, notes]);

  const totalSubnotes = useMemo(
    () =>
      Object.values(commentsByNote).reduce((count, comments) => {
        if (!Array.isArray(comments)) return count;
        return count + comments.length;
      }, 0),
    [commentsByNote]
  );

  const addComment = (noteId) => {
    if (isLoading) return;
    collaboration?.actions?.addComment?.(noteId, "");
  };

  const updateComment = (noteId, commentId, value) => {
    if (isLoading) return;

    const currentValue = String(
      (commentsByNote[noteId] || []).find((comment) => comment.id === commentId)?.text || ""
    );
    if (currentValue === value) return;

    collaboration?.actions?.updateCommentText?.(noteId, commentId, value);
  };

  const removeComment = (noteId, commentId) => {
    if (isLoading) return;
    collaboration?.actions?.removeComment?.(noteId, commentId);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {notes.length} categories • {totalSubnotes} idées
          </p>

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
                transform: `translate(${(CENTER_X - noteRingRadius) * scale}px, ${(CENTER_Y - noteRingRadius) *
                  scale}px) scale(${scale})`,
                transformOrigin: "top left",
                width: noteRingDiameter,
                height: noteRingDiameter,
                zIndex: 0,
              }}
            />

            <div
              className="absolute select-none touch-none z-30 hover:z-50"
              style={{
                transform: `translate(${(CENTER_X - CHALLENGE_WIDTH / 2) * scale}px, ${(CENTER_Y - 90) *
                  scale}px) scale(${scale})`,
                transformOrigin: "top left",
                width: CHALLENGE_WIDTH,
              }}
            >
              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-md p-6 min-h-40">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Challenge</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{challenge}</p>
              </div>
            </div>

            {notesWithDisplayPosition.map((note) => {
              const comments = commentsByNote[note.id] || [];
              const noteCenterX = note.displayPosition.x + NOTE_WIDTH / 2;
              const noteCenterY = note.displayPosition.y + NOTE_HEIGHT / 2;

              const subnoteRingRadius = computeRingRadius({
                itemCount: comments.length,
                itemWidth: SUBNOTE_WIDTH,
                gap: SUBNOTE_GAP,
                minRadius: MIN_SUBNOTE_RING_RADIUS,
                maxRadius: MAX_SUBNOTE_RING_RADIUS,
              });
              const subnoteRingDiameter = subnoteRingRadius * 2;

              return (
                <div key={note.id}>
                  {!!comments.length && (
                    <div
                      className="absolute rounded-full border border-dashed border-blue-300/70 pointer-events-none"
                      style={{
                        transform: `translate(${(noteCenterX - subnoteRingRadius) * scale}px, ${(noteCenterY -
                          subnoteRingRadius) *
                          scale}px) scale(${scale})`,
                        transformOrigin: "top left",
                        width: subnoteRingDiameter,
                        height: subnoteRingDiameter,
                        zIndex: 5,
                      }}
                    />
                  )}

                  {comments.map((comment, commentIndex) => {
                    const displayPosition = buildRadialPosition({
                      index: commentIndex,
                      total: comments.length,
                      radius: subnoteRingRadius,
                      centerX: noteCenterX,
                      centerY: noteCenterY,
                      itemWidth: SUBNOTE_WIDTH,
                      itemHeight: SUBNOTE_HEIGHT,
                    });

                    return (
                      <div
                        key={comment.id}
                        className="absolute select-none touch-none z-10 hover:z-50 focus-within:z-50"
                        style={{
                          transform: `translate(${displayPosition.x * scale}px, ${displayPosition.y *
                            scale}px) scale(${scale})`,
                          transformOrigin: "top left",
                          width: SUBNOTE_WIDTH,
                        }}
                      >
                        <div className="relative bg-blue-100 border border-blue-200 rounded-lg shadow-sm p-3 h-30 flex flex-col">
                          <textarea
                            className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800 text-xs"
                            placeholder="Ecrivez une idée..."
                            value={comment.text || ""}
                            onChange={(event) =>
                              updateComment(note.id, comment.id, event.target.value)
                            }
                          />

                          <button
                            type="button"
                            onClick={() => removeComment(note.id, comment.id)}
                            className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500 text-xs"
                            aria-label="Supprimer la idée"
                          >
                            x
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className="absolute select-none touch-none z-20 hover:z-50 focus-within:z-50"
                    style={{
                      transform: `translate(${note.displayPosition.x * scale}px, ${note.displayPosition.y *
                        scale}px) scale(${scale})`,
                      transformOrigin: "top left",
                      width: NOTE_WIDTH,
                    }}
                  >
                    <div className="relative bg-yellow-100 border border-yellow-200 rounded-lg shadow-md p-4 h-40 flex flex-col">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {note.text || <span className="text-gray-400">-</span>}
                      </p>

                      <button
                        type="button"
                        onClick={() => addComment(note.id)}
                        disabled={isLoading}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-violet-500 text-white text-sm flex items-center justify-center shadow-md hover:bg-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Ajouter une idée"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}

export default Step3;
