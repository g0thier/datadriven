import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WorkshopWaitingPage from "../../src/workshops/WorkshopWaitingPage.jsx";

describe("WorkshopWaitingPage", () => {
  it("renders waiting title and countdown", () => {
    render(
      <WorkshopWaitingPage
        sessionTitle="Paper Brain"
        startAt={new Date("2026-05-01T10:00:00Z")}
        remainingMs={65000}
      />
    );

    expect(screen.getByText(/atelier en attente/i)).toBeInTheDocument();
    expect(screen.getByText(/début dans/i)).toBeInTheDocument();
  });
});
