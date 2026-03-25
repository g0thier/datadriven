import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/components/ProtectedRoute.jsx", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../src/components/SectionRouteRedirect.jsx", () => ({
  default: () => <div>SECTION_REDIRECT</div>,
}));

vi.mock("../src/pages/auth/Login.jsx", () => ({ default: () => <div>LOGIN_PAGE</div> }));
vi.mock("../src/pages/auth/RegisterCompany.jsx", () => ({ default: () => <div>REGISTER_PAGE</div> }));
vi.mock("../src/pages/auth/ResetPassword.jsx", () => ({ default: () => <div>RESET_PAGE</div> }));
vi.mock("../src/pages/NotFound.jsx", () => ({ default: () => <div>NOT_FOUND_PAGE</div> }));
vi.mock("../src/pages/innovation/Innovation.jsx", () => ({ default: () => <div>INNOVATION_PAGE</div> }));

import App from "../src/App.jsx";

describe("App routing", () => {
  it("renders login route", async () => {
    window.history.pushState({}, "", "/login");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
    });
  });

  it("renders not found for unknown route", async () => {
    window.history.pushState({}, "", "/unknown-route");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("NOT_FOUND_PAGE")).toBeInTheDocument();
    });
  });
});
