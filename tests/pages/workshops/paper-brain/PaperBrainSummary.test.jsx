import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaperBrainSummary from "../../../../src/pages/workshops/paper-brain/Summary.jsx";

describe("PaperBrainSummary", () => {
  it("renders ranked voted notes and sync error", () => {
    render(
      <PaperBrainSummary
        sessionTitle="Session PB"
        collaboration={{
          step1Description: "Défi",
          participant: { id: "p1" },
          syncError: "Sync issue",
          notes: [
            { id: "n1", text: "Idea 1", createdAt: "1" },
            { id: "n2", text: "Idea 2", createdAt: "2" },
          ],
          commentsByNote: {
            n1: [{ id: "c1", text: "Comment" }],
            n2: [],
          },
          votesByNote: {
            n1: new Set(["p1", "p2"]),
            n2: new Set(["p3"]),
          },
        }}
      />
    );

    expect(screen.getByText("Session PB")).toBeInTheDocument();
    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();
    expect(screen.getByText(/résultats votés/i)).toBeInTheDocument();
    expect(screen.getByText(/idea 1/i)).toBeInTheDocument();
  });
});
