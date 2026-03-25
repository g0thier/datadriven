import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CompanyStep from "../../../../src/components/auth/register-company/steps/CompanyStep.jsx";
import AddressStep from "../../../../src/components/auth/register-company/steps/AddressStep.jsx";
import AdminStep from "../../../../src/components/auth/register-company/steps/AdminStep.jsx";
import SecurityStep from "../../../../src/components/auth/register-company/steps/SecurityStep.jsx";
import RecapStep from "../../../../src/components/auth/register-company/steps/RecapStep.jsx";

describe("register-company steps", () => {
  it("wires onChange in company/address/admin/security steps", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <>
        <CompanyStep form={{ companyName: "", legalForm: "", vatNumber: "", siret: "" }} onChange={onChange} />
        <AddressStep form={{ companyAddress: "", companyZip: "", companyCity: "", companyCountry: "" }} onChange={onChange} />
        <AdminStep form={{ adminFirstName: "", adminLastName: "", adminEmail: "", adminPhone: "" }} onChange={onChange} />
        <SecurityStep form={{ password: "", passwordConfirm: "x", acceptTerms: false }} onChange={onChange} />
      </>
    );

    await user.type(screen.getByPlaceholderText(/nom de l'entreprise/i), "Nomades");
    await user.type(screen.getByPlaceholderText(/adresse/i), "Rue");
    await user.type(screen.getByPlaceholderText(/^prénom$/i), "Ada");
    await user.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });

  it("renders recap data", () => {
    render(
      <RecapStep
        form={{
          companyName: "Nomades",
          companyAddress: "Rue",
          companyZip: "1000",
          companyCity: "Lausanne",
          companyCountry: "CH",
          legalForm: "SA",
          vatNumber: "VAT",
          siret: "REG",
          adminFirstName: "Ada",
          adminLastName: "Lovelace",
          adminEmail: "ada@example.com",
          adminPhone: "000",
        }}
      />
    );

    expect(screen.getByText(/récapitulatif/i)).toBeInTheDocument();
    expect(screen.getByText(/ada@example.com/i)).toBeInTheDocument();
  });
});
