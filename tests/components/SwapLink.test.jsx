import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SwapLink from "../../src/components/SwapLink.jsx";

describe("SwapLink", () => {
  it("renders both texts and target href", () => {
    render(
      <MemoryRouter>
        <SwapLink to="/login" part1="Retour" part2="Se connecter" />
      </MemoryRouter>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/login");
    expect(screen.getByText("Retour")).toBeInTheDocument();
    expect(screen.getAllByText("Se connecter").length).toBeGreaterThan(0);
  });
});
