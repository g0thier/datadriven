import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const handleBack = vi.fn();
const handleSubmit = vi.fn((e) => e.preventDefault());

vi.mock("../../../src/hooks/useRegisterCompany", () => ({
  default: () => ({
    step: 3,
    title: "Créer un compte entreprise",
    subtitle: "Test subtitle",
    form: {},
    canGoNext: true,
    isSubmitting: false,
    submitError: "Erreur test",
    updateField: vi.fn(),
    handleBack,
    handleSubmit,
  }),
}));

vi.mock("../../../src/components/auth/register-company/RegisterProgress", () => ({
  default: ({ step }) => <div>STEP:{step}</div>,
}));

vi.mock("../../../src/components/auth/register-company/RegisterCompanyForm", () => ({
  default: () => <div>FORM</div>,
}));

vi.mock("../../../src/components/auth/register-company/RegisterActions", () => ({
  default: ({ onBack }) => (
    <div>
      <button type="button" onClick={onBack}>BACK</button>
      <button type="submit">NEXT</button>
    </div>
  ),
}));

import RegisterCompany from "../../../src/pages/auth/RegisterCompany.jsx";

describe("RegisterCompany page", () => {
  it("renders hook-driven content and actions", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterCompany />
      </MemoryRouter>
    );

    expect(screen.getByText(/Créer un compte entreprise/i)).toBeInTheDocument();
    expect(screen.getByText("STEP:3")).toBeInTheDocument();
    expect(screen.getByText("Erreur test")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "BACK" }));
    expect(handleBack).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "NEXT" }));
    expect(handleSubmit).toHaveBeenCalled();
  });
});
