import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Step1 from "../../../../src/pages/workshops/paper-brain/steps/Step1.jsx";
import Step2 from "../../../../src/pages/workshops/paper-brain/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/paper-brain/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/paper-brain/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/paper-brain/steps/Step5.jsx";

describe("paper-brain steps", () => {
  it("renders step 1 and updates description", async () => {
    const user = userEvent.setup();
    const setStep1Description = vi.fn();

    render(
      <Step1
        sessionTitle="PB"
        step={{ label: "S1", description: ["desc"] }}
        collaboration={{ step1Description: "", actions: { setStep1Description } }}
      />
    );

    await user.type(screen.getByPlaceholderText(/écrivez votre description/i), "Défi");
    expect(setStep1Description).toHaveBeenCalled();
  });

  it("renders step2..step5 in smoke mode", async () => {
    const addNote = vi.fn(async () => "n1");

    const shared = {
      step1Description: "Défi",
      participant: { id: "p1" },
      notes: [{ id: "n1", text: "Idea", authorId: "p2", position: { x: 10, y: 10 } }],
      myNotes: [{ id: "n1", text: "Idea" }],
      commentsByNote: { n1: [{ id: "c1", text: "C", authorId: "p1" }] },
      votesByNote: { n1: new Set(["p1"]) },
      remainingVotes: 2,
      maxStickers: 3,
      actions: {
        addNote,
        updateNoteText: vi.fn(),
        removeNote: vi.fn(),
        addComment: vi.fn(),
        updateCommentText: vi.fn(),
        removeComment: vi.fn(),
        setNotePosition: vi.fn(),
        toggleVote: vi.fn(),
      },
      getParticipantLabel: () => "Participant",
    };

    render(
      <>
        <Step2 step={{ label: "S2", description: [] }} sessionTitle="PB" collaboration={shared} session={{ sessionId: "s1" }} />
        <Step3 step={{ label: "S3", description: [] }} sessionTitle="PB" collaboration={shared} />
        <Step4 step={{ label: "S4", description: [] }} sessionTitle="PB" collaboration={shared} />
        <Step5 step={{ label: "S5", description: [] }} sessionTitle="PB" collaboration={shared} />
      </>
    );

    expect(screen.getByText(/gommettes à distribuer/i)).toBeInTheDocument();
    expect(screen.getAllByText(/défi/i).length).toBeGreaterThan(0);
  });
});
