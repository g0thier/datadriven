import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WorkshopStepLayout from "../../src/workshops/WorkshopStepLayout.jsx";

describe("WorkshopStepLayout", () => {
  it("renders title, step label, description and children", () => {
    render(
      <WorkshopStepLayout title="Atelier" stepLabel="Step 1" description={["A", "B"]}>
        <div>CONTENT</div>
      </WorkshopStepLayout>
    );

    expect(screen.getByText("Atelier")).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("CONTENT")).toBeInTheDocument();
  });
});
