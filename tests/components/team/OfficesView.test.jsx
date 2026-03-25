import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import OfficesView from "../../../src/components/team/OfficesView.jsx";

describe("OfficesView", () => {
  it("supports edit/add/remove office actions", async () => {
    const user = userEvent.setup();
    const setEditingOfficeId = vi.fn();
    const addOffice = vi.fn();
    const updateOffice = vi.fn();
    const removeOffice = vi.fn();

    render(
      <OfficesView
        officeLocations={[{ id: "o1", alias: "HQ", address: "Rue", city: "Lausanne", zip: "1000", country: "CH", isDefault: false }]}
        editingOfficeId={null}
        setEditingOfficeId={setEditingOfficeId}
        addOffice={addOffice}
        updateOffice={updateOffice}
        removeOffice={removeOffice}
      />
    );

    await user.click(screen.getByRole("button", { name: "Ajouter" }));
    await user.click(screen.getByRole("button", { name: "Modifier" }));
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(addOffice).toHaveBeenCalled();
    expect(setEditingOfficeId).toHaveBeenCalledWith("o1");
    expect(removeOffice).toHaveBeenCalledWith("o1");
  });
});
