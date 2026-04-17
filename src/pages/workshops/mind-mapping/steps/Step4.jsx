import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const CANVAS_WIDTH = 3600;
const CANVAS_HEIGHT = 2400;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

const CHALLENGE_WIDTH = 260;

const IDEA_WIDTH = 120;
const IDEA_RING_THICKNESS = 85;
const IDEA_FONT_SIZE = 12;
const MIN_IDEA_RING_RADIUS = 300;
const MAX_IDEA_RING_RADIUS = Math.min(CENTER_X, CENTER_Y) - 420;

const NOTE_RING_BASE_ITEM_WIDTH = 240;
const NOTE_RING_THICKNESS = 40;
const NOTE_RING_GAP = NOTE_RING_THICKNESS + 30;
const MIN_NOTE_RING_RADIUS = 100;
const MAX_NOTE_RING_RADIUS = Math.min(CENTER_X, CENTER_Y) - 150;

const IDEA_LINK_ANCHOR_OFFSET = 30;
const IDEA_LINK_BUTTON_SIZE = 28;
const CONCEPT_CARD_WIDTH = 180;
const CONCEPT_CARD_HEIGHT = 120;

const SEGMENT_GAP = 0.02;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeRingRadius({ itemCount, itemWidth, minRadius, maxRadius }) {
  if (itemCount <= 1) return minRadius;

  const requiredCircumference = itemCount * itemWidth;
  const adaptiveRadius = requiredCircumference / (2 * Math.PI);

  return clamp(adaptiveRadius, minRadius, maxRadius);
}

function polarToCartesian(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function normalizeAngle(angle) {
  const fullTurn = 2 * Math.PI;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function clockwiseDelta(startAngle, endAngle) {
  const fullTurn = 2 * Math.PI;
  return normalizeAngle(endAngle - startAngle) % fullTurn;
}

function shortestSignedDelta(startAngle, endAngle) {
  const fullTurn = 2 * Math.PI;
  let delta = (endAngle - startAngle) % fullTurn;

  if (delta > Math.PI) {
    delta -= fullTurn;
  } else if (delta < -Math.PI) {
    delta += fullTurn;
  }

  return delta;
}

function describeArcPath({ cx, cy, radius, startAngle, endAngle, sweepFlag }) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);

  const delta =
    sweepFlag === 1
      ? clockwiseDelta(startAngle, endAngle)
      : clockwiseDelta(endAngle, startAngle);

  const largeArcFlag = delta > Math.PI ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function describeDonutArc({ cx, cy, innerRadius, outerRadius, startAngle, endAngle }) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);

  const delta = clockwiseDelta(startAngle, endAngle);
  const largeArcFlag = delta > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function describeQuadraticPath(from, control, to) {
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

function getQuadraticPoint(from, control, to, t) {
  const invT = 1 - t;

  return {
    x: invT * invT * from.x + 2 * invT * t * control.x + t * t * to.x,
    y: invT * invT * from.y + 2 * invT * t * control.y + t * t * to.y,
  };
}

function shouldFlipArcText(midAngle) {
  const angle = normalizeAngle(midAngle);
  const tangentX = -Math.sin(angle);

  return tangentX < -1e-4;
}

function getTextDirection(segment) {
  if (segment.flipText) {
    return {
      startAngle: segment.endAngle,
      endAngle: segment.startAngle,
      sweepFlag: 0,
    };
  }

  return {
    startAngle: segment.startAngle,
    endAngle: segment.endAngle,
    sweepFlag: 1,
  };
}

function sanitizeForId(value) {
  return String(value || "note").replace(/[^a-zA-Z0-9_-]/g, "-");
}

function splitLabelIntoLines(label, maxCharsPerLine, maxLines = 3) {
  const safeMaxChars = Math.max(6, maxCharsPerLine);
  const words = String(label || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return ["Idee vide"];
  }

  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if (!currentLine) {
      currentLine = word;
      return;
    }

    const candidate = `${currentLine} ${word}`;
    if (candidate.length <= safeMaxChars) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const truncated = lines.slice(0, maxLines);
  let lastLine = truncated[maxLines - 1];
  const remainingWords = lines
    .slice(maxLines)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);

  for (const word of remainingWords) {
    const candidate = `${lastLine} ${word}`;
    if (candidate.length > safeMaxChars - 1) break;
    lastLine = candidate;
  }

  truncated[maxLines - 1] = `${lastLine}...`;
  return truncated;
}

