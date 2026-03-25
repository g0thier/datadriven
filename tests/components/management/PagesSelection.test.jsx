import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PagesSelection from "../../../src/components/management/PagesSelection.jsx";

describe("PagesSelection", () => {
  it("calls toggles and supports owner-disabled state", async () => {
    const user = userEvent.setup();
    const onToggleLevel1 = vi.fn();
    const onToggleLevel2 = vi.fn();

    const pageTree = [{ path: "/management", children: [{ path: "/management/comptes" }] }];
    const getPathDisplayMeta = (path) =>
      path === "/management"
        ? { label: "Management", icon: "shield_person" }
        : { label: "Comptes", icon: "account_circle" };

    const { rerender } = render(
      <PagesSelection
        pageTree={pageTree}
        pageAccess={{ "/management/comptes": true }}
        isDisabled={false}
        isOwnerProfile={false}
        onToggleLevel1={onToggleLevel1}
        onToggleLevel2={onToggleLevel2}
        getPathDisplayMeta={getPathDisplayMeta}
      />
    );

    await user.click(screen.getByRole("button", { name: /management/i }));
    await user.click(screen.getByRole("checkbox"));

    expect(onToggleLevel1).toHaveBeenCalledWith(pageTree[0]);
    expect(onToggleLevel2).toHaveBeenCalledWith("/management/comptes");

    rerender(
      <PagesSelection
        pageTree={pageTree}
        pageAccess={{}}
        isDisabled={false}
        isOwnerProfile
        onToggleLevel1={onToggleLevel1}
        onToggleLevel2={onToggleLevel2}
        getPathDisplayMeta={getPathDisplayMeta}
      />
    );

    expect(screen.getByRole("button", { name: /management/i })).toBeDisabled();
  });
});
