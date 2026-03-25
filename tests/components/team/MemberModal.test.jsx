import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MemberModal from "../../../src/components/team/MemberModal.jsx";

describe("MemberModal", () => {
  it("renders create mode and calls actions", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <MemberModal
        isOpen
        mode="create"
        form={{ firstName: "", lastName: "", email: "", phone: "", office: null, departments: [] }}
        onChangeField={vi.fn()}
        officeLocations={[]}
        departments={[]}
        submitError=""
        isSubmitting={false}
        onDelete={vi.fn()}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(/créer un membre/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Annuler" }));
    await user.click(screen.getByRole("button", { name: "Créer" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
  });
});
