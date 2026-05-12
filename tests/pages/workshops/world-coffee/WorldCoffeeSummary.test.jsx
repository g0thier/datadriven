import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import WorldCoffeeSummary from "../../../../src/pages/workshops/world-coffee/WorldCoffeeSummary.jsx";

describe("WorldCoffeeSummary", () => {
  it("renders summary header and restitution content", async () => {
    const user = userEvent.setup();

    render(
      <WorldCoffeeSummary
        sessionTitle="Session World Cafe"
        collaboration={{
          syncError: "Sync issue",
          descriptions: [{ id: "d1", text: "Sujet principal" }],
          subgroups: [{ id: "group-1", label: "Sous-groupe 1", descriptionId: "d1", participantIds: ["u1", "u2"] }],
          synthesisBySubgroup: {
            "group-1": { text: "Synthese finale" },
          },
          ideasBySubgroup: {
            "group-1": [{ id: "i1", text: "Idee 1", roundId: "round-1" }],
          },
          commentsByIdea: {
            i1: [{ id: "c1", text: "Commentaire 1", roundId: "round-2" }],
          },
          repliesByComment: {
            c1: [{ id: "r1", text: "Reponse 1", roundId: "round-3" }],
          },
        }}
      />
    );

    expect(screen.getByText("Session World Cafe")).toBeInTheDocument();
    expect(screen.getByText(/atelier termin/i)).toBeInTheDocument();
    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();
    expect(screen.getByText(/sujet principal/i)).toBeInTheDocument();
    expect(screen.getByText(/synthese finale/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(screen.getByText(/idee 1/i)).toBeInTheDocument();
    expect(screen.getByText(/commentaire 1/i)).toBeInTheDocument();
    expect(screen.getByText(/reponse 1/i)).toBeInTheDocument();
  });
});
