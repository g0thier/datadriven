import { useMemo, useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
import MaterialIcon from "../../../../components/MaterialIcon.jsx";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CENTER_X,
  CENTER_Y,
  CONCEPT_CARD_HEIGHT,
  CONCEPT_CARD_WIDTH,
  IDEA_FONT_SIZE,
  IDEA_LINK_BUTTON_SIZE,
  IDEA_RING_THICKNESS,
  describeArcPath,
  describeDonutArc,
  describeQuadraticPath,
  getTextDirection,
  splitLabelIntoLines,
} from "./step4Canvas/geometry.js";
import useMindMapCanvasModel from "./step4Canvas/useMindMapCanvasModel.js";
import useMindMapCanvasInteractions from "./step4Canvas/useMindMapCanvasInteractions.js";

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

  const {
    ideaArcSegments,
    noteArcSegments,
    ideaAnchors,
    ideaAnchorByKey,
    conceptCurves,
    conceptTextById,
    ideaArcInnerRadius,
    ideaArcOuterRadius,
    noteArcInnerRadius,
    noteArcOuterRadius,
    totals,
  } = useMindMapCanvasModel({ notes, commentsByNote, concepts });

  const {
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
  } = useMindMapCanvasInteractions({
    scale,
    isLoading,
    ideaAnchorByKey,
    conceptTextById,
    addConceptAction,
    updateConceptTextAction,
    removeConceptAction,
  });

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
        <div className="flex items-center justify-between mb-3 gap-3">
          <p className="text-sm text-gray-600">
            {totals.notesWithIdeasCount} notes • {totals.totalIdeas} idees • {totals.conceptCount} concepts
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
                const ideaCount = totals.ideaCountByNote[segment.data.id] || 0;

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
                  <MaterialIcon name="emoji_objects" size={16} fill={1} className="text-white" />
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
