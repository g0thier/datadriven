import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Step2 from "../../../../src/pages/workshops/mind-mapping/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/mind-mapping/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/mind-mapping/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/mind-mapping/steps/Step5.jsx";
import Step6 from "../../../../src/pages/workshops/mind-mapping/steps/Step6.jsx";

describe("mind-mapping steps", () => {
  it("renders step2..step5 and handles key actions", async () => {
    const user = userEvent.setup();

    const addNote = vi.fn(async () => "n_new");
    const updateNoteText = vi.fn();
    const removeNote = vi.fn();
    const addComment = vi.fn(async () => "c_new");
    const updateCommentText = vi.fn();
    const removeComment = vi.fn();
    const toggleConceptVote = vi.fn();

    const notes = [
      { id: "n1", text: "Categorie 1", authorId: "p1", createdAt: "1" },
      { id: "n2", text: "Categorie 2", authorId: "p2", createdAt: "2" },
    ];
    const commentsByNote = {
      n1: [{ id: "c1", text: "Idee 1", authorId: "p1", createdAt: "1" }],
      n2: [{ id: "c2", text: "Idee 2", authorId: "p2", createdAt: "2" }],
    };
    const concepts = [
      {
        id: "k1",
        text: "Concept 1",
        authorId: "p1",
        from: { noteId: "n1", ideaId: "c1" },
        to: { noteId: "n2", ideaId: "c2" },
        createdAt: "3",
      },
    ];

    const shared = {
      description: "Sujet atelier",
      participant: { id: "p1" },
      notes,
      commentsByNote,
      concepts,
      votesByConcept: { k1: new Set(["p1", "p2"]) },
      remainingVotes: 2,
      maxStickers: 3,
      actions: {
        addNote,
        updateNoteText,
        removeNote,
        addComment,
        updateCommentText,
        removeComment,
        toggleConceptVote,
      },
    };

    render(
      <>
        <Step2 step={{ label: "S2", description: [] }} sessionTitle="MM" collaboration={shared} />
        <Step3 step={{ label: "S3", description: [] }} sessionTitle="MM" collaboration={shared} />
        <Step4 step={{ label: "S4", description: [] }} sessionTitle="MM" collaboration={shared} />
        <Step5 step={{ label: "S5", description: [] }} sessionTitle="MM" collaboration={shared} />
      </>
    );

    expect(screen.getByText(/gommettes a distribuer/i)).toBeInTheDocument();

    await user.type(screen.getAllByPlaceholderText(/cat[ée]gorie/i)[0], " maj");
    expect(updateNoteText).toHaveBeenCalled();

    await user.click(screen.getByLabelText(/ajouter une branche/i));
    expect(addNote).toHaveBeenCalled();

    await user.type(screen.getAllByPlaceholderText(/écrivez une id[ée]e/i)[0], " ++");
    expect(updateCommentText).toHaveBeenCalled();

    await user.click(screen.getAllByLabelText(/ajouter une id[ée]e/i)[0]);
    expect(addComment).toHaveBeenCalled();
  });

  it("renders step 6 and edits reformulation", async () => {
    const user = userEvent.setup();
    const setReformulation = vi.fn();

    const collaboration = {
      description: "Sujet atelier",
      notes: [
        { id: "n1", text: "Categorie 1", createdAt: "1" },
        { id: "n2", text: "Categorie 2", createdAt: "2" },
      ],
      commentsByNote: {
        n1: [{ id: "c1", text: "Idee 1", createdAt: "1" }],
        n2: [{ id: "c2", text: "Idee 2", createdAt: "2" }],
      },
      concepts: [
        {
          id: "k1",
          text: "Concept 1",
          from: { noteId: "n1", ideaId: "c1" },
          to: { noteId: "n2", ideaId: "c2" },
          createdAt: "3",
        },
      ],
      votesByConcept: { k1: new Set(["p1"]) },
      reformulationsByConcept: { k1: { text: "Reform existante" } },
      actions: { setReformulation },
    };

    render(
      <Step6
        step={{ label: "S6", description: [] }}
        sessionTitle="MM"
        collaboration={collaboration}
      />
    );

    await user.type(screen.getByPlaceholderText(/reformuler l'idée finale/i), " maj");
    expect(setReformulation).toHaveBeenCalled();
  });
});
