import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/workshops/useStepTimeline", () => ({
  useStepTimeline: () => ({
    elapsedMinutes: 1,
    computedSteps: [
      { label: "Défi", duration: 5, stepStart: 0, stepEnd: 5 },
      { label: "Idées", duration: 5, stepStart: 5, stepEnd: 10 },
    ],
    totalDuration: 10,
    remainingSeconds: 120,
    isFinished: false,
  }),
}));

import StepTime from "../../src/workshops/StepTime.jsx";

describe("StepTime", () => {
  it("renders workshop info and timeline", () => {
    render(
      <StepTime
        sessionData={{ image: "img", title: "Paper Brain", groupSize: "3+" }}
        startAt={new Date("2026-01-01T00:00:00Z")}
      />
    );

    expect(screen.getByText("Paper Brain")).toBeInTheDocument();
    expect(screen.getByText(/défi/i)).toBeInTheDocument();
    expect(screen.getByText(/fin dans/i)).toBeInTheDocument();
  });
});
