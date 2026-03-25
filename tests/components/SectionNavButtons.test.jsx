import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const useRouteAuthorizationMock = vi.fn();

vi.mock("../../src/hooks/useRouteAuthorization.js", () => ({
  default: () => useRouteAuthorizationMock(),
}));

vi.mock("../../src/components/MaterialIcon.jsx", () => ({
  default: ({ name }) => <span>{name}</span>,
}));

import SectionNavButtons from "../../src/components/SectionNavButtons.jsx";

describe("SectionNavButtons", () => {
  it("renders only authorized links", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: false,
      canAccessPath: vi.fn((path) => path === "/innovation/ateliers"),
      resolveBestPath: vi.fn((paths) => paths[0]),
    });

    render(
      <MemoryRouter initialEntries={["/innovation/ateliers"]}>
        <SectionNavButtons
          variant="page"
          links={[
            { to: "/innovation/ateliers", label: "Ateliers", icon: "emoji_objects", end: true },
            { to: "/management/comptes", label: "Comptes", icon: "shield_person", end: true },
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Ateliers")).toBeInTheDocument();
    expect(screen.queryByText("Comptes")).not.toBeInTheDocument();
  });

  it("returns null when no visible link", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: false,
      canAccessPath: vi.fn(() => false),
      resolveBestPath: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <SectionNavButtons links={[{ to: "/team/annuaire", label: "Annuaire", end: true }]} />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
