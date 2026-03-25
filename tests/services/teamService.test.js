import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = { currentUser: null };
const mockFns = {
  addCompanyOffice: vi.fn(),
  addCompanyDepartment: vi.fn(),
  getUserCompanyId: vi.fn(),
  onAuthStateChangedListener: vi.fn(),
  removeCompanyOffice: vi.fn(),
  removeCompanyDepartment: vi.fn(),
  subscribeCompanyDepartments: vi.fn(),
  subscribeCompanyMembers: vi.fn(),
  subscribeCompanyOffices: vi.fn(),
  updateCompanyMember: vi.fn(),
  updateCompanyDepartment: vi.fn(),
  updateCompanyOffice: vi.fn(),
};

vi.mock("../../src/firebase", () => ({
  auth: mockAuth,
  ...mockFns,
}));

describe("teamService", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockFns.subscribeCompanyOffices.mockReturnValue(() => {});
    mockFns.subscribeCompanyDepartments.mockReturnValue(() => {});
    mockFns.subscribeCompanyMembers.mockReturnValue(() => {});
  });

  it("returns noop unsubscribe when companyId is missing", async () => {
    const service = await import("../../src/services/teamService.js");

    expect(typeof service.watchCompanyOffices("", vi.fn())).toBe("function");
    expect(mockFns.subscribeCompanyOffices).not.toHaveBeenCalled();
  });

  it("creates default office and department payloads", async () => {
    mockFns.addCompanyOffice.mockResolvedValue("o1");
    mockFns.addCompanyDepartment.mockResolvedValue("d1");

    const service = await import("../../src/services/teamService.js");
    await service.createOffice("c1");
    await service.createDepartment("c1");

    expect(mockFns.addCompanyOffice).toHaveBeenCalledWith("c1", expect.objectContaining({ alias: "" }));
    expect(mockFns.addCompanyDepartment).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ name: "Nouveau département", isActive: true })
    );
  });

  it("guards createMember when companyId is missing", async () => {
    const service = await import("../../src/services/teamService.js");
    await expect(service.createMember("", {})).rejects.toThrow("createMember: companyId manquant");
  });

  it("throws auth_required on protected function when current user missing", async () => {
    vi.stubEnv("VITE_CREATE_COMPANY_MEMBER_URL", "https://example.com/create");
    mockAuth.currentUser = null;

    const service = await import("../../src/services/teamService.js");
    await expect(service.createMember("c1", { email: "x@y.z" })).rejects.toThrow("auth_required");
  });

  it("deleteMember is no-op when inputs are missing", async () => {
    const service = await import("../../src/services/teamService.js");
    await expect(service.deleteMember("", "")).resolves.toBeUndefined();
  });
});
