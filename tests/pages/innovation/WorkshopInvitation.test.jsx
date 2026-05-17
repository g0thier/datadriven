import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const setWorkshopDate = vi.fn();
const setWorkshopTime = vi.fn();
const toggleDepartment = vi.fn();
const toggleMember = vi.fn();
const handleSendInvites = vi.fn();

vi.mock("../../../src/hooks/useWorkshopInvitation", () => ({
  default: () => ({
    atelier: { title: "Paper Brain" },
    workshopDate: "2026-03-25",
    workshopTime: "10:30",
    workshopTimezone: "Europe/Zurich",
    setWorkshopDate,
    setWorkshopTime,
    setWorkshopTimezone: vi.fn(),
    departmentSearch: "",
    setDepartmentSearch: vi.fn(),
    search: "",
    setSearch: vi.fn(),
    departmentsNormalized: [{ __id: "d1", __label: "RH" }],
    filteredDepartments: [{ __id: "d1", __label: "RH" }],
    membersNormalized: [{ __id: "m1", __label: "Ada" }],
    filteredMembers: [{ __id: "m1", __label: "Ada" }],
    selectedDepartmentIds: [],
    selectedMemberIds: [],
    totalUniqueGuestCount: 1,
    toggleDepartment,
    toggleMember,
    canSend: true,
    isSending: false,
    inviteResultModal: { isOpen: false, variant: "success", title: "", lines: [] },
    closeInviteResultModal: vi.fn(),
    handleSendInvites,
  }),
}));

vi.mock("../../../src/components/Navbar.jsx", () => ({ default: () => <div>NAVBAR</div> }));
vi.mock("../../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTION</div> }));
vi.mock("../../../src/components/workshop-invitation", () => ({
  WorkshopHeroCard: () => <div>HERO</div>,
  WorkshopDateTimeCard: ({ onDateChange, onTimeChange }) => (
    <div>
      <button onClick={() => onDateChange("2026-03-26")}>DATE</button>
      <button onClick={() => onTimeChange("11:00")}>TIME</button>
    </div>
  ),
  DepartmentSelectorCard: ({ onToggle }) => <button onClick={() => onToggle("d1")}>DEPT</button>,
  MemberSelectorCard: ({ onToggle }) => <button onClick={() => onToggle("m1")}>MEMBER</button>,
  InvitationSummaryCard: () => <div>SUMMARY</div>,
  SendInvitesButton: ({ onClick }) => <button onClick={onClick}>SEND</button>,
  InviteSendResultModal: () => null,
}));

import WorkshopInvitation from "../../../src/pages/innovation/WorkshopInvitation.jsx";

describe("WorkshopInvitation page", () => {
  it("wires invitation actions", async () => {
    const user = userEvent.setup();
    render(<WorkshopInvitation />);

    await user.click(screen.getByRole("button", { name: "DATE" }));
    await user.click(screen.getByRole("button", { name: "TIME" }));
    await user.click(screen.getByRole("button", { name: "DEPT" }));
    await user.click(screen.getByRole("button", { name: "MEMBER" }));
    await user.click(screen.getByRole("button", { name: "SEND" }));

    expect(setWorkshopDate).toHaveBeenCalled();
    expect(setWorkshopTime).toHaveBeenCalled();
    expect(toggleDepartment).toHaveBeenCalledWith("d1");
    expect(toggleMember).toHaveBeenCalledWith("m1");
    expect(handleSendInvites).toHaveBeenCalled();
  });
});
