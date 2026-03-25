import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RegisterCompanyForm from "../../../../src/components/auth/register-company/RegisterCompanyForm.jsx";
import RegisterActions from "../../../../src/components/auth/register-company/RegisterActions.jsx";
import RegisterProgress from "../../../../src/components/auth/register-company/RegisterProgress.jsx";

describe("register-company composed components", () => {
  it("renders the proper step content", () => {
    render(
      <RegisterCompanyForm
        step={1}
        form={{ companyName: "", legalForm: "", vatNumber: "", siret: "" }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/nom de l'entreprise/i)).toBeInTheDocument();
  });

  it("handles register actions and progress", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <>
        <RegisterActions step={2} canGoNext isSubmitting={false} onBack={onBack} />
        <RegisterProgress step={3} />
      </>
    );

    await user.click(screen.getByRole("button", { name: /retour/i }));
    expect(onBack).toHaveBeenCalled();
    expect(screen.getAllByRole("generic").length).toBeGreaterThan(0);
  });
});
