import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/hooks/useCompanyTeam", () => ({
  default: () => ({
    officeLocations: [],
    departments: [],
    teamMembers: [],
    editingOfficeId: null,
    setEditingOfficeId: vi.fn(),
    editingDeptId: null,
    setEditingDeptId: vi.fn(),
    officeById: new Map(),
    deptById: new Map(),
    addOffice: vi.fn(),
    updateOffice: vi.fn(),
    removeOffice: vi.fn(),
    addDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    removeDepartment: vi.fn(),
    addMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
  }),
}));

vi.mock("../../src/components/Navbar.jsx", () => ({ default: () => <div>NAVBAR</div> }));
vi.mock("../../src/components/SectionNavButtons.jsx", () => ({ default: () => <div>SECTION</div> }));
vi.mock("../../src/components/management/SubscriptionCapacityInline.jsx", () => ({ default: () => <div>CAPACITY</div> }));
vi.mock("../../src/components/team/OfficesView.jsx", () => ({ default: () => <div>OFFICES_VIEW</div> }));
vi.mock("../../src/components/team/DepartmentsView.jsx", () => ({ default: () => <div>DEPARTMENTS_VIEW</div> }));
vi.mock("../../src/components/team/MembersView.jsx", () => ({ default: () => <div>MEMBERS_VIEW</div> }));

import Team from "../../src/pages/Team.jsx";

describe("Team page", () => {
  it("switches tabs and renders matching view", async () => {
    const user = userEvent.setup();
    render(<Team />);

    expect(screen.getByText("OFFICES_VIEW")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Équipes/i }));
    expect(screen.getByText("DEPARTMENTS_VIEW")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Personnels/i }));
    expect(screen.getByText("MEMBERS_VIEW")).toBeInTheDocument();
  });
});
