import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import InvitationSummaryCard from "../../../src/components/workshop-invitation/InvitationSummaryCard.jsx";
import WorkshopHeroCard from "../../../src/components/workshop-invitation/WorkshopHeroCard.jsx";
import SelectableCheckboxList from "../../../src/components/workshop-invitation/SelectableCheckboxList.jsx";
import InviteSendResultModal from "../../../src/components/workshop-invitation/InviteSendResultModal.jsx";
import SendInvitesButton from "../../../src/components/workshop-invitation/SendInvitesButton.jsx";
import MemberSelectorCard from "../../../src/components/workshop-invitation/MemberSelectorCard.jsx";
import DepartmentSelectorCard from "../../../src/components/workshop-invitation/DepartmentSelectorCard.jsx";
import WorkshopDateTimeCard from "../../../src/components/workshop-invitation/WorkshopDateTimeCard.jsx";

describe("workshop invitation components", () => {
  it("renders summary and hero cards", () => {
    render(
      <>
        <InvitationSummaryCard
          workshopDate="2026-04-01"
          workshopTime="10:00"
          selectedDepartmentCount={1}
          selectedMemberCount={2}
          totalGuestCount={3}
          canSend={false}
        />
        <WorkshopHeroCard atelier={{ title: "Paper Brain", duration: "45 min", groupSize: "3+" }} />
      </>
    );

    expect(screen.getByText(/récapitulatif/i)).toBeInTheDocument();
    expect(screen.getByText("Paper Brain")).toBeInTheDocument();
  });

  it("supports list/modal/button interactions", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onConfirm = vi.fn();
    const onSend = vi.fn();

    render(
      <>
        <SelectableCheckboxList
          items={[{ __id: "i1", __label: "Item 1" }]}
          selectedIds={[]}
          onToggle={onToggle}
        />
        <InviteSendResultModal isOpen variant="success" title="OK" lines={["Done"]} onConfirm={onConfirm} />
        <SendInvitesButton canSend onClick={onSend} />
      </>
    );

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /à bientôt/i }));
    await user.click(screen.getByRole("button", { name: /envoyer les invitations/i }));

    expect(onToggle).toHaveBeenCalledWith("i1");
    expect(onConfirm).toHaveBeenCalled();
    expect(onSend).toHaveBeenCalled();
  });

  it("renders member/department selectors and datetime handlers", async () => {
    const user = userEvent.setup();
    const onSearchMember = vi.fn();
    const onSearchDepartment = vi.fn();
    const onDate = vi.fn();
    const onTime = vi.fn();
    const onTimezone = vi.fn();

    render(
      <>
        <MemberSelectorCard
          items={[{ __id: "m1", __label: "Ada" }]}
          filteredItems={[{ __id: "m1", __label: "Ada" }]}
          search=""
          onSearchChange={onSearchMember}
          selectedIds={[]}
          onToggle={vi.fn()}
        />
        <DepartmentSelectorCard
          items={[{ __id: "d1", __label: "R&D" }]}
          filteredItems={[{ __id: "d1", __label: "R&D" }]}
          search=""
          onSearchChange={onSearchDepartment}
          selectedIds={[]}
          onToggle={vi.fn()}
        />
        <WorkshopDateTimeCard
          date="2026-04-01"
          time="09:00"
          timezone="Europe/Zurich"
          onDateChange={onDate}
          onTimeChange={onTime}
          onTimezoneChange={onTimezone}
        />
      </>
    );

    const searchInputs = screen.getAllByRole("textbox");
    await user.type(searchInputs[0], "ada");
    await user.type(searchInputs[1], "rd");

    const dateInput = screen.getByDisplayValue("2026-04-01");
    const timeInput = screen.getByDisplayValue("09:00");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-04-02");
    await user.clear(timeInput);
    await user.type(timeInput, "10:30");
    const timezoneSelect = screen.getByRole("combobox");
    await user.selectOptions(timezoneSelect, timezoneSelect.querySelector("option")?.value || "UTC+01:00");

    expect(onSearchMember).toHaveBeenCalled();
    expect(onSearchDepartment).toHaveBeenCalled();
    expect(onDate).toHaveBeenCalled();
    expect(onTime).toHaveBeenCalled();
    expect(onTimezone).toHaveBeenCalled();
  });
});
