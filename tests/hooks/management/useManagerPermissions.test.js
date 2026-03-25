import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../../helpers/renderHook.js";

const getCompanyManagerPermissions = vi.fn();
const upsertCompanyManagerPermissions = vi.fn();

vi.mock("../../../src/firebase", () => ({
  getCompanyManagerPermissions,
  upsertCompanyManagerPermissions,
}));

const managers = [
  { permissionId: "m1", role: "leader" },
  { permissionId: "m2", role: "owner" },
];

const pageTree = [
  { path: "/management", children: [{ path: "/management/comptes" }, { path: "/management/abonnement" }] },
];

const pageLeafPaths = ["/management/comptes", "/management/abonnement"];

describe("useManagerPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCompanyManagerPermissions.mockResolvedValue({
      m1: { role: "leader", pageAccess: ["/management/comptes"] },
    });
    upsertCompanyManagerPermissions.mockResolvedValue({});
  });

  it("hydrates permissions and toggles page access", async () => {
    const { default: useManagerPermissions } = await import(
      "../../../src/hooks/management/useManagerPermissions.js"
    );

    const hook = await renderHook((props) => useManagerPermissions(props), {
      companyId: "c1",
      managers,
      pageTree,
      pageLeafPaths,
    });

    await waitFor(() => {
      expect(hook.result.selectedManagerId).toBe("m1");
    });

    await act(async () => {
      hook.result.togglePagePath("/management/abonnement");
    });

    expect(hook.result.pageAccess["/management/abonnement"]).toBe(true);

    await waitFor(() => {
      expect(upsertCompanyManagerPermissions).toHaveBeenCalled();
    });

    await hook.unmount();
  });
});
