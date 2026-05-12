import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SixHatsSummary from "../../../../src/pages/workshops/six-hats/Summary.jsx";

describe("SixHatsSummary", () => {
  it("renders summary content and hides empty list items", () => {
    render(
      <SixHatsSummary
        sessionTitle="Session Six Hats"
        collaboration={{
          step1Description: "Sujet initial",
          blueConclusion: "Conclusion finale",
          syncError: "Sync issue",
          itemsByHat: {
            white: [
              { id: "w1", text: "Fait 1" },
              { id: "w2", text: "   " },
            ],
            red: [{ id: "r1", text: "Ressenti" }],
            black: [],
            yellow: [],
            green: [],
          },
        }}
      />
    );

    expect(screen.getByText("Session Six Hats")).toBeInTheDocument();
    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sujet de l'atelier/i })).toBeInTheDocument();
    expect(screen.getByText(/sujet initial/i)).toBeInTheDocument();
    expect(screen.getByText("Fait 1")).toBeInTheDocument();
    expect(screen.queryByText(/^-\s*$/)).not.toBeInTheDocument();
    expect(screen.getByText(/conclusion finale/i)).toBeInTheDocument();
  });
});
