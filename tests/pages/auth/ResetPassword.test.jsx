import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const { resetPasswordMock } = vi.hoisted(() => ({ resetPasswordMock: vi.fn() }));

vi.mock("../../../src/firebase", () => ({
  resetPassword: resetPasswordMock,
}));

import ResetPassword from "../../../src/pages/auth/ResetPassword.jsx";

describe("ResetPassword page", () => {
  it("submits email and switches to sent state", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/exemple.com/i), "ada@example.com");
    await user.click(screen.getByRole("button"));

    expect(resetPasswordMock).toHaveBeenCalledWith("ada@example.com");
    expect(screen.getByText(/email envoyé/i)).toBeInTheDocument();
  });
});
