import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../../src/firebase", () => ({ logout: logoutMock }));

vi.mock("../../src/hooks/useCurrentUserProfile", () => ({
  PROFILE_FIELDS: [
    { id: "email", key: "email", label: "Email" },
    { id: "company", key: "companyName", label: "Entreprise" },
  ],
  default: () => ({
    profile: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      companyName: "Nomades",
      jobTitle: "Leader",
      officeLocation: "Lausanne",
      profilePicture: "",
    },
    subscription: {
      planLabel: "Startup",
      status: "active",
      currentPeriodEnd: "2026-12-31",
      lastPaymentStatus: "paid",
      cancelAtPeriodEnd: false,
    },
    isLoading: false,
    loadError: "",
  }),
}));

import Profil from "../../src/components/Profil.jsx";

describe("Profil", () => {
  it("renders profile/subscription fields and logs out", async () => {
    const user = userEvent.setup();
    render(<Profil />);

    expect(screen.getByText(/mon profil/i)).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Startup")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
  });
});
