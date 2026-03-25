import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../../helpers/renderHook.js";

let authCallback;

const getUserCompanyId = vi.fn();
const onAuthStateChangedListener = vi.fn((cb) => {
  authCallback = cb;
  return () => {};
});
const subscribeCompanyMembers = vi.fn((companyId, cb) => {
  if (companyId === "c1") {
    cb([
      { id: "m1", firstName: "Ada", lastName: "Lovelace", role: "colab", email: "a@b.com" },
      { id: "m2", firstName: "Owner", role: "owner" },
    ]);
  }
  return () => {};
});
const upsertCompanyManagerPermissions = vi.fn();
const updateCompanyMember = vi.fn();

vi.mock("../../../src/firebase", () => ({
  getUserCompanyId,
  onAuthStateChangedListener,
  subscribeCompanyMembers,
  upsertCompanyManagerPermissions,
  updateCompanyMember,
}));

describe("useCompanyCollaborators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserCompanyId.mockResolvedValue("c1");
  });

  it("loads collaborators and promotes one", async () => {
    const { default: useCompanyCollaborators } = await import(
      "../../../src/hooks/management/useCompanyCollaborators.js"
    );

    const hook = await renderHook(() => useCompanyCollaborators());

    await act(async () => {
      await authCallback({ uid: "u1" });
    });

    await waitFor(() => {
      expect(hook.result.collaborators).toHaveLength(1);
    });

    await act(async () => {
      await hook.result.promoteCollaborator("m1");
    });

    expect(updateCompanyMember).toHaveBeenCalledWith("c1", "m1", { role: "leader" });
    expect(upsertCompanyManagerPermissions).toHaveBeenCalledWith("c1", "m1", { role: "leader" });

    await hook.unmount();
  });
});
