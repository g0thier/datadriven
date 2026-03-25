import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RouteFallback from "../../../src/components/fallback/RouteFallback.jsx";

describe("RouteFallback", () => {
  it("renders loading illustration", () => {
    render(<RouteFallback />);
    expect(screen.getByAltText(/loading animation/i)).toBeInTheDocument();
  });
});
