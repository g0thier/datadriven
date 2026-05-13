/**
 * @module components/workshops/DraggableNotes
 * @description Shared workshop screen for collaborative draggable note boards.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WorkshopStepLayout from "../../pages/workshops/WorkshopStepLayout.jsx";
import WorkshopSyncErrorAlert from "./WorkshopSyncErrorAlert.jsx";
import {
  buildGridPosition,
  normalizePosition,
} from "./workshopBoardGeometry.js";
import useWorkshopDragBoard from "./useWorkshopDragBoard.js";

const CANVAS_WIDTH = 2800;
const CANVAS_HEIGHT = 1600;
const DEFAULT_CHALLENGE_FALLBACK = "Le sujet de l'atelier sera affiché ici dès qu'il sera renseigné.";
const DEFAULT_EMPTY_MESSAGE = "Les contributions apparaîtront ici dès qu'elles seront ajoutées.";

function resolveChallengeText({ collaboration, fieldName, fallbackText }) {
  const value = String(collaboration?.[fieldName] || "").trim();
  return value || fallbackText;
}

export default function DraggableNotes({ step, sessionTitle, collaboration }) {
  const notesField = String(step?.notesField || "notes");
  const notes = useMemo(() => {
    const candidate = collaboration?.[notesField];
    return Array.isArray(candidate) ? candidate : [];
  }, [collaboration, notesField]);

  const commentsByNote =
    collaboration?.commentsByNote && typeof collaboration.commentsByNote === "object"
      ? collaboration.commentsByNote
      : {};

  const syncError = collaboration?.syncError || "";

  const challengeField = String(step?.challengeField || "description");
  const challengeFallback = String(step?.challengeFallback || "").trim() || DEFAULT_CHALLENGE_FALLBACK;
  const challenge = resolveChallengeText({
    collaboration,
    fieldName: challengeField,
    fallbackText: challengeFallback,
  });

  const showObjectiveCard = Boolean(step?.showObjectiveCard);
  const objectiveField = String(step?.objectiveField || "step2Objective");
  const objectiveFallback =
    String(step?.objectiveFallback || "").trim() ||
    "L'objectif de l'atelier sera affiché ici dès qu'il sera renseigné.";
  const objective = resolveChallengeText({
    collaboration,
    fieldName: objectiveField,
    fallbackText: objectiveFallback,
  });

  const noteClassName = String(step?.noteClassName || "bg-yellow-100").trim() || "bg-yellow-100";
  const notesCountLabel = String(step?.notesCountLabel || "notes").trim() || "notes";
  const emptyMessage = String(step?.emptyMessage || "").trim() || DEFAULT_EMPTY_MESSAGE;
  const showComments = Boolean(step?.showComments);

  const [zoom, setZoom] = useState(100);
  const scale = zoom / 100;

  const [localPositions, setLocalPositions] = useState({});
  const draggingNoteIdsRef = useRef(new Set());

  const gridConfig =
    step?.gridPositionConfig && typeof step.gridPositionConfig === "object"
      ? step.gridPositionConfig
      : {};

  useEffect(() => {
    setLocalPositions((previousPositions) => {
      const nextPositions = { ...previousPositions };
      const activeNoteIds = new Set();

      notes.forEach((note, index) => {
        activeNoteIds.add(note.id);

        const normalized = normalizePosition(note.position, buildGridPosition(index, gridConfig));

        if (!draggingNoteIdsRef.current.has(note.id)) {
          nextPositions[note.id] = normalized;
        }
      });

      Object.keys(nextPositions).forEach((noteId) => {
        if (!activeNoteIds.has(noteId)) {
          delete nextPositions[noteId];
        }
      });

      return nextPositions;
    });
  }, [gridConfig, notes]);

  const setPositionActionName = String(step?.setPositionAction || "setNotePosition");
  const setPositionAction = collaboration?.actions?.[setPositionActionName];

  const handleMove = useCallback((noteId, position) => {
    setLocalPositions((previousPositions) => ({
      ...previousPositions,
      [noteId]: position,
    }));
  }, []);

  const handleMoveEnd = useCallback(
    (noteId, position) => {
      draggingNoteIdsRef.current.delete(noteId);

      setLocalPositions((previousPositions) => ({
        ...previousPositions,
        [noteId]: position,
      }));

      setPositionAction?.(noteId, position);
    },
    [setPositionAction]
  );

  const handleDragStart = useCallback((noteId) => {
    draggingNoteIdsRef.current.add(noteId);
  }, []);

  const canvasRef = useRef(null);
  const { onPointerDown, onPointerMove, onPointerUp } = useWorkshopDragBoard({
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
        localPositions[note.id] || normalizePosition(note.position, buildGridPosition(index, gridConfig)),
    }));
  }, [gridConfig, localPositions, notes]);

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      {showObjectiveCard ? (
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
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        </div>
      )}

      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {notes.length} {notesCountLabel} • Glissez-déposez pour organiser
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
            {emptyMessage}
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
                      transform: `translate(${note.displayPosition.x * scale}px, ${
                        note.displayPosition.y * scale
                      }px) scale(${scale})`,
                      transformOrigin: "top left",
                      width: 260,
                    }}
                  >
                    <div
                      className={`relative ${noteClassName} rounded-lg shadow-md p-4`}
                      onPointerDown={(event) => onPointerDown(event, note.id)}
                      data-x={note.displayPosition.x}
                      data-y={note.displayPosition.y}
                      title="Glisser pour déplacer"
                    >
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {note.text || <span className="text-gray-400">—</span>}
                      </p>

                      {showComments && comments.length > 0 ? (
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
