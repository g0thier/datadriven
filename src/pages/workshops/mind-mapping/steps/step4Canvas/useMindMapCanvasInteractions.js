import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clamp,
  isInteractiveTarget,
} from "./geometry.js";

export function useMindMapCanvasInteractions({
  scale,
  isLoading,
  ideaAnchorByKey,
  conceptTextById,
  addConceptAction,
  updateConceptTextAction,
  removeConceptAction,
}) {
  const [isPanning, setIsPanning] = useState(false);
  const [linkSourceIdeaKey, setLinkSourceIdeaKey] = useState("");
  const [linkCursor, setLinkCursor] = useState(null);

  const scrollContainerRef = useRef(null);
  const hasCenteredInitialViewRef = useRef(false);
  const panStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });

  useEffect(() => {
    if (hasCenteredInitialViewRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollLeft = Math.max(0, (CANVAS_WIDTH * scale - container.clientWidth) / 2);
    container.scrollTop = Math.max(0, (CANVAS_HEIGHT * scale - container.clientHeight) / 2);
    hasCenteredInitialViewRef.current = true;
  }, [scale]);

  const effectiveLinkSourceIdeaKey =
    linkSourceIdeaKey && ideaAnchorByKey[linkSourceIdeaKey] ? linkSourceIdeaKey : "";
  const linkSourceAnchor = effectiveLinkSourceIdeaKey
    ? ideaAnchorByKey[effectiveLinkSourceIdeaKey]
    : null;

  const clearLinkingState = useCallback(() => {
    setLinkSourceIdeaKey("");
    setLinkCursor(null);
  }, []);

  const getCanvasPointFromEvent = useCallback(
    (event) => {
      const container = scrollContainerRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();

      const x = (event.clientX - rect.left + container.scrollLeft) / scale;
      const y = (event.clientY - rect.top + container.scrollTop) / scale;

      return {
        x: clamp(x, 0, CANVAS_WIDTH),
        y: clamp(y, 0, CANVAS_HEIGHT),
      };
    },
    [scale]
  );

  const startPan = useCallback(
    (event) => {
      if (event.button !== 0) return;

      if (isInteractiveTarget(event.target)) return;

      if (effectiveLinkSourceIdeaKey) {
        clearLinkingState();
        return;
      }

      const container = scrollContainerRef.current;
      if (!container) return;

      container.setPointerCapture?.(event.pointerId);

      panStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollLeft: container.scrollLeft,
        startScrollTop: container.scrollTop,
      };

      setIsPanning(true);
    },
    [clearLinkingState, effectiveLinkSourceIdeaKey]
  );

  const movePan = useCallback(
    (event) => {
      if (effectiveLinkSourceIdeaKey) {
        const cursorPosition = getCanvasPointFromEvent(event);
        if (cursorPosition) {
          setLinkCursor(cursorPosition);
        }
      }

      const container = scrollContainerRef.current;
      const panState = panStateRef.current;

      if (!container || panState.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - panState.startX;
      const deltaY = event.clientY - panState.startY;

      container.scrollLeft = panState.startScrollLeft - deltaX;
      container.scrollTop = panState.startScrollTop - deltaY;
    },
    [effectiveLinkSourceIdeaKey, getCanvasPointFromEvent]
  );

  const stopPan = useCallback((event) => {
    const container = scrollContainerRef.current;
    const panState = panStateRef.current;

    if (panState.pointerId !== event.pointerId) return;

    container?.releasePointerCapture?.(event.pointerId);

    panStateRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
      startScrollTop: 0,
    };

    setIsPanning(false);
  }, []);

  const handleIdeaAnchorClick = useCallback(
    async (anchor) => {
      if (isLoading || !anchor) return;

      if (!effectiveLinkSourceIdeaKey) {
        setLinkSourceIdeaKey(anchor.ideaKey);
        setLinkCursor({ x: anchor.x, y: anchor.y });
        return;
      }

      if (effectiveLinkSourceIdeaKey === anchor.ideaKey) {
        clearLinkingState();
        return;
      }

      const sourceAnchor = ideaAnchorByKey[effectiveLinkSourceIdeaKey];
      if (!sourceAnchor) {
        setLinkSourceIdeaKey(anchor.ideaKey);
        setLinkCursor({ x: anchor.x, y: anchor.y });
        return;
      }

      await addConceptAction?.({
        fromNoteId: sourceAnchor.noteId,
        fromIdeaId: sourceAnchor.ideaId,
        toNoteId: anchor.noteId,
        toIdeaId: anchor.ideaId,
        text: "",
      });

      clearLinkingState();
    },
    [
      addConceptAction,
      clearLinkingState,
      effectiveLinkSourceIdeaKey,
      ideaAnchorByKey,
      isLoading,
    ]
  );

  const handleConceptTextChange = useCallback(
    (conceptId, value) => {
      if (isLoading || !conceptId) return;

      const currentValue = conceptTextById[conceptId] || "";
      if (currentValue === value) return;

      updateConceptTextAction?.(conceptId, value);
    },
    [conceptTextById, isLoading, updateConceptTextAction]
  );

  const handleRemoveConcept = useCallback(
    (conceptId) => {
      if (isLoading || !conceptId) return;
      removeConceptAction?.(conceptId);
    },
    [isLoading, removeConceptAction]
  );

  return {
    scrollContainerRef,
    isPanning,
    startPan,
    movePan,
    stopPan,
    effectiveLinkSourceIdeaKey,
    linkSourceAnchor,
    linkCursor,
    handleIdeaAnchorClick,
    handleConceptTextChange,
    handleRemoveConcept,
  };
}

export default useMindMapCanvasInteractions;
