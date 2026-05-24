import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ContinueStopTrySummary from "../../../../src/pages/workshops/continue-stop-try/Summary.jsx";

describe("ContinueStopTrySummary", () => {
  it("renders challenge, voted notes and sync error", () => {
    render(
      <MemoryRouter>
        <ContinueStopTrySummary
          sessionTitle="Session CST"
          collaboration={{
            description: "Ameliorer la collaboration d'equipe",
            participant: { id: "p1" },
            syncError: "Sync issue",
            notes: [
              {
                id: "n1",
                columnId: "continue",
                text: "Daily court",
                createdAt: "2026-03-25T10:00:00.000Z",
              },
              {
                id: "n2",
                columnId: "stop",
                text: "Meetings trop longues",
                createdAt: "2026-03-25T10:10:00.000Z",
              },
            ],
            votesByNote: {
              n1: new Set(["p1", "p2"]),
              n2: new Set(["p3"]),
            },
            placeholdersByColumn: {
              continue: "Maintenir le rituel quotidien",
              stop: "Limiter les reunions a 30 minutes",
              try: "",
            },
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Session CST")).toBeInTheDocument();
    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sujet de l'atelier/i })).toBeInTheDocument();
    expect(screen.getByText(/daily court/i)).toBeInTheDocument();
    expect(screen.getByText(/meetings trop longues/i)).toBeInTheDocument();
  });
});
