import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MindMappingSummary from "../../../../src/pages/workshops/mind-mapping/Summary.jsx";

describe("MindMappingSummary", () => {
  it("renders ranked concepts and sync error", () => {
    render(
      <MindMappingSummary
        sessionTitle="Session MM"
        collaboration={{
          description: "Sujet atelier",
          syncError: "Sync issue",
          notes: [
            { id: "n1", text: "Note 1", createdAt: "1" },
            { id: "n2", text: "Note 2", createdAt: "2" },
          ],
          commentsByNote: {
            n1: [{ id: "c1", text: "Idee 1" }],
            n2: [{ id: "c2", text: "Idee 2" }],
          },
          concepts: [
            {
              id: "k1",
              text: "Concept 1",
              createdAt: "3",
              from: { noteId: "n1", ideaId: "c1" },
              to: { noteId: "n2", ideaId: "c2" },
            },
          ],
          votesByConcept: {
            k1: new Set(["p1", "p2"]),
          },
          reformulationsByConcept: {
            k1: { text: "Reformulation finale" },
          },
        }}
      />
    );

    expect(screen.getByText("Session MM")).toBeInTheDocument();
    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sujet de l'atelier/i })).toBeInTheDocument();
    expect(screen.getByText(/concept #1/i)).toBeInTheDocument();
    expect(screen.getAllByText(/reformulation finale/i).length).toBeGreaterThan(0);
  });

  it("renders empty state when no concept is voted", () => {
    render(
      <MindMappingSummary
        sessionTitle="Session MM"
        collaboration={{
          notes: [],
          commentsByNote: {},
          concepts: [],
          votesByConcept: {},
          reformulationsByConcept: {},
        }}
      />
    );

    expect(screen.getByText(/aucun concept avec gommette/i)).toBeInTheDocument();
  });
});
