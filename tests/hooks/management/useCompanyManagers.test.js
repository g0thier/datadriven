import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../../helpers/renderHook.js";

let authCallback;

const getUserCompanyId = vi.fn();
const onAuthStateChangedListener = vi.fn((cb) => {
  authCallback = cb;
  return () => {};
});
const subscribeCompanyManagers = vi.fn((companyId, cb) => {
  if (companyId === "c1") {
    cb([{ id: "m1", firstName: "Ada", lastName: "Lovelace", role: "leader" }]);
  }
  return () => {};
});
const upsertCompanyManagerPermissions = vi.fn();
const updateCompanyMember = vi.fn();

vi.mock("../../../src/firebase", () => ({
  getUserCompanyId,
  onAuthStateChangedListener,
  subscribeCompanyManagers,
  upsertCompanyManagerPermissions,
  updateCompanyMember,
}));

describe("useCompanyManagers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserCompanyId.mockResolvedValue("c1");
  });

  it("loads managers and demotes one", async () => {
    const { default: useCompanyManagers } = await import(
      "../../../src/hooks/management/useCompanyManagers.js"
    );

    const hook = await renderHook(() => useCompanyManagers());

    await act(async () => {
      await authCallback({ uid: "u1" });
    });

    await waitFor(() => {
      expect(hook.result.managers.length).toBe(1);
    });

    await act(async () => {
      await hook.result.demoteManager("m1");
    });

    expect(updateCompanyMember).toHaveBeenCalledWith("c1", "m1", { role: "colab" });
    expect(upsertCompanyManagerPermissions).toHaveBeenCalledWith("c1", "m1", { role: "colab" });

    await hook.unmount();
  });
});
