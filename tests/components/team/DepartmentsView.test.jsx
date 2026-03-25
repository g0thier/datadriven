import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DepartmentsView from "../../../src/components/team/DepartmentsView.jsx";

describe("DepartmentsView", () => {
  it("supports edit/add/remove department actions", async () => {
    const user = userEvent.setup();
    const setEditingDeptId = vi.fn();
    const addDepartment = vi.fn();
    const removeDepartment = vi.fn();

    render(
      <DepartmentsView
        departments={[{ id: "d1", name: "R&D", isActive: true }]}
        editingDeptId={null}
        setEditingDeptId={setEditingDeptId}
        addDepartment={addDepartment}
        updateDepartment={vi.fn()}
        removeDepartment={removeDepartment}
      />
    );

    await user.click(screen.getByRole("button", { name: "Ajouter" }));
    await user.click(screen.getByRole("button", { name: "Modifier" }));
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(addDepartment).toHaveBeenCalled();
    expect(setEditingDeptId).toHaveBeenCalledWith("d1");
    expect(removeDepartment).toHaveBeenCalledWith("d1");
  });
});
