import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ManagersAccess from "../../../src/components/management/ManagersAccess.jsx";

describe("ManagersAccess", () => {
  it("selects and demotes leader through callbacks", async () => {
    const user = userEvent.setup();
    const onSelectManager = vi.fn();
    const onDemoteManager = vi.fn();

    render(
      <ManagersAccess
        managers={[
          {
            permissionId: "m1",
            role: "leader",
            label: { title: "Ada", subtitle: "ada@example.com" },
          },
        ]}
        selectedManagerId=""
        permissionsByManager={{ m1: { pageAccess: { "/management/comptes": true } } }}
        onSelectManager={onSelectManager}
        onDemoteManager={onDemoteManager}
      />
    );

    await user.click(screen.getAllByRole("button", { name: /ada/i })[0]);
    await user.click(screen.getByRole("button", { name: /retirer ada des leaders/i }));

    expect(onSelectManager).toHaveBeenCalledWith("m1");
    expect(onDemoteManager).toHaveBeenCalledWith("m1");
  });

  it("renders empty state when managers list is empty", () => {
    render(
      <ManagersAccess
        managers={[]}
        selectedManagerId=""
        permissionsByManager={{}}
        onSelectManager={() => {}}
        onDemoteManager={() => {}}
      />
    );

    expect(screen.getByText(/aucun manager/i)).toBeInTheDocument();
  });
});
