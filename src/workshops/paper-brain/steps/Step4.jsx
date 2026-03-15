import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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

function useDragNotes({
  canvasRef,
  getScale,
  onMove,
  onMoveEnd,
  onDragStart,
}) {
  const dragRef = useRef({
    draggingId: null,
    pointerId: null,
    startPointerX: 0,
    startPointerY: 0,
    startX: 0,
    startY: 0,
    noteRect: null,
    latestPosition: null,
  });

  const onPointerDown = (event, noteId) => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const noteElement = event.currentTarget;
    noteElement.setPointerCapture?.(event.pointerId);

    const noteRect = noteElement.getBoundingClientRect();

    const startX = parseFloat(noteElement.dataset.x || "0");
    const startY = parseFloat(noteElement.dataset.y || "0");

    dragRef.current = {
      draggingId: noteId,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX,
      startY,
      noteRect,
      latestPosition: { x: startX, y: startY },
    };

    onDragStart?.(noteId);
  };

  const onPointerMove = (event) => {
    const dragState = dragRef.current;
    if (!dragState.draggingId || dragState.pointerId !== event.pointerId) return;

    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const scale = getScale?.() ?? 1;

    const deltaX = (event.clientX - dragState.startPointerX) / scale;
    const deltaY = (event.clientY - dragState.startPointerY) / scale;

    const canvasWidth = canvasElement.scrollWidth / scale;
    const canvasHeight = canvasElement.scrollHeight / scale;

    const noteWidth = (dragState.noteRect?.width ?? 260) / scale;
    const noteHeight = (dragState.noteRect?.height ?? 180) / scale;

    const nextPosition = {
      x: clamp(dragState.startX + deltaX, 0, canvasWidth - noteWidth),
      y: clamp(dragState.startY + deltaY, 0, canvasHeight - noteHeight),
    };

    dragState.latestPosition = nextPosition;
    onMove?.(dragState.draggingId, nextPosition);
  };

  const onPointerUp = (event) => {
    const dragState = dragRef.current;
    if (!dragState.draggingId || dragState.pointerId !== event.pointerId) return;

    const draggedNoteId = dragState.draggingId;
    const latestPosition = dragState.latestPosition;

    dragRef.current = {
      draggingId: null,
      pointerId: null,
      startPointerX: 0,
      startPointerY: 0,
      startX: 0,
      startY: 0,
      noteRect: null,
      latestPosition: null,
    };

    if (latestPosition) {
      onMoveEnd?.(draggedNoteId, latestPosition);
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}

function Step4({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = collaboration?.commentsByNote || {};
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi sera visible ici dès qu'il est défini à l'étape 1.";

  const [zoom, setZoom] = useState(100);
  const scale = zoom / 100;

  const [localPositions, setLocalPositions] = useState({});
  const draggingNoteIdsRef = useRef(new Set());

  useEffect(() => {
    setLocalPositions((previousPositions) => {
      const nextPositions = { ...previousPositions };
      const activeNoteIds = new Set();

      notes.forEach((note, index) => {
        activeNoteIds.add(note.id);

        const normalizedPosition = normalizePosition(note.position, buildGridPosition(index));

        if (!draggingNoteIdsRef.current.has(note.id)) {
          nextPositions[note.id] = normalizedPosition;
        }
      });

      Object.keys(nextPositions).forEach((noteId) => {
        if (!activeNoteIds.has(noteId)) {
          delete nextPositions[noteId];
        }
      });

      return nextPositions;
    });
  }, [notes]);

  const setNotePositionAction = collaboration?.actions?.setNotePosition;

  const handleMove = useCallback(
    (noteId, position) => {
      setLocalPositions((previousPositions) => ({
        ...previousPositions,
        [noteId]: position,
      }));
    },
    []
  );

  const handleMoveEnd = useCallback(
    (noteId, position) => {
      draggingNoteIdsRef.current.delete(noteId);

      setLocalPositions((previousPositions) => ({
        ...previousPositions,
        [noteId]: position,
      }));

      // Une seule écriture Firebase par drag: au relâché uniquement.
      setNotePositionAction?.(noteId, position);
    },
    [setNotePositionAction]
  );

  const handleDragStart = useCallback((noteId) => {
    draggingNoteIdsRef.current.add(noteId);
  }, []);

  const canvasRef = useRef(null);
  const { onPointerDown, onPointerMove, onPointerUp } = useDragNotes({
    canvasRef,
    getScale: () => scale,
    onMove: handleMove,
    onMoveEnd: handleMoveEnd,
    onDragStart: handleDragStart,
  });

  const notesWithDisplayPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition:
        localPositions[note.id] || normalizePosition(note.position, buildGridPosition(index)),
    }));
  }, [localPositions, notes]);

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
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {notes.length} notes • Glissez-déposez pour organiser
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

        {notes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-8 text-center text-gray-500">
            Les notes apparaîtront ici dès qu'elles seront créées en étape 2.
          </div>
        ) : (
          <div className="w-full overflow-auto rounded-xl border border-slate-200">
            <div
              ref={canvasRef}
              className="relative origin-top-left"
              style={{
                width: CANVAS_WIDTH * scale,
                height: CANVAS_HEIGHT * scale,
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.08) 1px, transparent 1px)",
                  backgroundSize: `${60 * scale}px ${60 * scale}px`,
                }}
              />

              {notesWithDisplayPosition.map((note) => {
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
                    <div
                      className="relative bg-yellow-100 rounded-lg shadow-md p-4"
                      role="button"
                      tabIndex={0}
                      onPointerDown={(event) => onPointerDown(event, note.id)}
                      data-x={note.displayPosition.x}
                      data-y={note.displayPosition.y}
                      title="Glisser pour déplacer"
                    >
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
      </div>
    </WorkshopStepLayout>
  );
}

export default Step4;
