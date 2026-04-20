export const CANVAS_WIDTH = 3600;
export const CANVAS_HEIGHT = 2400;
export const CENTER_X = CANVAS_WIDTH / 2;
export const CENTER_Y = CANVAS_HEIGHT / 2;

export const IDEA_WIDTH = 120;
export const IDEA_RING_THICKNESS = 85;
export const IDEA_FONT_SIZE = 12;
export const MIN_IDEA_RING_RADIUS = 300;
export const MAX_IDEA_RING_RADIUS = Math.min(CENTER_X, CENTER_Y) - 420;

export const NOTE_RING_BASE_ITEM_WIDTH = 240;
export const NOTE_RING_THICKNESS = 40;
export const NOTE_RING_GAP = NOTE_RING_THICKNESS + 30;
export const MIN_NOTE_RING_RADIUS = 100;
export const MAX_NOTE_RING_RADIUS = Math.min(CENTER_X, CENTER_Y) - 150;

export const IDEA_LINK_ANCHOR_OFFSET = 30;
export const IDEA_LINK_BUTTON_SIZE = 28;
export const CONCEPT_CARD_WIDTH = 180;
export const CONCEPT_CARD_HEIGHT = 120;

export const SEGMENT_GAP = 0.02;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeRingRadius({ itemCount, itemWidth, minRadius, maxRadius }) {
  if (itemCount <= 1) return minRadius;

  const requiredCircumference = itemCount * itemWidth;
  const adaptiveRadius = requiredCircumference / (2 * Math.PI);

  return clamp(adaptiveRadius, minRadius, maxRadius);
}

export function polarToCartesian(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export function normalizeAngle(angle) {
  const fullTurn = 2 * Math.PI;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

export function clockwiseDelta(startAngle, endAngle) {
  const fullTurn = 2 * Math.PI;
  return normalizeAngle(endAngle - startAngle) % fullTurn;
}

export function shortestSignedDelta(startAngle, endAngle) {
  const fullTurn = 2 * Math.PI;
  let delta = (endAngle - startAngle) % fullTurn;

  if (delta > Math.PI) {
    delta -= fullTurn;
  } else if (delta < -Math.PI) {
    delta += fullTurn;
  }

  return delta;
}

export function describeArcPath({ cx, cy, radius, startAngle, endAngle, sweepFlag }) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);

  const delta =
    sweepFlag === 1
      ? clockwiseDelta(startAngle, endAngle)
      : clockwiseDelta(endAngle, startAngle);

  const largeArcFlag = delta > Math.PI ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

export function describeDonutArc({ cx, cy, innerRadius, outerRadius, startAngle, endAngle }) {
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

export function describeQuadraticPath(from, control, to) {
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

export function getQuadraticPoint(from, control, to, t) {
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

export function getTextDirection(segment) {
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

export function sanitizeForId(value) {
  return String(value || "note").replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function splitLabelIntoLines(label, maxCharsPerLine, maxLines = 3) {
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

export function buildArcSegments({ items, getWeight, getKey, segmentGap = SEGMENT_GAP }) {
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

export function computeNoteAngularWeight({ ideaCount, totalIdeas, segmentGap = SEGMENT_GAP }) {
  if (ideaCount <= 0 || totalIdeas <= 0) return 0;

  const ideaSliceAngle = (2 * Math.PI) / totalIdeas;
  return Math.max(ideaCount * ideaSliceAngle - segmentGap, 0);
}

export function buildConceptPairKey(fromIdeaKey, toIdeaKey) {
  return [fromIdeaKey, toIdeaKey].sort().join("__");
}

export function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest("[data-mindmap-interactive='true']"));
}
