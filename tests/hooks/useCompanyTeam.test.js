import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../helpers/renderHook.js";

let authCallback;

const teamServiceMocks = {
  createDepartment: vi.fn(),
  createMember: vi.fn(),
  createOffice: vi.fn(),
  deleteDepartment: vi.fn(),
  deleteMember: vi.fn(),
  deleteOffice: vi.fn(),
  editDepartment: vi.fn(),
  editMember: vi.fn(),
  editOffice: vi.fn(),
  getUserCompanyId: vi.fn(),
  onAuthStateChangedListener: vi.fn((cb) => {
    authCallback = cb;
    return () => {};
  }),
  watchCompanyDepartments: vi.fn((companyId, cb) => {
    if (companyId === "c1") cb([{ id: "d1", name: "RH" }]);
    return () => {};
  }),
  watchCompanyMembers: vi.fn((companyId, cb) => {
    if (companyId === "c1") {
      cb([{ id: "m1", firstName: "Ada", lastName: "Lovelace", departments: ["d1"] }]);
    }
    return () => {};
  }),
  watchCompanyOffices: vi.fn((companyId, cb) => {
    if (companyId === "c1") cb([{ id: "o1", alias: "HQ", isDefault: true }]);
    return () => {};
  }),
};

vi.mock("../../src/services/teamService", () => teamServiceMocks);

describe("useCompanyTeam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teamServiceMocks.getUserCompanyId.mockResolvedValue("c1");
    teamServiceMocks.createOffice.mockResolvedValue("o2");
    teamServiceMocks.createDepartment.mockResolvedValue("d2");
  });

  it("hydrates company entities and supports mutations", async () => {
    const { default: useCompanyTeam } = await import("../../src/hooks/useCompanyTeam.js");
    const hook = await renderHook(() => useCompanyTeam());

    await act(async () => {
      await authCallback({ uid: "u1" });
    });

    await waitFor(() => {
      expect(hook.result.companyId).toBe("c1");
      expect(hook.result.officeLocations).toHaveLength(1);
      expect(hook.result.departments).toHaveLength(1);
      expect(hook.result.teamMembers).toHaveLength(1);
    });

    await act(async () => {
      await hook.result.addOffice();
    });

    expect(hook.result.editingOfficeId).toBe("o2");

    await act(async () => {
      await hook.result.updateMember("m1", { firstName: "Grace", lastName: "Hopper" });
    });

    expect(hook.result.teamMembers[0].name).toBe("Grace Hopper");

    await act(async () => {
      await hook.result.removeDepartment("d1");
    });

    expect(hook.result.teamMembers[0].departments).toEqual([]);

    await hook.unmount();
  });
});
