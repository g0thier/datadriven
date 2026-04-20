import { useMemo } from "react";
import {
  CENTER_X,
  CENTER_Y,
  IDEA_LINK_ANCHOR_OFFSET,
  IDEA_RING_THICKNESS,
  IDEA_WIDTH,
  MAX_IDEA_RING_RADIUS,
  MAX_NOTE_RING_RADIUS,
  MIN_IDEA_RING_RADIUS,
  MIN_NOTE_RING_RADIUS,
  NOTE_RING_BASE_ITEM_WIDTH,
  NOTE_RING_GAP,
  NOTE_RING_THICKNESS,
  buildArcSegments,
  buildConceptPairKey,
  clamp,
  computeNoteAngularWeight,
  computeRingRadius,
  getQuadraticPoint,
  polarToCartesian,
  sanitizeForId,
  shortestSignedDelta,
} from "./geometry.js";

export function useMindMapCanvasModel({ notes, commentsByNote, concepts }) {
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
        });
      });
    });

    return renderItems;
  }, [concepts, ideaAnchorByKey, ideaAnchorRadius]);

  return {
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
    totals: {
      totalIdeas,
      notesWithIdeasCount: notesWithIdeas.length,
      conceptCount: concepts.length,
      ideaCountByNote,
    },
  };
}

export default useMindMapCanvasModel;
