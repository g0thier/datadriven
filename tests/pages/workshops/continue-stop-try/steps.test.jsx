import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Step1 from "../../../../src/pages/workshops/continue-stop-try/steps/Step1.jsx";
import Step2 from "../../../../src/pages/workshops/continue-stop-try/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/continue-stop-try/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/continue-stop-try/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/continue-stop-try/steps/Step5.jsx";

describe("continue-stop-try steps", () => {
  it("renders step 1 and updates description", async () => {
    const user = userEvent.setup();
    const setStep1Description = vi.fn();

    render(
      <Step1
        sessionTitle="CST"
        step={{ label: "S1", description: ["desc"] }}
        collaboration={{ step1Description: "", actions: { setStep1Description } }}
      />
    );

    await user.type(screen.getByRole("textbox"), "Perimetre atelier");
    expect(setStep1Description).toHaveBeenCalled();
  });

  it("renders step2 and handles note actions", async () => {
    const user = userEvent.setup();
    const addNote = vi.fn(async () => "new-note");
    const updateNoteText = vi.fn();
    const removeNote = vi.fn();

    const myNotes = [
      { id: "n1", authorId: "p1", columnId: "continue", text: "Texte 1" },
      { id: "n2", authorId: "p1", columnId: "continue", text: "Texte 2" },
      { id: "n3", authorId: "p1", columnId: "stop", text: "Stop 1" },
      { id: "n4", authorId: "p1", columnId: "try", text: "Try 1" },
    ];

    render(
      <Step2
        step={{ label: "S2", description: [] }}
        sessionTitle="CST"
        session={{ sessionId: "s1" }}
        collaboration={{
          step1Description: "Sujet",
          participant: { id: "p1" },
          myNotes,
          myNotesByColumn: {
            continue: [myNotes[0], myNotes[1]],
            stop: [myNotes[2]],
            try: [myNotes[3]],
          },
          actions: {
            addNote,
            updateNoteText,
            removeNote,
          },
        }}
      />
    );

    await user.type(screen.getByDisplayValue("Texte 1"), " maj");
    expect(updateNoteText).toHaveBeenCalled();

    await user.click(screen.getByLabelText(/ajouter une note on continue/i));
    expect(addNote).toHaveBeenCalled();

    await user.click(screen.getAllByLabelText(/supprimer la note/i)[0]);
    expect(removeNote).toHaveBeenCalled();
  });

  it("renders step3..step5 and handles votes/placeholders", async () => {
    const user = userEvent.setup();
    const toggleVote = vi.fn();
    const setStep5Placeholder = vi.fn();

    const notes = [
      {
        id: "n1",
        authorId: "p1",
        columnId: "continue",
        text: "Conserver les demos",
        position: { x: 20, y: 20 },
        createdAt: "2026-03-25T10:00:00.000Z",
      },
      {
        id: "n2",
        authorId: "p2",
        columnId: "stop",
        text: "Stopper les reunions longues",
        position: { x: 20, y: 20 },
        createdAt: "2026-03-25T10:10:00.000Z",
      },
      {
        id: "n3",
        authorId: "p3",
        columnId: "try",
        text: "Tester la rotation du facilitateur",
        position: { x: 20, y: 20 },
        createdAt: "2026-03-25T10:20:00.000Z",
      },
    ];

    const shared = {
      step1Description: "Sujet atelier",
      participant: { id: "p1" },
      notes,
      notesByColumn: {
        continue: [notes[0]],
        stop: [notes[1]],
        try: [notes[2]],
      },
      votesByNote: {
        n1: new Set(["p1", "p2"]),
        n2: new Set(["p3"]),
        n3: new Set([]),
      },
      rankedNotesByColumn: {
        continue: [{ ...notes[0], stickerCount: 2 }],
        stop: [{ ...notes[1], stickerCount: 1 }],
        try: [],
      },
      remainingVotesByColumn: { continue: 2, stop: 3, try: 3 },
      maxStickers: 3,
      step5PlaceholdersByColumn: { continue: "", stop: "", try: "" },
      actions: {
        setNotePosition: vi.fn(),
        toggleVote,
        setStep5Placeholder,
      },
    };

    render(
      <>
        <Step3 step={{ label: "S3", description: [] }} sessionTitle="CST" collaboration={shared} />
        <Step4 step={{ label: "S4", description: [] }} sessionTitle="CST" collaboration={shared} />
        <Step5 step={{ label: "S5", description: [] }} sessionTitle="CST" collaboration={shared} />
      </>
    );

    expect(screen.getAllByText(/on continue \(1\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/on arrête \(1\)/i).length).toBeGreaterThan(0);

    await user.click(screen.getAllByTitle(/cliquer pour ajouter\/retirer une gommette/i)[0]);
    expect(toggleVote).toHaveBeenCalled();

    await user.type(
      screen.getAllByPlaceholderText(/définir l'engagement/i)[0],
      "On garde les demos"
    );
    expect(setStep5Placeholder).toHaveBeenCalled();
  });
});