function buildArcSegments({ items, getWeight, getKey, segmentGap = SEGMENT_GAP }) {
  if (!items.length) return [];

  const weightedItems = items
    .map((item, index) => ({
      item,
      index,
      weight: Number(getWeight(item, index)) || 0,
    }))
    .filter((entry) => entry.weight > 0);

  if (!weightedItems.length) return [];

  const totalWeight = weightedItems.reduce((sum, entry) => sum + entry.weight, 0);
  const itemCount = weightedItems.length;
  const availableAngle = Math.max(2 * Math.PI - itemCount * segmentGap, Math.PI * 0.8);

  let cursor = -Math.PI / 2;

  return weightedItems.map(({ item, index, weight }) => {
    const span = (weight / totalWeight) * availableAngle;
    const startAngle = cursor + segmentGap / 2;
    const endAngle = startAngle + span;
    const midAngle = startAngle + span / 2;

    cursor = endAngle + segmentGap / 2;

    return {
      key: getKey(item, index),
      data: item,
      span,
      startAngle,
      endAngle,
      flipText: shouldFlipArcText(midAngle),
    };
  });
}

function computeNoteAngularWeight({ ideaCount, totalIdeas, segmentGap = SEGMENT_GAP }) {
  if (ideaCount <= 0 || totalIdeas <= 0) return 0;

  const ideaSliceAngle = (2 * Math.PI) / totalIdeas;
  return Math.max(ideaCount * ideaSliceAngle - segmentGap, 0);
}

function buildConceptPairKey(fromIdeaKey, toIdeaKey) {
  return [fromIdeaKey, toIdeaKey].sort().join("__");
}

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest("[data-mindmap-interactive='true']"));
}

