import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/pages/workshops/paper-brain/PaperBrainSummary.jsx", () => ({
  default: ({ sessionTitle }) => <div>PAPER_SUMMARY:{sessionTitle}</div>,
}));

import WorkshopSummaryPage from "../../../src/pages/workshops/WorkshopSummaryPage.jsx";

describe("WorkshopSummaryPage", () => {
  it("renders paper brain summary for paper-brain workshop", () => {
    render(
      <WorkshopSummaryPage workshopId="paper-brain" sessionTitle="Session 1" collaboration={{}} />
    );

    expect(screen.getByText("PAPER_SUMMARY:Session 1")).toBeInTheDocument();
  });

  it("renders generic summary for unknown workshop", () => {
    render(<WorkshopSummaryPage workshopId="other" sessionTitle="Session 2" collaboration={{}} />);
    expect(screen.getByText(/atelier terminé/i)).toBeInTheDocument();
  });
});
