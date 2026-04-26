import { describe, expect, it } from "vitest";
import { buildRankedConceptCards } from "../../../../src/pages/workshops/mind-mapping/mindMapping.results.js";

describe("mindMapping.results", () => {
  it("builds ranked concept cards sorted by votes then createdAt", () => {
    const notes = [
      { id: "n1", text: "Note 1" },
      { id: "n2", text: "Note 2" },
    ];

    const commentsByNote = {
      n1: [{ id: "c1", text: "Idee 1" }],
      n2: [{ id: "c2", text: "Idee 2" }],
    };

    const concepts = [
      {
        id: "k1",
        text: "Concept A",
        createdAt: "2026-03-25T10:00:00.000Z",
        from: { noteId: "n1", ideaId: "c1" },
        to: { noteId: "n2", ideaId: "c2" },
      },
      {
        id: "k2",
        text: "Concept B",
        createdAt: "2026-03-25T09:00:00.000Z",
        from: { noteId: "n1", ideaId: "c1" },
        to: { noteId: "n2", ideaId: "c2" },
      },
    ];

    const ranked = buildRankedConceptCards({
      notes,
      commentsByNote,
      concepts,
      votesByConcept: {
        k1: new Set(["p1"]),
        k2: new Set(["p1", "p2"]),
      },
      reformulationsByConcept: {
        k1: { text: "Reform 1" },
      },
    });

    expect(ranked).toHaveLength(2);
    expect(ranked[0].concept.id).toBe("k2");
    expect(ranked[0].voteCount).toBe(2);
    expect(ranked[0].fromNoteText).toBe("Note 1");
    expect(ranked[1].reformulationText).toBe("Reform 1");
  });

  it("falls back to deleted placeholders when links are missing", () => {
    const ranked = buildRankedConceptCards({
      notes: [],
      commentsByNote: {},
      concepts: [
        {
          id: "k1",
          text: "",
          createdAt: "1",
          from: { noteId: "n_missing", ideaId: "c_missing" },
          to: { noteId: "n_missing_2", ideaId: "c_missing_2" },
        },
      ],
      votesByConcept: { k1: new Set(["p1"]) },
      reformulationsByConcept: {},
    });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].fromNoteText).toBe("Note supprimee");
    expect(ranked[0].fromIdeaText).toBe("Idee supprimee");
    expect(ranked[0].conceptText).toBe("Concept vide");
  });
});
