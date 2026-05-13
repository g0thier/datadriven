import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/continue-stop-try/steps/Step3
 * @description Continue Stop Try step 3 screen for collaborative board organization in 3 columns.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useCallback, useMemo, useRef, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const DEFAULT_COLUMNS = [
  {
    id: "continue",
    label: "On continue",
    noteBgClass: "bg-green-100",
    columnBgClass: "bg-green-50/70",
    borderClass: "border-green-200",
  },
  {
    id: "stop",
    label: "On arrête",
    noteBgClass: "bg-red-100",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
  },
  {
    id: "try",
    label: "On tente",
    noteBgClass: "bg-blue-100",
    columnBgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
  },
];

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 1200;
const NOTE_WIDTH = 200;
const NOTE_FALLBACK_HEIGHT = 140;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildGridPosition(index = 0) {
  const col = index % 2;
  const row = Math.floor(index / 2);

  return {
    x: 24 + col * 220,
    y: 24 + row * 170,
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

    const noteWidth = (dragState.noteRect?.width ?? NOTE_WIDTH) / scale;
    const noteHeight = (dragState.noteRect?.height ?? NOTE_FALLBACK_HEIGHT) / scale;

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

const groupNotesByColumn = (notes = []) => {
  const grouped = {
    continue: [],
    stop: [],
    try: [],
  };

  notes.forEach((note) => {
    const columnId = String(note?.columnId || "").trim();
    if (!grouped[columnId]) return;
    grouped[columnId].push(note);
  });

  return grouped;
};

function DraggableColumnBoard({
  column,
  notes,
  localPositions,
  setLocalPositions,
  scale,
  onCommitPosition,
}) {
  const canvasRef = useRef(null);

  const handleMove = useCallback(
    (noteId, position) => {
      setLocalPositions((previousPositions) => ({
        ...previousPositions,
        [noteId]: position,
      }));
    },
    [setLocalPositions]
  );

  const handleMoveEnd = useCallback(
    (noteId, position) => {
      setLocalPositions((previousPositions) => {
        const nextPositions = { ...previousPositions };
        delete nextPositions[noteId];
        return nextPositions;
      });
      onCommitPosition?.(noteId, position);
    },
    [onCommitPosition, setLocalPositions]
  );

  const { onPointerDown, onPointerMove, onPointerUp } = useDragNotes({
    canvasRef,
    getScale: () => scale,
    onMove: handleMove,
    onMoveEnd: handleMoveEnd,
  });

  const notesWithDisplayPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition:
        localPositions[note.id] || normalizePosition(note.position, buildGridPosition(index)),
    }));
  }, [localPositions, notes]);

  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-8 text-center text-gray-500 bg-white">
        Aucune note disponible dans cette colonne pour le moment.
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto rounded-xl border border-slate-200 bg-white">
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
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.08) 1px, transparent 1px)",
            backgroundSize: `${56 * scale}px ${56 * scale}px`,
          }}
        />

        {notesWithDisplayPosition.map((note) => (
          <div
            key={note.id}
            className="absolute select-none touch-none"
            style={{
              transform: `translate(${note.displayPosition.x * scale}px, ${
                note.displayPosition.y * scale
              }px) scale(${scale})`,
              transformOrigin: "top left",
              width: NOTE_WIDTH,
            }}
          >
            <div
              className={`relative rounded-lg shadow-md p-4 min-h-28 ${column.noteBgClass}`}
              onPointerDown={(event) => onPointerDown(event, note.id)}
              data-x={note.displayPosition.x}
              data-y={note.displayPosition.y}
              title="Glisser pour déplacer"
            >
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {note.text || <span className="text-gray-400">—</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3({ step, sessionTitle, collaboration }) {
  const columns = Array.isArray(collaboration?.columns) && collaboration.columns.length > 0
    ? collaboration.columns
    : DEFAULT_COLUMNS;

  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const notesByColumn =
    collaboration?.notesByColumn && typeof collaboration.notesByColumn === "object"
      ? collaboration.notesByColumn
      : groupNotesByColumn(notes);

  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.description || "").trim() ||
    "Le défi sera visible ici dès qu'il est défini à l'étape 1.";

  const [zoom, setZoom] = useState(50);
  const scale = zoom / 100;

  const [localPositions, setLocalPositions] = useState({});

  const setNotePositionAction = collaboration?.actions?.setNotePosition;

  const handleMoveEnd = useCallback(
    (noteId, position) => {
      setNotePositionAction?.(noteId, position);
    },
    [setNotePositionAction]
  );

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <div className="flex items-center justify-end mb-3 gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((column) => {
          const columnNotes = notesByColumn[column.id] || [];

          return (
            <section
              key={column.id}
              className={`rounded-2xl border p-4 ${column.columnBgClass} ${column.borderClass}`}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {column.label} ({columnNotes.length})
              </h3>

              <DraggableColumnBoard
                column={column}
                notes={columnNotes}
                localPositions={localPositions}
                setLocalPositions={setLocalPositions}
                scale={scale}
                onCommitPosition={handleMoveEnd}
              />
            </section>
          );
        })}
      </div>
    </WorkshopStepLayout>
  );
}

export default Step3;
