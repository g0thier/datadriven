import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const useRouteAuthorizationMock = vi.fn();

vi.mock("../../src/hooks/useRouteAuthorization.js", () => ({
  default: () => useRouteAuthorizationMock(),
}));

import SectionRouteRedirect from "../../src/components/SectionRouteRedirect.jsx";

function renderRedirect() {
  return render(
    <MemoryRouter initialEntries={["/management"]}>
      <Routes>
        <Route path="/management" element={<SectionRouteRedirect links={[{ to: "/management/comptes" }]} />} />
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/management/comptes" element={<div>COMPTES</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("SectionRouteRedirect", () => {
  it("shows fallback while loading", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      resolveBestPath: vi.fn(),
    });

    renderRedirect();
    expect(screen.getByAltText("Loading animation")).toBeInTheDocument();
  });

  it("redirects unauthenticated users", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      resolveBestPath: vi.fn(() => "/management/comptes"),
    });

    renderRedirect();
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("redirects to best authorized path", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      resolveBestPath: vi.fn(() => "/management/comptes"),
    });

    renderRedirect();
    expect(screen.getByText("COMPTES")).toBeInTheDocument();
  });
});
