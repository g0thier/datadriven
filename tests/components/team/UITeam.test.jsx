import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ActionButton,
  CellInput,
  DepartmentsTagsEditor,
  OfficeSelect,
  TabButton,
  TableShell,
} from "../../../src/components/team/UITeam.jsx";

describe("UITeam primitives", () => {
  it("supports tab/action/input interactions", async () => {
    const user = userEvent.setup();
    const onTab = vi.fn();
    const onAction = vi.fn();
    const onInput = vi.fn();

    render(
      <>
        <TabButton active={false} onClick={onTab}>Onglet</TabButton>
        <ActionButton onClick={onAction}>Action</ActionButton>
        <CellInput value="" onChange={onInput} placeholder="Nom" />
      </>
    );

    await user.click(screen.getByRole("button", { name: "Onglet" }));
    await user.click(screen.getByRole("button", { name: "Action" }));
    await user.type(screen.getByPlaceholderText("Nom"), "Ada");

    expect(onTab).toHaveBeenCalled();
    expect(onAction).toHaveBeenCalled();
    expect(onInput).toHaveBeenCalledWith("A");
  });

  it("handles office/departments selection and table shell add", async () => {
    const user = userEvent.setup();
    const onOfficeChange = vi.fn();
    const onDepsChange = vi.fn();
    const onAdd = vi.fn();

    render(
      <>
        <OfficeSelect value={null} officeLocations={[{ id: 1, alias: "HQ" }]} onChange={onOfficeChange} />
        <DepartmentsTagsEditor value={[]} options={[{ id: 2, name: "R&D" }]} onChange={onDepsChange} />
        <TableShell title="People" onAdd={onAdd}><div>table</div></TableShell>
      </>
    );

    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(onOfficeChange).toHaveBeenCalledWith("1");
    expect(onDepsChange).toHaveBeenCalledWith([2]);
    expect(onAdd).toHaveBeenCalled();
  });
});
