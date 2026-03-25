import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "../../src/pages/NotFound.jsx";

describe("NotFound page", () => {
  it("renders default fail code", () => {
    render(<NotFound />);
    expect(screen.getByText("FAIL")).toBeInTheDocument();
  });

  it("renders custom code", () => {
    render(<NotFound code="404" />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});
