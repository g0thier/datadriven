import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const demoteManager = vi.fn();
const promoteCollaborator = vi.fn();
const togglePagePath = vi.fn();

vi.mock("../../../src/hooks/management/useCompanyManagers", () => ({
  default: () => ({
    companyId: "c1",
    managers: [{ permissionId: "m1", name: "Ada" }],
    demoteManager,
    demotingManagerId: "",
    demotionError: "",
  }),
}));

vi.mock("../../../src/hooks/management/useCompanyCollaborators", () => ({
  default: () => ({
    collaborators: [{ collaboratorId: "c1", displayName: "Alan" }],
    promoteCollaborator,
    promotingCollaboratorId: "",
    promotionError: "",
  }),
}));

vi.mock("../../../src/hooks/management/useManagementPageTree", () => ({
  default: () => ({
    pageTree: [{ path: "/management", children: [{ path: "/management/comptes" }] }],
    pageLeafPaths: ["/management/comptes"],
    getPathDisplayMeta: () => ({ label: "Comptes", icon: "shield_person" }),
  }),
}));

vi.mock("../../../src/hooks/management/useManagerPermissions", () => ({
  default: () => ({
    selectedManagerId: "m1",
    onSelectManager: vi.fn(),
    permissionsByManager: {},
    pageAccess: { "/management/comptes": true },
    selectedManager: { permissionId: "m1", name: "Ada" },
    isOwnerProfile: false,
    isPagesSelectionDisabled: false,
    toggleLevel1Group: vi.fn(),
    togglePagePath,
    totalDepartmentsCount: 1,
    totalLevel2PagesCount: 1,
    selectedDepartmentsCount: 1,
    selectedLevel2PagesCount: 1,
  }),
}));

vi.mock("../../../src/components/Navbar.jsx", () => ({ default: () => <div>NAVBAR</div> }));
vi.mock("../../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTION</div> }));
vi.mock("../../../src/components/management/SubscriptionCapacityInline.jsx", () => ({ default: () => <div>CAPACITY</div> }));
vi.mock("../../../src/components/management/ManagersAccess.jsx", () => ({
  default: ({ onDemoteManager }) => <button onClick={() => onDemoteManager("m1")}>DEMOTE</button>,
}));
vi.mock("../../../src/components/management/CollaboratorSearchPanel.jsx", () => ({
  default: ({ onPromoteCollaborator }) => <button onClick={() => onPromoteCollaborator("c1")}>PROMOTE</button>,
}));
vi.mock("../../../src/components/management/PagesSelection.jsx", () => ({
  default: ({ onToggleLevel2 }) => <button onClick={() => onToggleLevel2("/management/comptes")}>TOGGLE</button>,
}));
vi.mock("../../../src/components/management/ManagerSummary.jsx", () => ({ default: () => <div>SUMMARY</div> }));

import Management from "../../../src/pages/management/Management.jsx";

describe("Management page", () => {
  it("wires manager/collaborator/permission actions", async () => {
    const user = userEvent.setup();
    render(<Management />);

    await user.click(screen.getByRole("button", { name: "DEMOTE" }));
    await user.click(screen.getByRole("button", { name: "PROMOTE" }));
    await user.click(screen.getByRole("button", { name: "TOGGLE" }));

    expect(demoteManager).toHaveBeenCalledWith("m1");
    expect(promoteCollaborator).toHaveBeenCalledWith("c1");
    expect(togglePagePath).toHaveBeenCalledWith("/management/comptes");
  });
});
