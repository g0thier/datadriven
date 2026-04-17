import { useEffect, useMemo, useRef, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const CANVAS_WIDTH = 3600;
const CANVAS_HEIGHT = 2400;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

const CHALLENGE_WIDTH = 260;

const IDEA_WIDTH = 120;
const IDEA_HEIGHT = 120;
const IDEA_GAP = 24;
const MIN_IDEA_RING_RADIUS = 280;
const MAX_IDEA_RING_RADIUS = Math.min(CENTER_X, CENTER_Y) - 420;

const NOTE_RING_BASE_ITEM_WIDTH = 240;
const NOTE_RING_BASE_GAP = 52;
const NOTE_RING_THICKNESS = 40;
const NOTE_RING_GAP = 180;
const MIN_NOTE_RING_RADIUS = 520;
const MAX_NOTE_RING_RADIUS = Math.min(CENTER_X, CENTER_Y) - 150;
const MIN_EMPTY_NOTE_WEIGHT = 0.25;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeRingRadius({ itemCount, itemWidth, gap, minRadius, maxRadius }) {
  if (itemCount <= 1) return minRadius;

  const requiredCircumference = itemCount * (itemWidth + gap);
  const adaptiveRadius = requiredCircumference / (2 * Math.PI);

  return clamp(adaptiveRadius, minRadius, maxRadius);
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

function describeArcPath({ cx, cy, radius, startAngle, endAngle, sweepFlag }) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);

  const delta = sweepFlag === 1
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

function shouldFlipArcText(midAngle) {
  const angle = normalizeAngle(midAngle);
  const tangentX = -Math.sin(angle);

  // On inverse uniquement quand la lecture naturelle irait de droite vers gauche.
  return tangentX < -1e-4;
}

function sanitizeForId(value) {
  return String(value || "note").replace(/[^a-zA-Z0-9_-]/g, "-");
}

function Step4({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = useMemo(
    () => collaboration?.commentsByNote || {},
    [collaboration?.commentsByNote]
  );
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici des qu'il est defini a l'etape 1.";

  const [zoom, setZoom] = useState(85);
  const scale = zoom / 100;

  const [isPanning, setIsPanning] = useState(false);

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

  const ideaRingRadius = useMemo(
    () =>
      computeRingRadius({
        itemCount: ideaNodes.length,
        itemWidth: IDEA_WIDTH,
        gap: IDEA_GAP,
        minRadius: MIN_IDEA_RING_RADIUS,
        maxRadius: MAX_IDEA_RING_RADIUS,
      }),
    [ideaNodes.length]
  );

  const noteRingRadius = useMemo(() => {
    const baseRadius = computeRingRadius({
      itemCount: notes.length,
      itemWidth: NOTE_RING_BASE_ITEM_WIDTH,
      gap: NOTE_RING_BASE_GAP,
      minRadius: MIN_NOTE_RING_RADIUS,
      maxRadius: MAX_NOTE_RING_RADIUS,
    });

    return clamp(
      Math.max(baseRadius, ideaRingRadius + NOTE_RING_GAP),
      MIN_NOTE_RING_RADIUS,
      MAX_NOTE_RING_RADIUS
    );
  }, [ideaRingRadius, notes.length]);

  const noteArcInnerRadius = noteRingRadius - NOTE_RING_THICKNESS / 2;
  const noteArcOuterRadius = noteRingRadius + NOTE_RING_THICKNESS / 2;

  const ideasWithDisplayPosition = useMemo(() => {
    return ideaNodes.map((idea, index) => ({
      ...idea,
      displayPosition: buildRadialPosition({
        index,
        total: ideaNodes.length,
        radius: ideaRingRadius,
        centerX: CENTER_X,
        centerY: CENTER_Y,
        itemWidth: IDEA_WIDTH,
        itemHeight: IDEA_HEIGHT,
      }),
    }));
  }, [ideaNodes, ideaRingRadius]);

  const noteArcSegments = useMemo(() => {
    if (!notes.length) return [];

    const weights = notes.map((note) => {
      const ideaCount = ideaCountByNote[note.id] || 0;
      const weight = totalIdeas > 0 ? Math.max(ideaCount, MIN_EMPTY_NOTE_WEIGHT) : 1;

      return {
        note,
        ideaCount,
        weight,
      };
    });

    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
    const noteCount = weights.length;

    const preferredGap = 0.02;
    const maximumGap = (2 * Math.PI) / (noteCount * 3);
    const segmentGap = Math.min(preferredGap, maximumGap);

    const availableAngle = Math.max(2 * Math.PI - noteCount * segmentGap, Math.PI * 0.8);

    let cursor = -Math.PI / 2;

    return weights.map((item, index) => {
      const span = (item.weight / totalWeight) * availableAngle;
      const startAngle = cursor + segmentGap / 2;
      const endAngle = startAngle + span;
      const midAngle = startAngle + span / 2;

      cursor = endAngle + segmentGap / 2;

      return {
        key: `${sanitizeForId(item.note.id)}-${index}`,
        index,
        note: item.note,
        ideaCount: item.ideaCount,
        startAngle,
        endAngle,
        midAngle,
        flipText: shouldFlipArcText(midAngle),
      };
    });
  }, [ideaCountByNote, notes, totalIdeas]);

  const startPan = (event) => {
    if (event.button !== 0) return;

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
  };

  const movePan = (event) => {
    const container = scrollContainerRef.current;
    const panState = panStateRef.current;

    if (!container || panState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - panState.startX;
    const deltaY = event.clientY - panState.startY;

    container.scrollLeft = panState.startScrollLeft - deltaX;
    container.scrollTop = panState.startScrollTop - deltaY;
  };

  const stopPan = (event) => {
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
        <div className="flex items-center justify-between mb-3 gap-3">
          <p className="text-sm text-gray-600">
            {notes.length} notes • {totalIdeas} idées
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-12 text-right">{zoom}%</span>

            <input
              type="range"
              min="20"
              max="130"
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
            <svg
              className="absolute inset-0 pointer-events-none"
              width={CANVAS_WIDTH * scale}
              height={CANVAS_HEIGHT * scale}
            >
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

                const textPath = describeArcPath({
                  cx: CENTER_X * scale,
                  cy: CENTER_Y * scale,
                  radius: textRadius * scale,
                  startAngle: segment.flipText ? segment.endAngle : segment.startAngle,
                  endAngle: segment.flipText ? segment.startAngle : segment.endAngle,
                  sweepFlag: segment.flipText ? 0 : 1,
                });

                const textPathId = `mindmap-note-arc-${segment.key}`;
                const label = String(segment.note.text || "").trim() || "Note vide";

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
                        {label} ({segment.ideaCount})
                      </textPath>
                    </text>
                  </g>
                );
              })}
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

            <div className="pointer-events-none">
              {ideasWithDisplayPosition.map((idea) => (
                <div
                  key={idea.key}
                  className="absolute z-20"
                  style={{
                    transform: `translate(${idea.displayPosition.x * scale}px, ${idea.displayPosition.y *
                      scale}px) scale(${scale})`,
                    transformOrigin: "top left",
                    width: IDEA_WIDTH,
                    height: IDEA_HEIGHT,
                  }}
                >
                  <div className="bg-sky-50 border border-sky-200 rounded-xl shadow-sm px-3 py-3 h-[120px] flex items-start">
                    <p className="text-slate-700 text-xs font-medium leading-4 whitespace-pre-wrap">
                      {idea.text || <span className="text-slate-400">Idée vide</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}

export default Step4;
