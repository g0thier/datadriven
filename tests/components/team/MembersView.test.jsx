import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/components/team/MemberModal.jsx", () => ({
  default: ({ isOpen, mode, onChangeField, onSubmit, onDelete }) =>
    isOpen ? (
      <div>
        <button onClick={() => onChangeField?.("email", "ada@example.com")}>SET_EMAIL</button>
        <button onClick={() => onSubmit?.()}>{`SUBMIT_MODAL_${mode}`}</button>
        <button onClick={onDelete}>{`DELETE_MODAL_${mode}`}</button>
      </div>
    ) : null,
}));

import MembersView from "../../../src/components/team/MembersView.jsx";

describe("MembersView", () => {
  it("opens create modal and submits addMember", async () => {
    const user = userEvent.setup();
    const addMember = vi.fn(async () => {});

    render(
      <MembersView
        teamMembers={[]}
        addMember={addMember}
        updateMember={vi.fn()}
        removeMember={vi.fn()}
        officeLocations={[]}
        departments={[]}
        officeById={new Map()}
        deptById={new Map()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Ajouter" }));
    await user.click(screen.getByRole("button", { name: "SET_EMAIL" }));
    await user.click(screen.getByRole("button", { name: "SUBMIT_MODAL_create" }));

    expect(addMember).toHaveBeenCalled();
  });

  it("opens edit modal and can delete member", async () => {
    const user = userEvent.setup();
    const removeMember = vi.fn(async () => {});

    render(
      <MembersView
        teamMembers={[
          {
            id: "m1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            role: "leader",
            office: null,
            departments: [],
          },
        ]}
        addMember={vi.fn()}
        updateMember={vi.fn()}
        removeMember={removeMember}
        officeLocations={[]}
        departments={[]}
        officeById={new Map()}
        deptById={new Map()}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Modifier" })[0]);
    await user.click(screen.getByRole("button", { name: "DELETE_MODAL_edit" }));

    expect(removeMember).toHaveBeenCalledWith("m1");
  });
});
