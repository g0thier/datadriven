import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../helpers/renderHook.js";

let authCallback;

const onAuthStateChangedListener = vi.fn((cb) => {
  authCallback = cb;
  return () => {};
});
const ref = vi.fn((_db, path) => path);
const onValue = vi.fn((path, cb) => {
  if (path.startsWith("users/")) {
    cb({ exists: () => true, val: () => ({ role: "leader", companyId: "c1" }) });
  } else if (path.includes("managerPermissions")) {
    cb({ exists: () => true, val: () => ({ "/management/comptes": true }) });
  } else if (path.startsWith("companies/c1")) {
    cb({ exists: () => true, val: () => ({ plan: "hello", employees: { u1: { role: "owner" } } }) });
  }
  return () => {};
});

vi.mock("firebase/database", () => ({ onValue, ref }));
vi.mock("../../src/firebase", () => ({ database: {}, onAuthStateChangedListener }));

describe("useRouteAuthorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthenticated state when no user", async () => {
    const { default: useRouteAuthorization } = await import("../../src/hooks/useRouteAuthorization.js");
    const hook = await renderHook(() => useRouteAuthorization());

    await act(async () => {
      authCallback(null);
    });

    await waitFor(() => {
      expect(hook.result.isAuthenticated).toBe(false);
      expect(hook.result.role).toBe("colab");
    });

    await hook.unmount();
  });

  it("hydrates leader permissions and resolves paths", async () => {
    const { default: useRouteAuthorization } = await import("../../src/hooks/useRouteAuthorization.js");
    const hook = await renderHook(() => useRouteAuthorization());

    await act(async () => {
      authCallback({ uid: "u1" });
    });

    await waitFor(() => {
      expect(hook.result.role).toBe("leader");
      expect(hook.result.companyId).toBe("c1");
    });

    expect(hook.result.canAccessPath("/management/comptes")).toBe(true);
    expect(hook.result.resolveTargetPath("/team", ["/management/comptes", "/soon"]))
      .toBe("/management/comptes");

    await hook.unmount();
  });
});
