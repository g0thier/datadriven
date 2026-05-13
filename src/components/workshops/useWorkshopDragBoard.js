/**
 * @module components/workshops/useWorkshopDragBoard
 * @description Shared pointer-drag hook for workshop note boards.
 */

import { useRef } from "react";
import { clamp } from "./workshopBoardGeometry.js";

export default function useWorkshopDragBoard({
  canvasRef,
  getScale,
  onMove,
  onMoveEnd,
  onDragStart,
  noteFallbackWidth = 260,
  noteFallbackHeight = 180,
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

    const noteWidth = (dragState.noteRect?.width ?? noteFallbackWidth) / scale;
    const noteHeight = (dragState.noteRect?.height ?? noteFallbackHeight) / scale;

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
