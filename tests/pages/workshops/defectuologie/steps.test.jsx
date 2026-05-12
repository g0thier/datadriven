import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Step1 from "../../../../src/pages/workshops/defectuologie/steps/Step1.jsx";
import Step2 from "../../../../src/pages/workshops/defectuologie/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/defectuologie/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/defectuologie/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/defectuologie/steps/Step5.jsx";
import Step6 from "../../../../src/pages/workshops/defectuologie/steps/Step6.jsx";
import Step7 from "../../../../src/pages/workshops/defectuologie/steps/Step7.jsx";

describe("defectuologie steps", () => {
  it("renders step 1 and updates description", async () => {
    const user = userEvent.setup();
    const setStep1Description = vi.fn();

    render(
      <Step1
        sessionTitle="Defectuologie"
        step={{ label: "S1", description: ["desc"] }}
        collaboration={{ step1Description: "", actions: { setStep1Description } }}
      />
    );

    await user.type(screen.getByRole("textbox"), "Sujet");
    expect(setStep1Description).toHaveBeenCalled();
  });

  it("does not add a defect with Enter in step 2", async () => {
    const user = userEvent.setup();
    const addDefect = vi.fn(async () => "d2");

    render(
      <Step2
        step={{ label: "S2", description: [] }}
        sessionTitle="Defectuologie"
        collaboration={{
          step1Description: "Sujet",
          participant: { id: "p1" },
          activeSubgroup: { id: "group-1", label: "Sous-groupe 1" },
          activeDefects: [{ id: "d1", text: "Defaut initial", authorId: "p1" }],
          actions: {
            addDefect,
            updateDefectText: vi.fn(),
            removeDefect: vi.fn(),
          },
        }}
      />
    );

    await user.type(screen.getByDisplayValue("Defaut initial"), "{enter}");
    expect(addDefect).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(/ajouter un défaut/i));
    expect(addDefect).toHaveBeenCalledTimes(1);
  });

  it("does not add a solution with Enter in step 4", async () => {
    const user = userEvent.setup();
    const addSolution = vi.fn(async () => "sol2");

    render(
      <Step4
        step={{ label: "S4", description: [] }}
        sessionTitle="Defectuologie"
        collaboration={{
          step1Description: "Sujet",
          participant: { id: "p1" },
          activeSubgroup: { id: "group-1", label: "Sous-groupe 1" },
          selectedDefect: { id: "d1", text: "Defaut choisi" },
          activeSolutions: [{ id: "sol1", text: "Solution initiale", authorId: "p1" }],
          actions: {
            addSolution,
            updateSolutionText: vi.fn(),
            removeSolution: vi.fn(),
          },
        }}
      />
    );

    await user.type(screen.getByDisplayValue("Solution initiale"), "{enter}");
    expect(addSolution).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(/ajouter une solution/i));
    expect(addSolution).toHaveBeenCalledTimes(1);
  });

  it("renders step3..step7 in smoke mode and updates step6 proposal", async () => {
    const user = userEvent.setup();
    const setStep6Proposal = vi.fn();

    const shared = {
      step1Description: "Sujet atelier",
      participant: { id: "p1" },
      activeSubgroup: { id: "group-1", label: "Sous-groupe 1", participantIds: ["p1", "p2"] },
      activeDefects: [{ id: "d1", text: "Defaut vote", authorId: "p1" }],
      activeSolutions: [{ id: "sol1", text: "Solution votee", authorId: "p2" }],
      selectedDefect: { id: "d1", text: "Defaut vote" },
      selectedSolution: { id: "sol1", text: "Solution votee" },
      defectVotesByItem: { d1: new Set(["p1"]) },
      solutionVotesByItem: { sol1: new Set(["p2"]) },
      remainingDefectVotes: 0,
      remainingSolutionVotes: 1,
      maxStickers: 1,
      step6Proposal: "",
      resultsBySubgroup: [
        {
          subgroupId: "group-1",
          subgroupLabel: "Sous-groupe 1",
          selectedDefect: { id: "d1", text: "Defaut vote" },
          selectedSolution: { id: "sol1", text: "Solution votee" },
          proposalText: "Concept final",
          participantCount: 2,
        },
      ],
      actions: {
        toggleDefectVote: vi.fn(),
        toggleSolutionVote: vi.fn(),
        setStep6Proposal,
      },
    };

    render(
      <>
        <Step3 step={{ label: "S3", description: [] }} sessionTitle="Defectuologie" collaboration={shared} />
        <Step5 step={{ label: "S5", description: [] }} sessionTitle="Defectuologie" collaboration={shared} />
        <Step6 step={{ label: "S6", description: [] }} sessionTitle="Defectuologie" collaboration={shared} />
        <Step7 step={{ label: "S7", description: [] }} sessionTitle="Defectuologie" collaboration={shared} />
      </>
    );

    expect(screen.getByText(/vote sur les défauts/i)).toBeInTheDocument();
    expect(screen.getByText(/vote sur les solutions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/proposition/i).length).toBeGreaterThan(0);

    await user.type(
      screen.getByPlaceholderText(/formaliser la proposition finale du groupe/i),
      "Concept"
    );
    expect(setStep6Proposal).toHaveBeenCalled();
  });
});
