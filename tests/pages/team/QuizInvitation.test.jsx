import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const setResponseDelayDays = vi.fn();
const toggleDepartment = vi.fn();
const toggleMember = vi.fn();
const handleSendInvites = vi.fn();

vi.mock("../../../src/hooks/useQuizInvitation", () => ({
  default: () => ({
    quiz: { title: "Théorie X-Y", image: "img", description: "Desc", author: "McGregor" },
    responseDelayDays: 14,
    responseDeadline: "2026-06-01T12:00:00.000Z",
    setResponseDelayDays,
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
  DepartmentSelectorCard: ({ onToggle }) => <button onClick={() => onToggle("d1")}>DEPT</button>,
  MemberSelectorCard: ({ onToggle }) => <button onClick={() => onToggle("m1")}>MEMBER</button>,
  SendInvitesButton: ({ onClick }) => <button onClick={onClick}>SEND</button>,
  InviteSendResultModal: () => null,
}));

import QuizInvitation from "../../../src/pages/team/QuizInvitation.jsx";

describe("QuizInvitation page", () => {
  it("wires delay, selection and send actions", async () => {
    const user = userEvent.setup();
    render(<QuizInvitation />);

    await user.clear(screen.getByLabelText(/nombre de jours/i));
    await user.type(screen.getByLabelText(/nombre de jours/i), "21");
    await user.click(screen.getByRole("button", { name: "DEPT" }));
    await user.click(screen.getByRole("button", { name: "MEMBER" }));
    await user.click(screen.getByRole("button", { name: "SEND" }));

    expect(setResponseDelayDays).toHaveBeenCalled();
    expect(toggleDepartment).toHaveBeenCalledWith("d1");
    expect(toggleMember).toHaveBeenCalledWith("m1");
    expect(handleSendInvites).toHaveBeenCalled();
  });
});
