import React from "react";
import { act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
let authCb;
const firebaseMock = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  onAuthStateChangedListener: vi.fn((cb) => {
    authCb = cb;
    return () => {};
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../../src/firebase", () => ({
  signInWithEmail: firebaseMock.signInWithEmail,
  onAuthStateChangedListener: firebaseMock.onAuthStateChangedListener,
}));

import Login from "../../../src/pages/auth/Login.jsx";

describe("Login page", () => {
  it("handles email->password flow and submit", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/exemple.com/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continuer/i }));

    await user.type(screen.getByPlaceholderText(/mot de passe/i), "12345678");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(firebaseMock.signInWithEmail).toHaveBeenCalledWith(
      "ada@example.com",
      "12345678"
    );
  });

  it("redirects when auth listener gets user", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await act(async () => {
      authCb({ uid: "u1" });
    });

    expect(navigateMock).toHaveBeenCalledWith("/innovation", { replace: true });
  });
});
