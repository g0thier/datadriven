import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SpeedBoatSummary from "../../../../src/pages/workshops/speed-boat/Summary.jsx";

describe("SpeedBoatSummary", () => {
  it("renders dashboards, ranked brakes, and actions", () => {
    render(
      <SpeedBoatSummary
        sessionTitle="Session SB"
        collaboration={{
          description: "Defi atelier",
          step2Objective: "Objectif atelier",
          participant: { id: "p1" },
          syncError: "Sync issue",
          brakeNotes: [
            { id: "b1", text: "Frein prioritaire", createdAt: "1", position: { x: 10, y: 10 } },
            { id: "b2", text: "Frein secondaire", createdAt: "2", position: { x: 20, y: 20 } },
          ],
          leverNotes: [
            { id: "l1", text: "Levier 1", createdAt: "1", position: { x: 15, y: 15 } },
          ],
          votesByNote: {
            b1: new Set(["p1", "p2"]),
            b2: new Set(["p3"]),
          },
          actionsByBrake: {
            b1: "Action prioritaire",
          },
        }}
      />
    );

    expect(screen.getByText("Session SB")).toBeInTheDocument();
    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard freins/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard leviers/i)).toBeInTheDocument();
    expect(screen.getByText(/frein 1/i)).toBeInTheDocument();
    expect(screen.getByText(/action prioritaire/i)).toBeInTheDocument();
  });

  it("renders empty state for ranked brakes when no vote exists", () => {
    render(
      <SpeedBoatSummary
        sessionTitle="Session SB"
        collaboration={{
          brakeNotes: [{ id: "b1", text: "Frein", createdAt: "1" }],
          leverNotes: [],
          votesByNote: {},
          actionsByBrake: {},
        }}
      />
    );

    expect(screen.getByText(/aucun frein voté/i)).toBeInTheDocument();
  });
});
