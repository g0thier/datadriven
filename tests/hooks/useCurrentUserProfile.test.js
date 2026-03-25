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
    cb({
      exists: () => true,
      val: () => ({ firstName: "Ada", lastName: "Lovelace", companyId: "c1", officeId: "o1" }),
    });
  } else if (path.startsWith("companies/c1/addresses/")) {
    cb({ exists: () => true, val: () => ({ alias: "HQ" }) });
  } else if (path.startsWith("companies/c1")) {
    cb({ exists: () => true, val: () => ({ plan: "hello", billing: { status: "active" } }) });
  }
  return () => {};
});

vi.mock("firebase/database", () => ({ onValue, ref }));
vi.mock("../../src/firebase", () => ({ database: {}, onAuthStateChangedListener }));

describe("useCurrentUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets state for unauthenticated user", async () => {
    const { default: useCurrentUserProfile } = await import("../../src/hooks/useCurrentUserProfile.js");
    const hook = await renderHook(() => useCurrentUserProfile());

    await act(async () => {
      authCallback(null);
    });

    await waitFor(() => {
      expect(hook.result.isLoading).toBe(false);
      expect(hook.result.profile.firstName).toBe("");
    });

    await hook.unmount();
  });

  it("hydrates profile and subscription from snapshots", async () => {
    const { default: useCurrentUserProfile } = await import("../../src/hooks/useCurrentUserProfile.js");
    const hook = await renderHook(() => useCurrentUserProfile());

    await act(async () => {
      authCallback({ uid: "u1", email: "ada@example.com", displayName: "Ada Lovelace" });
    });

    await waitFor(() => {
      expect(hook.result.profile.firstName).toBe("Ada");
      expect(hook.result.profile.officeLocation).toBe("HQ");
      expect(hook.result.subscription.planKey).toBe("hello");
    });

    await hook.unmount();
  });
});
