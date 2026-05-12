import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Step1 from "../../../../src/pages/workshops/speed-boat/steps/Step1.jsx";
import Step2 from "../../../../src/pages/workshops/speed-boat/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/speed-boat/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/speed-boat/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/speed-boat/steps/Step5.jsx";
import Step6 from "../../../../src/pages/workshops/speed-boat/steps/Step6.jsx";
import Step7 from "../../../../src/pages/workshops/speed-boat/steps/Step7.jsx";
import Step8 from "../../../../src/pages/workshops/speed-boat/steps/Step8.jsx";

describe("speed-boat steps", () => {
  it("renders step 1 and updates challenge", async () => {
    const user = userEvent.setup();
    const setStep1Description = vi.fn();

    render(
      <Step1
        sessionTitle="SB"
        step={{ label: "S1", description: ["desc"] }}
        collaboration={{ step1Description: "", actions: { setStep1Description } }}
      />
    );

    await user.type(screen.getByPlaceholderText(/écrivez ici/i), "Defi principal");
    expect(setStep1Description).toHaveBeenCalled();
  });

  it("renders step2..step8 and triggers main actions", async () => {
    const user = userEvent.setup();
    const setStep2Objective = vi.fn();
    const addBrakeNote = vi.fn(async () => "b_new");
    const updateBrakeNoteText = vi.fn();
    const removeBrakeNote = vi.fn();
    const setBrakeNotePosition = vi.fn();
    const addLeverNote = vi.fn(async () => "l_new");
    const updateLeverNoteText = vi.fn();
    const removeLeverNote = vi.fn();
    const setLeverNotePosition = vi.fn();
    const toggleBrakeVote = vi.fn();
    const setStep8BrakeAction = vi.fn();

    const brakeNotes = [
      {
        id: "b1",
        authorId: "p1",
        text: "Frein 1",
        position: { x: 10, y: 10 },
        createdAt: "2026-03-25T10:00:00.000Z",
      },
      {
        id: "b2",
        authorId: "p2",
        text: "Frein 2",
        position: { x: 30, y: 40 },
        createdAt: "2026-03-25T10:10:00.000Z",
      },
    ];

    const leverNotes = [
      {
        id: "l1",
        authorId: "p1",
        text: "Levier 1",
        position: { x: 10, y: 10 },
        createdAt: "2026-03-25T10:00:00.000Z",
      },
      {
        id: "l2",
        authorId: "p2",
        text: "Levier 2",
        position: { x: 50, y: 60 },
        createdAt: "2026-03-25T10:10:00.000Z",
      },
    ];

    const shared = {
      step1Description: "Defi atelier",
      step2Objective: "Objectif atelier",
      participant: { id: "p1" },
      myBrakeNotes: [brakeNotes[0]],
      myLeverNotes: [leverNotes[0]],
      brakeNotes,
      leverNotes,
      votesByNote: {
        b1: new Set(["p1", "p2"]),
        b2: new Set(["p3"]),
      },
      step8ActionsByBrake: { b1: "Action initiale" },
      remainingVotes: 2,
      maxStickers: 3,
      actions: {
        setStep2Objective,
        addBrakeNote,
        updateBrakeNoteText,
        removeBrakeNote,
        setBrakeNotePosition,
        addLeverNote,
        updateLeverNoteText,
        removeLeverNote,
        setLeverNotePosition,
        toggleBrakeVote,
        setStep8BrakeAction,
      },
    };

    render(
      <>
        <Step2 step={{ label: "S2", description: [] }} sessionTitle="SB" collaboration={shared} />
        <Step3
          step={{ label: "S3", description: [] }}
          sessionTitle="SB"
          collaboration={shared}
          session={{ sessionId: "s1" }}
        />
        <Step4 step={{ label: "S4", description: [] }} sessionTitle="SB" collaboration={shared} />
        <Step5
          step={{ label: "S5", description: [] }}
          sessionTitle="SB"
          collaboration={shared}
          session={{ sessionId: "s1" }}
        />
        <Step6 step={{ label: "S6", description: [] }} sessionTitle="SB" collaboration={shared} />
        <Step7 step={{ label: "S7", description: [] }} sessionTitle="SB" collaboration={shared} />
        <Step8 step={{ label: "S8", description: [] }} sessionTitle="SB" collaboration={shared} />
      </>
    );

    await user.type(screen.getByPlaceholderText(/objectif/i), " aligne");
    expect(setStep2Objective).toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText(/écrivez un frein/i), " maj");
    expect(updateBrakeNoteText).toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText(/écrivez un levier/i), " maj");
    expect(updateLeverNoteText).toHaveBeenCalled();

    await user.click(screen.getAllByLabelText(/ajouter une note/i)[0]);
    expect(addBrakeNote).toHaveBeenCalled();

    await user.click(screen.getAllByTitle(/cliquer pour ajouter\/retirer une gommette/i)[0]);
    expect(toggleBrakeVote).toHaveBeenCalled();

    await user.type(screen.getAllByPlaceholderText(/définir les actions à mener/i)[0], " ++");
    expect(setStep8BrakeAction).toHaveBeenCalled();

    expect(screen.getByText(/gommettes à distribuer/i)).toBeInTheDocument();
    expect(screen.getAllByText(/defi/i).length).toBeGreaterThan(0);
  });
});
