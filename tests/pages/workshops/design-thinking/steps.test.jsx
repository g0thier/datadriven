import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Step1 from "../../../../src/pages/workshops/design-thinking/steps/Step1.jsx";
import Step2 from "../../../../src/pages/workshops/design-thinking/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/design-thinking/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/design-thinking/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/design-thinking/steps/Step5.jsx";
import Step6 from "../../../../src/pages/workshops/design-thinking/steps/Step6.jsx";
import Step7 from "../../../../src/pages/workshops/design-thinking/steps/Step7.jsx";
import Step8 from "../../../../src/pages/workshops/design-thinking/steps/Step8.jsx";
import Step9 from "../../../../src/pages/workshops/design-thinking/steps/Step9.jsx";
import Step10 from "../../../../src/pages/workshops/design-thinking/steps/Step10.jsx";

describe("design-thinking steps", () => {
  it("renders step 1 and updates challenge description", async () => {
    const user = userEvent.setup();
    const setStep1Description = vi.fn();

    render(
      <Step1
        sessionTitle="DT"
        step={{ label: "S1", description: ["desc"] }}
        collaboration={{ step1Description: "", actions: { setStep1Description } }}
      />
    );

    await user.type(screen.getByPlaceholderText(/écrivez votre description ici/i), "Défi");
    expect(setStep1Description).toHaveBeenCalled();
  });

  it("renders step2..step10 in smoke mode with key sections", async () => {
    const user = userEvent.setup();
    const setConclusion = vi.fn();

    const notes = [
      {
        id: "n1",
        authorId: "p1",
        text: "Top idea",
        position: { x: 10, y: 10 },
        createdAt: "2026-03-25T10:00:00.000Z",
      },
      {
        id: "n2",
        authorId: "p2",
        text: "Other idea",
        position: { x: 50, y: 50 },
        createdAt: "2026-03-25T10:10:00.000Z",
      },
    ];

    const prototypeFeedbackColumns = [
      {
        id: "works",
        label: "Ce qui fonctionne",
        noteBgClass: "bg-green-100",
        columnBgClass: "bg-green-50/70",
        borderClass: "border-green-200",
      },
      {
        id: "problems",
        label: "Ce qui pose problème",
        noteBgClass: "bg-red-100",
        columnBgClass: "bg-red-50/70",
        borderClass: "border-red-200",
      },
      {
        id: "improvements",
        label: "Ce qui peut être amélioré",
        noteBgClass: "bg-blue-100",
        columnBgClass: "bg-blue-50/70",
        borderClass: "border-blue-200",
      },
    ];

    const prototypeFeedbackNotes = [
      { id: "pf1", columnId: "works", text: "Fonctionne bien" },
      { id: "pf2", columnId: "problems", text: "Frein principal" },
      { id: "pf3", columnId: "improvements", text: "À améliorer" },
    ];

    const shared = {
      step1Description: "Défi",
      problemStatement: "Comment pourrions-nous simplifier ce parcours ?",
      conclusion: "Conclusion du groupe",
      participant: { id: "p1" },
      sharedNotes: [{ id: "s1", text: "Observation utilisateur" }],
      notes,
      myNotes: [{ ...notes[0] }],
      commentsByNote: {
        n1: [{ id: "c1", authorId: "p2", text: "Très prometteur" }],
        n2: [{ id: "c2", authorId: "p1", text: "À préciser" }],
      },
      votesByNote: {
        n1: new Set(["p1", "p2"]),
        n2: new Set(["p3"]),
      },
      remainingVotes: 2,
      maxStickers: 3,
      prototypeFeedbackColumns,
      prototypeFeedbackNotes,
      prototypeFeedbackNotesByColumn: {
        works: [prototypeFeedbackNotes[0]],
        problems: [prototypeFeedbackNotes[1]],
        improvements: [prototypeFeedbackNotes[2]],
      },
      actions: {
        addSharedNote: vi.fn(async () => "s2"),
        updateSharedNoteText: vi.fn(),
        removeSharedNote: vi.fn(),
        setProblemStatement: vi.fn(),
        setConclusion,
        addNote: vi.fn(async () => "n3"),
        updateNoteText: vi.fn(),
        removeNote: vi.fn(),
        addComment: vi.fn(async () => "c3"),
        updateCommentText: vi.fn(),
        removeComment: vi.fn(),
        setNotePosition: vi.fn(),
        toggleVote: vi.fn(),
        addPrototypeFeedbackNote: vi.fn(async () => "pf4"),
        updatePrototypeFeedbackNoteText: vi.fn(),
        removePrototypeFeedbackNote: vi.fn(),
      },
      getParticipantLabel: () => "Participant",
    };

    const stepMeta = (label) => ({ label, description: [] });

    render(
      <>
        <Step2 step={stepMeta("S2")} sessionTitle="DT" collaboration={shared} />
        <Step3 step={stepMeta("S3")} sessionTitle="DT" collaboration={shared} />
        <Step4 step={stepMeta("S4")} sessionTitle="DT" collaboration={shared} session={{ sessionId: "s1" }} />
        <Step5 step={stepMeta("S5")} sessionTitle="DT" collaboration={shared} />
        <Step6 step={stepMeta("S6")} sessionTitle="DT" collaboration={shared} />
        <Step7 step={stepMeta("S7")} sessionTitle="DT" collaboration={shared} />
        <Step8 step={stepMeta("S8")} sessionTitle="DT" collaboration={shared} />
        <Step9 step={stepMeta("S9")} sessionTitle="DT" collaboration={shared} />
        <Step10 step={stepMeta("S10")} sessionTitle="DT" collaboration={shared} />
      </>
    );

    expect(screen.getByText(/rappelez-vous : ce prototype doit être testé/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ce qui fonctionne/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ce qui pose problème/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ce qui peut être amélioré/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/top idea/i).length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText(/rédigez la conclusion du groupe/i), " finale");
    expect(setConclusion).toHaveBeenCalled();
  });
});
