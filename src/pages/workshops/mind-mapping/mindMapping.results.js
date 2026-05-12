const compareByCreatedAt = (a, b) => {
  const createdA = String(a?.createdAt || "");
  const createdB = String(b?.createdAt || "");

  if (createdA !== createdB) {
    return createdA.localeCompare(createdB);
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

const resolveDisplayText = (value, fallback) => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

export const buildRankedConceptCards = ({
  notes = [],
  commentsByNote = {},
  concepts = [],
  votesByConcept = {},
  reformulationsByConcept = {},
}) => {
  const notesById = notes.reduce((accumulator, note) => {
    accumulator[note.id] = note;
    return accumulator;
  }, {});

  const ideasByNoteAndId = Object.entries(commentsByNote).reduce(
    (accumulator, [noteId, comments]) => {
      if (!Array.isArray(comments)) {
        accumulator[noteId] = {};
        return accumulator;
      }

      accumulator[noteId] = comments.reduce((commentsAccumulator, comment) => {
        commentsAccumulator[comment.id] = comment;
        return commentsAccumulator;
      }, {});

      return accumulator;
    },
    {}
  );

  return concepts
    .map((concept) => {
      const voteSet = votesByConcept[concept.id];
      const voteCount = voteSet instanceof Set ? voteSet.size : 0;

      if (voteCount <= 0) return null;

      const fromNote = notesById[concept?.from?.noteId] || null;
      const toNote = notesById[concept?.to?.noteId] || null;
      const fromIdea = ideasByNoteAndId[concept?.from?.noteId]?.[concept?.from?.ideaId] || null;
      const toIdea = ideasByNoteAndId[concept?.to?.noteId]?.[concept?.to?.ideaId] || null;
      const reformulationText = String(reformulationsByConcept?.[concept.id]?.text || "");

      return {
        concept,
        voteCount,
        reformulationText,
        fromNoteText: resolveDisplayText(fromNote?.text, "Note supprimée"),
        fromIdeaText: resolveDisplayText(fromIdea?.text, "Idée supprimée"),
        conceptText: resolveDisplayText(concept?.text, "Concept vide"),
        toIdeaText: resolveDisplayText(toIdea?.text, "Idée supprimée"),
        toNoteText: resolveDisplayText(toNote?.text, "Note supprimée"),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return compareByCreatedAt(a.concept, b.concept);
    });
};
