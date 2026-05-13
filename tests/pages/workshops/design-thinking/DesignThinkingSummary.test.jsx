import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DesignThinkingSummary from "../../../../src/pages/workshops/design-thinking/Summary.jsx";

describe("DesignThinkingSummary", () => {
  it("renders expected sections in order with sync error", () => {
    render(
      <DesignThinkingSummary
        sessionTitle="Session DT"
        collaboration={{
          description: "Défi cadré",
          sharedNotes: [
            { id: "s1", text: "Observation 1" },
            { id: "s2", text: "Observation 2" },
          ],
          problemStatement: "Comment pourrions-nous fluidifier le parcours ?",
          conclusion: "Décision finale",
          syncError: "Sync issue",
          participant: { id: "p1" },
          notes: [
            { id: "n1", text: "Idée A", createdAt: "2026-01-01T10:00:00.000Z" },
            { id: "n2", text: "Idée B", createdAt: "2026-01-01T10:05:00.000Z" },
          ],
          commentsByNote: {
            n1: [],
            n2: [{ id: "c1", text: "Commentaire" }],
          },
          votesByNote: {
            n1: new Set(["p1", "p2", "p3"]),
            n2: new Set(["p2", "p3"]),
          },
          prototypeFeedbackColumns: [
            {
              id: "works",
              label: "Ce qui fonctionne",
              noteBgClass: "bg-green-100",
              columnBgClass: "bg-green-50/70",
              borderClass: "border-green-200",
            },
            {
              id: "problems",
              label: "Ce qui pose problème",
              noteBgClass: "bg-red-100",
              columnBgClass: "bg-red-50/70",
              borderClass: "border-red-200",
            },
            {
              id: "improvements",
              label: "Ce qui peut être amélioré",
              noteBgClass: "bg-blue-100",
              columnBgClass: "bg-blue-50/70",
              borderClass: "border-blue-200",
            },
          ],
          prototypeFeedbackNotesByColumn: {
            works: [{ id: "pf1", text: "Ce qui marche" }],
            problems: [{ id: "pf2", text: "Problème clé" }],
            improvements: [{ id: "pf3", text: "Piste d'amélioration" }],
          },
        }}
      />
    );

    const challengeHeading = screen.getByRole("heading", { name: /sujet de l'atelier/i });
    const empathyHeading = screen.getByRole("heading", { name: /prises de notes \(empathie\)/i });
    const problemHeading = screen.getByRole("heading", { name: /problématique/i });
    const ideasHeading = screen.getByRole("heading", { name: /meilleures idées/i });
    const columnsHeading = screen.getByRole("heading", { name: /ce qui fonctionne/i });
    const conclusionHeading = screen.getByRole("heading", { name: /conclusion/i });

    expect(challengeHeading.compareDocumentPosition(empathyHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(empathyHeading.compareDocumentPosition(problemHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(problemHeading.compareDocumentPosition(ideasHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ideasHeading.compareDocumentPosition(columnsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(columnsHeading.compareDocumentPosition(conclusionHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();

    const bestIdeaCard = screen.getByText(/#1/i).closest("article");
    expect(bestIdeaCard).not.toBeNull();
    expect(within(bestIdeaCard).getByText(/idée a/i)).toBeInTheDocument();
  });
});
