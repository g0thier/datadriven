import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const useRouteAuthorizationMock = vi.fn();

vi.mock("../../src/hooks/useRouteAuthorization.js", () => ({
  default: () => useRouteAuthorizationMock(),
}));

import ProtectedRoute from "../../src/components/ProtectedRoute.jsx";

function renderProtected(initialPath = "/team") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <div>PRIVATE</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/soon" element={<div>SOON</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows fallback while loading", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      canAccessPath: vi.fn(),
      resolveTargetPath: vi.fn(),
    });

    renderProtected();
    expect(screen.getByAltText("Loading animation")).toBeInTheDocument();
  });

  it("redirects to login when unauthenticated", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      canAccessPath: vi.fn(),
      resolveTargetPath: vi.fn(),
    });

    renderProtected();
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("renders children when path is allowed", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      canAccessPath: vi.fn(() => true),
      resolveTargetPath: vi.fn(() => "/soon"),
    });

    renderProtected();
    expect(screen.getByText("PRIVATE")).toBeInTheDocument();
  });

  it("redirects to resolved target when denied", () => {
    useRouteAuthorizationMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      canAccessPath: vi.fn(() => false),
      resolveTargetPath: vi.fn(() => "/soon"),
    });

    renderProtected();
    expect(screen.getByText("SOON")).toBeInTheDocument();
  });
});
