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
  polarToCartesian,
  splitLabelIntoLines,
} from "./mindMapCanvas/geometry.js";
import useMindMapCanvasModel from "./mindMapCanvas/useMindMapCanvasModel.js";
import useMindMapCanvasInteractions from "./mindMapCanvas/useMindMapCanvasInteractions.js";

function buildCircularOffsets({ count, radius, startAngle = -Math.PI / 2 }) {
  if (!count || count <= 0) return [];

  return Array.from({ length: count }).map((_, index) => {
    const angle = startAngle + (2 * Math.PI * index) / count;
    const point = polarToCartesian(0, 0, radius, angle);
    return { x: point.x, y: point.y };
  });
}

function Step5({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = useMemo(
    () => collaboration?.commentsByNote || {},
    [collaboration?.commentsByNote]
  );
  const concepts = useMemo(() => collaboration?.concepts ?? [], [collaboration?.concepts]);
  const votesByConcept = collaboration?.votesByConcept || {};

  const currentParticipantId = collaboration?.participant?.id || "";
  const remainingVotes = Number.isFinite(collaboration?.remainingVotes)
    ? collaboration.remainingVotes
    : 0;
  const maxStickers = Number.isFinite(collaboration?.maxStickers)
    ? collaboration.maxStickers
    : 3;

  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici dès qu'il est défini à l'étape 1.";

  const [zoom, setZoom] = useState(85);
  const scale = zoom / 100;

  const {
    ideaArcSegments,
    noteArcSegments,
    ideaAnchors,
    conceptCurves,
    conceptTextById,
    ideaArcInnerRadius,
    ideaArcOuterRadius,
    noteArcInnerRadius,
    noteArcOuterRadius,
    ideaAnchorByKey,
    totals,
  } = useMindMapCanvasModel({ notes, commentsByNote, concepts });

  const { scrollContainerRef, isPanning, startPan, movePan, stopPan } =
    useMindMapCanvasInteractions({
      scale,
      isLoading,
      ideaAnchorByKey,
      conceptTextById,
      addConceptAction: undefined,
      updateConceptTextAction: undefined,
      removeConceptAction: undefined,
    });

  const toggleConceptVoteAction = collaboration?.actions?.toggleConceptVote;

  const toggleConceptVote = (conceptId, hasMine) => {
    if (!hasMine && remainingVotes <= 0) return;
    toggleConceptVoteAction?.(conceptId);
  };

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Gommettes a distribuer :</span>

            <div className="flex items-center gap-1">
              {Array.from({ length: maxStickers }).map((_, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full ${
                    index < remainingVotes ? "bg-green-400" : "bg-green-200"
                  }`}
                  title={index < remainingVotes ? "Disponible" : "Deja utilisee"}
                />
              ))}
            </div>
          </div>

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

                      const linePathId = `mindmap-step5-idea-arc-${segment.key}-line-${lineIndex}`;

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

                const textPathId = `mindmap-step5-note-arc-${segment.key}`;
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
                    key={`mindmap-step5-concept-path-${curve.pairKey}`}
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
            </svg>

            {conceptCurves.map((curve) => {
              const stickerSet = votesByConcept[curve.concept.id] || new Set();
              const hasMine = stickerSet.has(currentParticipantId);
              const otherCount = Math.max(0, stickerSet.size - (hasMine ? 1 : 0));
              const isDisabled = !hasMine && remainingVotes <= 0;
              const voteDots = [
                ...(hasMine ? [{ mine: true }] : []),
                ...Array.from({ length: otherCount }).map(() => ({ mine: false })),
              ];
              const visibleVoteDots = voteDots.slice(0, 8);
              const voteRingPositions = buildCircularOffsets({
                count: visibleVoteDots.length,
                radius: 22,
              });
              const visibleOtherCount = Math.min(otherCount, 4);

              return (
                <div
                  key={`mindmap-step5-concept-card-${curve.concept.id}`}
                  data-mindmap-interactive="true"
                  className="group absolute z-80 hover:z-150 focus-within:z-150"
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
                  <div className="absolute inset-0 pointer-events-none">
                    {visibleVoteDots.map((dot, index) => {
                      const position = voteRingPositions[index];
                      return (
                        <div
                          key={`mindmap-step5-vote-ring-${curve.concept.id}-${index}`}
                          className={`absolute w-2 h-2 rounded-full ${
                            dot.mine ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{
                            left: `${IDEA_LINK_BUTTON_SIZE / 2 + position.x - 4}px`,
                            top: `${IDEA_LINK_BUTTON_SIZE / 2 + position.y - 4}px`,
                          }}
                        />
                      );
                    })}
                  </div>

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
                    <div
                      className={`relative border rounded-lg shadow-sm p-2 min-h-30 transition ${
                        isDisabled
                          ? "bg-orange-50 border-orange-200"
                          : "bg-orange-50 border-orange-200 cursor-pointer hover:border-orange-300"
                      }`}
                      title="Cliquer pour ajouter/retirer une gommette"
                      onClick={() => toggleConceptVote(curve.concept.id, hasMine)}
                    >
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            hasMine
                              ? "bg-green-500"
                              : "bg-transparent border border-green-300"
                          }`}
                          title={hasMine ? "Ta gommette" : "Pas de gommette"}
                        />

                        {Array.from({ length: visibleOtherCount }).map((_, index) => (
                          <div
                            key={`mindmap-step5-vote-card-${curve.concept.id}-${index}`}
                            className="w-2.5 h-2.5 rounded-full bg-blue-500"
                            title="Gommette d'un autre participant"
                          />
                        ))}

                        {otherCount > visibleOtherCount && (
                          <span className="text-[10px] font-semibold text-blue-600">
                            +{otherCount - visibleOtherCount}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-800 text-xs whitespace-pre-wrap pr-12">
                        {curve.concept.text || <span className="text-gray-400">Concept vide</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {ideaAnchors.map((anchor) => (
              <div
                key={`mindmap-step5-idea-anchor-${anchor.ideaKey}`}
                className="absolute z-60 pointer-events-none"
                style={{
                  transform: `translate(${(anchor.x - IDEA_LINK_BUTTON_SIZE / 2) * scale}px, ${(anchor.y -
                    IDEA_LINK_BUTTON_SIZE / 2) * scale}px) scale(${scale})`,
                  transformOrigin: "top left",
                  width: IDEA_LINK_BUTTON_SIZE,
                  height: IDEA_LINK_BUTTON_SIZE,
                }}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  <MaterialIcon
                    name="radio_button_checked"
                    size={16}
                    fill={1}
                    className="text-orange-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkshopStepLayout>
  );
}

export default Step5;
