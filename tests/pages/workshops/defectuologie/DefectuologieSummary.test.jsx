import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import DefectuologieSummary from "../../../../src/pages/workshops/defectuologie/Summary.jsx";

describe("DefectuologieSummary", () => {
  it("renders challenge, subgroup results and sync error", () => {
    render(
      <MemoryRouter>
        <DefectuologieSummary
          sessionTitle="Session Defectuologie"
          collaboration={{
            description: "Ameliorer la file d'attente",
            syncError: "Sync issue",
            resultsBySubgroup: [
              {
                subgroupId: "group-1",
                subgroupLabel: "Sous-groupe 1",
                selectedDefect: { id: "d1", text: "Attente trop longue" },
                selectedSolution: { id: "s1", text: "File virtuelle" },
                proposalText: "Application mobile de ticketing",
                participantCount: 4,
              },
            ],
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Session Defectuologie")).toBeInTheDocument();
    expect(screen.getByText(/sync issue/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sujet de l'atelier/i })).toBeInTheDocument();
    expect(screen.getByText(/attente trop longue/i)).toBeInTheDocument();
    expect(screen.getByText(/file virtuelle/i)).toBeInTheDocument();
  });
});