function Step4({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = useMemo(
    () => collaboration?.commentsByNote || {},
    [collaboration?.commentsByNote]
  );
  const concepts = useMemo(() => collaboration?.concepts ?? [], [collaboration?.concepts]);

  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const addConceptAction = collaboration?.actions?.addConcept;
  const updateConceptTextAction = collaboration?.actions?.updateConceptText;
  const removeConceptAction = collaboration?.actions?.removeConcept;

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici des qu'il est defini a l'etape 1.";

  const [zoom, setZoom] = useState(85);
  const scale = zoom / 100;

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

  const ideaNodes = useMemo(() => {
    return notes.flatMap((note) => {
      const comments = commentsByNote[note.id] || [];

      return comments.map((comment) => ({
        key: `${note.id}::${comment.id}`,
        noteId: note.id,
        id: comment.id,
        text: comment.text || "",
      }));
    });
  }, [commentsByNote, notes]);

  const totalIdeas = ideaNodes.length;

  const ideaCountByNote = useMemo(() => {
    return notes.reduce((accumulator, note) => {
      accumulator[note.id] = (commentsByNote[note.id] || []).length;
      return accumulator;
    }, {});
  }, [commentsByNote, notes]);

  const notesWithIdeas = useMemo(
    () => notes.filter((note) => (ideaCountByNote[note.id] || 0) > 0),
    [ideaCountByNote, notes]
  );

  const ideaRingRadius = useMemo(
    () =>
      computeRingRadius({
        itemCount: ideaNodes.length,
        itemWidth: IDEA_WIDTH,
        minRadius: MIN_IDEA_RING_RADIUS,
        maxRadius: MAX_IDEA_RING_RADIUS,
      }),
    [ideaNodes.length]
  );

  const noteRingRadius = useMemo(() => {
    const baseRadius = computeRingRadius({
      itemCount: notesWithIdeas.length,
      itemWidth: NOTE_RING_BASE_ITEM_WIDTH,
      minRadius: MIN_NOTE_RING_RADIUS,
      maxRadius: MAX_NOTE_RING_RADIUS,
    });

    return clamp(
      Math.max(baseRadius, ideaRingRadius + NOTE_RING_GAP),
      MIN_NOTE_RING_RADIUS,
      MAX_NOTE_RING_RADIUS
    );
  }, [ideaRingRadius, notesWithIdeas.length]);

  const noteArcInnerRadius = noteRingRadius - NOTE_RING_THICKNESS / 2;
  const noteArcOuterRadius = noteRingRadius + NOTE_RING_THICKNESS / 2;
  const ideaArcInnerRadius = ideaRingRadius - IDEA_RING_THICKNESS / 2;
  const ideaArcOuterRadius = ideaRingRadius + IDEA_RING_THICKNESS / 2;
  const ideaAnchorRadius = Math.max(40, ideaArcInnerRadius - IDEA_LINK_ANCHOR_OFFSET);

  const ideaArcSegments = useMemo(() => {
    return buildArcSegments({
      items: ideaNodes,
      getWeight: () => 1,
      getKey: (idea, index) =>
        `${sanitizeForId(idea.noteId)}-${sanitizeForId(idea.id)}-${index}`,
    });
  }, [ideaNodes]);

  const noteArcSegments = useMemo(() => {
    return buildArcSegments({
      items: notesWithIdeas,
      getWeight: (note) =>
        computeNoteAngularWeight({
          ideaCount: ideaCountByNote[note.id] || 0,
          totalIdeas,
        }),
      getKey: (note, index) => `${sanitizeForId(note.id)}-${index}`,
    });
  }, [ideaCountByNote, notesWithIdeas, totalIdeas]);

  const ideaAnchors = useMemo(() => {
    return ideaArcSegments.map((segment) => {
      const midAngle = segment.startAngle + segment.span / 2;
      const position = polarToCartesian(CENTER_X, CENTER_Y, ideaAnchorRadius, midAngle);

      return {
        ideaKey: segment.data.key,
        noteId: segment.data.noteId,
        ideaId: segment.data.id,
        x: position.x,
        y: position.y,
        angle: midAngle,
      };
    });
  }, [ideaAnchorRadius, ideaArcSegments]);

  const ideaAnchorByKey = useMemo(
    () =>
      ideaAnchors.reduce((accumulator, anchor) => {
        accumulator[anchor.ideaKey] = anchor;
        return accumulator;
      }, {}),
    [ideaAnchors]
  );

  const conceptTextById = useMemo(
    () =>
      concepts.reduce((accumulator, concept) => {
        accumulator[concept.id] = String(concept?.text || "");
        return accumulator;
      }, {}),
    [concepts]
  );

  const conceptCurves = useMemo(() => {
    if (!concepts.length) return [];

    const groupedConcepts = new Map();

    concepts.forEach((concept) => {
      const fromIdeaKey = `${concept?.from?.noteId || ""}::${concept?.from?.ideaId || ""}`;
      const toIdeaKey = `${concept?.to?.noteId || ""}::${concept?.to?.ideaId || ""}`;
      const fromAnchor = ideaAnchorByKey[fromIdeaKey];
      const toAnchor = ideaAnchorByKey[toIdeaKey];

      if (!fromAnchor || !toAnchor) return;

      const pairKey = buildConceptPairKey(fromIdeaKey, toIdeaKey);
      const currentGroup = groupedConcepts.get(pairKey) || [];
      currentGroup.push({ concept, fromAnchor, toAnchor });
      groupedConcepts.set(pairKey, currentGroup);
    });

    // Keep all concept curves bending inward (toward the center),
    // so control radius always stays below anchor radius.
    const minControlRadius = Math.max(30, ideaAnchorRadius * 0.16);
    const maxControlRadius = Math.max(minControlRadius + 8, ideaAnchorRadius - 14);

    const renderItems = [];

    groupedConcepts.forEach((group, pairKey) => {
      const groupCount = group.length;
      if (!groupCount) return;

      const { fromAnchor, toAnchor } = group[0];
      const fromAngle = Math.atan2(fromAnchor.y - CENTER_Y, fromAnchor.x - CENTER_X);
      const toAngle = Math.atan2(toAnchor.y - CENTER_Y, toAnchor.x - CENTER_X);
      const delta = shortestSignedDelta(fromAngle, toAngle);
      const proximity = 1 - Math.abs(delta) / Math.PI;

      const baseControlRadius =
        minControlRadius + (maxControlRadius - minControlRadius) * clamp(proximity, 0, 1);
      const controlRadius = clamp(baseControlRadius, minControlRadius, maxControlRadius);

      const midAngle = fromAngle + delta / 2;
      const control = polarToCartesian(CENTER_X, CENTER_Y, controlRadius, midAngle);

      const from = { x: fromAnchor.x, y: fromAnchor.y };
      const to = { x: toAnchor.x, y: toAnchor.y };
      const path = describeQuadraticPath(from, control, to);

      group.forEach(({ concept }, index) => {
        const markerT = (index + 1) / (groupCount + 1);
        const markerPoint = getQuadraticPoint(from, control, to, markerT);

        renderItems.push({
          concept,
          pairKey,
          drawArc: index === 0,
          from,
          to,
          control,
          cardCenter: {
            x: markerPoint.x,
            y: markerPoint.y,
          },
          path,
        });
      });
    });

    return renderItems;
  }, [concepts, ideaAnchorByKey, ideaAnchorRadius]);

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
        <div className="flex items-center justify-between mb-3 gap-3">
          <p className="text-sm text-gray-600">
            {notesWithIdeas.length} notes • {totalIdeas} idees • {concepts.length} concepts
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
          className={`w-full aspect-square overflow-auto rounded-xl border border-slate-200 select-none ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={stopPan}
          onPointerCancel={stopPan}
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

            <svg
              className="absolute inset-0 pointer-events-none"
              width={CANVAS_WIDTH * scale}
              height={CANVAS_HEIGHT * scale}
            >
              {ideaArcSegments.map((segment) => {
                const arcPath = describeDonutArc({
                  cx: CENTER_X * scale,
                  cy: CENTER_Y * scale,
                  innerRadius: ideaArcInnerRadius * scale,
                  outerRadius: ideaArcOuterRadius * scale,
                  startAngle: segment.startAngle,
                  endAngle: segment.endAngle,
                });

                const label = String(segment.data.text || "").trim();
                const centerRadius = ideaArcInnerRadius + IDEA_RING_THICKNESS / 2;
                const arcLength = centerRadius * segment.span;
                const maxCharsPerLine = Math.max(
                  8,
                  Math.floor(arcLength / (IDEA_FONT_SIZE * 0.58))
                );
                const lines = splitLabelIntoLines(label, maxCharsPerLine, 3);
                const linesForDisplay = segment.flipText ? lines : [...lines].reverse();
                const direction = getTextDirection(segment);

                return (
                  <g key={segment.key}>
                    <path
                      d={arcPath}
                      className="fill-sky-50 stroke-sky-200"
                      strokeWidth={1.2 * scale}
                    />

                    {linesForDisplay.map((line, lineIndex) => {
                      const lineRadius =
                        ideaArcInnerRadius +
                        (IDEA_RING_THICKNESS * (lineIndex + 1)) / (linesForDisplay.length + 1);

                      const linePath = describeArcPath({
                        cx: CENTER_X * scale,
                        cy: CENTER_Y * scale,
                        radius: lineRadius * scale,
                        startAngle: direction.startAngle,
                        endAngle: direction.endAngle,
                        sweepFlag: direction.sweepFlag,
                      });

                      const linePathId = `mindmap-idea-arc-${segment.key}-line-${lineIndex}`;

                      return (
                        <g key={linePathId}>
                          <path id={linePathId} d={linePath} fill="none" />

                          <text
                            className="fill-sky-700 font-medium"
                            style={{
                              fontSize: `${IDEA_FONT_SIZE * scale}px`,
                              letterSpacing: `${0.01 * scale}em`,
                            }}
                            textAnchor="middle"
                          >
                            <textPath href={`#${linePathId}`} startOffset="50%">
                              {line}
                            </textPath>
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {noteArcSegments.map((segment) => {
                const arcPath = describeDonutArc({
                  cx: CENTER_X * scale,
                  cy: CENTER_Y * scale,
                  innerRadius: noteArcInnerRadius * scale,
                  outerRadius: noteArcOuterRadius * scale,
                  startAngle: segment.startAngle,
                  endAngle: segment.endAngle,
                });

                const textRadius = (noteArcInnerRadius + noteArcOuterRadius) / 2;
                const direction = getTextDirection(segment);

                const textPath = describeArcPath({
                  cx: CENTER_X * scale,
                  cy: CENTER_Y * scale,
                  radius: textRadius * scale,
                  startAngle: direction.startAngle,
                  endAngle: direction.endAngle,
                  sweepFlag: direction.sweepFlag,
                });

                const textPathId = `mindmap-note-arc-${segment.key}`;
                const label = String(segment.data.text || "").trim() || "Note vide";
                const ideaCount = ideaCountByNote[segment.data.id] || 0;

                return (
                  <g key={segment.key}>
                    <path
                      d={arcPath}
                      className="fill-yellow-100 stroke-yellow-200"
                      strokeWidth={1.4 * scale}
                    />
                    <path id={textPathId} d={textPath} fill="none" />

                    <text
                      className="fill-yellow-600 font-bold"
                      style={{
                        fontSize: `${12 * scale}px`,
                        letterSpacing: `${0.02 * scale}em`,
                      }}
                      textAnchor="middle"
                    >
                      <textPath href={`#${textPathId}`} startOffset="50%">
                        {label} ({ideaCount})
                      </textPath>
                    </text>
                  </g>
                );
              })}

              {conceptCurves
                .filter((curve) => curve.drawArc)
                .map((curve) => (
                <path
                  key={`concept-path-${curve.pairKey}`}
                  d={describeQuadraticPath(
                    { x: curve.from.x * scale, y: curve.from.y * scale },
                    { x: curve.control.x * scale, y: curve.control.y * scale },
                    { x: curve.to.x * scale, y: curve.to.y * scale }
                  )}
                  fill="none"
                  stroke="rgb(249 115 22)"
                  strokeWidth={2.8 * scale}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              ))}

              {linkSourceAnchor && linkCursor && (
                <line
                  x1={linkSourceAnchor.x * scale}
                  y1={linkSourceAnchor.y * scale}
                  x2={linkCursor.x * scale}
                  y2={linkCursor.y * scale}
                  stroke="rgb(249 115 22)"
                  strokeWidth={2.4 * scale}
                  strokeLinecap="round"
                />
              )}
            </svg>

            <div
              className="absolute z-40"
              style={{
                transform: `translate(${(CENTER_X - CHALLENGE_WIDTH / 2) * scale}px, ${(CENTER_Y - 85) *
                  scale}px) scale(${scale})`,
                transformOrigin: "top left",
                width: CHALLENGE_WIDTH,
              }}
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-5 min-h-36">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Sujet</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{challenge}</p>
              </div>
            </div>

            {conceptCurves.map((curve) => (
              <div
                key={`concept-card-${curve.concept.id}`}
                data-mindmap-interactive="true"
                className="group absolute z-[80] hover:z-[150] focus-within:z-[150]"
                style={{
                  transform: `translate(${(curve.cardCenter.x - IDEA_LINK_BUTTON_SIZE / 2) * scale}px, ${(curve
                    .cardCenter.y - IDEA_LINK_BUTTON_SIZE / 2) * scale}px) scale(${scale})`,
                  transformOrigin: "top left",
                  width: IDEA_LINK_BUTTON_SIZE,
                  height: IDEA_LINK_BUTTON_SIZE,
                }}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  data-mindmap-interactive="true"
                  className="absolute inset-0 w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-semibold flex items-center justify-center shadow-md hover:bg-orange-600 transition"
                  aria-label="Afficher le concept"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  ?
                </button>

                <div
                  data-mindmap-interactive="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none transition duration-150 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto"
                  style={{
                    width: CONCEPT_CARD_WIDTH,
                    minHeight: CONCEPT_CARD_HEIGHT,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="relative bg-orange-50 border border-orange-200 rounded-lg shadow-sm p-2 flex flex-col">
                    <textarea
                      className="w-full h-20 bg-transparent resize-none focus:outline-none text-gray-800 text-xs"
                      placeholder="Ecrivez un concept..."
                      value={curve.concept.text || ""}
                      disabled={isLoading}
                      onChange={(event) =>
                        handleConceptTextChange(curve.concept.id, event.target.value)
                      }
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveConcept(curve.concept.id)}
                      disabled={isLoading}
                      className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500 text-xs disabled:opacity-50"
                      aria-label="Supprimer le concept"
                    >
                      x
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {ideaAnchors.map((anchor) => {
              const isSource = effectiveLinkSourceIdeaKey === anchor.ideaKey;
              const isLinking = Boolean(effectiveLinkSourceIdeaKey);

              const buttonText = isLinking ? (isSource ? "+" : "o") : "+";
              const buttonClass = isSource
                ? "bg-orange-600 hover:bg-orange-700"
                : isLinking
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  : "bg-orange-500 hover:bg-orange-600";

              return (
                <button
                  key={`idea-anchor-${anchor.ideaKey}`}
                  type="button"
                  data-mindmap-interactive="true"
                  disabled={isLoading}
                  className={`absolute z-[70] w-7 h-7 rounded-full text-sm font-semibold flex items-center justify-center shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass} ${
                    isLinking && !isSource ? "border border-orange-300" : "text-white"
                  }`}
                  style={{
                    transform: `translate(${(anchor.x - IDEA_LINK_BUTTON_SIZE / 2) * scale}px, ${(anchor.y -
                      IDEA_LINK_BUTTON_SIZE / 2) * scale}px) scale(${scale})`,
                    transformOrigin: "top left",
                    width: IDEA_LINK_BUTTON_SIZE,
                    height: IDEA_LINK_BUTTON_SIZE,
                  }}
                  aria-label={
                    isLinking
                      ? isSource
                        ? "Noeud source"
                        : "Relier cette idee"
                      : "Commencer une liaison"
                  }
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleIdeaAnchorClick(anchor);
                  }}
                >
                  {buttonText}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}

export default Step4;
