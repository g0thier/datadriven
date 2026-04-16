import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Step1 from "../../../../src/pages/workshops/six-hats/steps/Step1.jsx";
import Step2 from "../../../../src/pages/workshops/six-hats/steps/Step2.jsx";
import Step3 from "../../../../src/pages/workshops/six-hats/steps/Step3.jsx";
import Step4 from "../../../../src/pages/workshops/six-hats/steps/Step4.jsx";
import Step5 from "../../../../src/pages/workshops/six-hats/steps/Step5.jsx";
import Step6 from "../../../../src/pages/workshops/six-hats/steps/Step6.jsx";
import Step7 from "../../../../src/pages/workshops/six-hats/steps/Step7.jsx";

describe("six-hats steps", () => {
  it("renders step 1 and updates description", async () => {
    const user = userEvent.setup();
    const setStep1Description = vi.fn();

    render(
      <Step1
        sessionTitle="Six Hats"
        step={{ label: "S1", description: ["desc"] }}
        collaboration={{ step1Description: "", actions: { setStep1Description } }}
      />
    );

    await user.type(screen.getByPlaceholderText(/ecrivez votre sujet/i), "Sujet");
    expect(setStep1Description).toHaveBeenCalled();
  });

  it("updates and adds white hat contributions in step 2", async () => {
    const user = userEvent.setup();
    const addHatItem = vi.fn(async () => "w2");
    const updateHatItemText = vi.fn();
    const removeHatItem = vi.fn();

    render(
      <Step2
        step={{ label: "S2", description: [] }}
        sessionTitle="Six Hats"
        collaboration={{
          step1Description: "Sujet",
          participant: { id: "p1" },
          itemsByHat: {
            white: [{ id: "w1", text: "Fait initial", authorId: "p1" }],
          },
          actions: {
            addHatItem,
            updateHatItemText,
            removeHatItem,
          },
        }}
      />
    );

    await user.type(screen.getByDisplayValue("Fait initial"), " !");
    expect(updateHatItemText).toHaveBeenCalled();

    await user.click(screen.getByLabelText(/ajouter une contribution/i));
    expect(addHatItem).toHaveBeenCalledWith("white", { text: "" });

    await user.click(screen.getByLabelText(/supprimer la contribution/i));
    expect(removeHatItem).toHaveBeenCalledWith("white", "w1");
  });

  it("renders step3..step7 in smoke mode and updates blue conclusion", async () => {
    const user = userEvent.setup();
    const setBlueConclusion = vi.fn();

    const shared = {
      step1Description: "Sujet atelier",
      participant: { id: "p1" },
      blueConclusion: "",
      itemsByHat: {
        white: [{ id: "w1", text: "Fait", authorId: "p1" }],
        red: [{ id: "r1", text: "Intuition", authorId: "p2" }],
        black: [{ id: "b1", text: "Risque", authorId: "p2" }],
        yellow: [{ id: "y1", text: "Benefice", authorId: "p2" }],
        green: [{ id: "g1", text: "Idee", authorId: "p2" }],
      },
      actions: {
        addHatItem: vi.fn(),
        updateHatItemText: vi.fn(),
        removeHatItem: vi.fn(),
        setBlueConclusion,
      },
    };

    render(
      <>
        <Step3 step={{ label: "S3", description: [] }} sessionTitle="Six Hats" collaboration={shared} />
        <Step4 step={{ label: "S4", description: [] }} sessionTitle="Six Hats" collaboration={shared} />
        <Step5 step={{ label: "S5", description: [] }} sessionTitle="Six Hats" collaboration={shared} />
        <Step6 step={{ label: "S6", description: [] }} sessionTitle="Six Hats" collaboration={shared} />
        <Step7 step={{ label: "S7", description: [] }} sessionTitle="Six Hats" collaboration={shared} />
      </>
    );

    expect(screen.getAllByText(/chapeau rouge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/chapeau noir/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/chapeau bleu/i).length).toBeGreaterThan(0);

    await user.type(
      screen.getByPlaceholderText(/synthese finale, decisions et prochaines actions/i),
      "Decision"
    );
    expect(setBlueConclusion).toHaveBeenCalled();
  });
});
