import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../../helpers/renderHook.js";

let authCallback;

const onAuthStateChangedListener = vi.fn((cb) => {
  authCallback = cb;
  return () => {};
});
const onValue = vi.fn((refValue, cb) => {
  if (String(refValue).includes("users/")) {
    cb({ exists: () => true, val: () => ({ companyId: "c1" }) });
  } else {
    cb({
      exists: () => true,
      val: () => ({
        plan: "hello",
        employees: { u1: { role: "owner" }, u2: { role: "colab" } },
      }),
    });
  }
  return () => {};
});
const ref = vi.fn((_db, path) => path);

const createCheckoutSession = vi.fn();
const createPortalSession = vi.fn();
const persistStripeLastSessionId = vi.fn();
const readStripeLastSessionId = vi.fn(() => "sess_0");

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "?success=true&session_id=sess_1&plan=hello" }),
}));

vi.mock("firebase/database", () => ({
  onValue,
  ref,
}));

vi.mock("../../../src/firebase", () => ({
  database: {},
  onAuthStateChangedListener,
}));

vi.mock("../../../src/services/stripeService.js", () => ({
  createCheckoutSession,
  createPortalSession,
  persistStripeLastSessionId,
  readStripeLastSessionId,
}));

describe("useAbonnementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCheckoutSession.mockResolvedValue({});
    createPortalSession.mockResolvedValue({ url: "https://portal.example" });
  });

  it("hydrates status and handles checkout error", async () => {
    const { default: useAbonnementPage } = await import(
      "../../../src/hooks/management/useAbonnementPage.js"
    );

    const hook = await renderHook(() => useAbonnementPage());

    expect(hook.result.statusMessage?.variant).toBe("success");

    await act(async () => {
      authCallback({ uid: "u1" });
    });

    await waitFor(() => {
      expect(hook.result.planKey).toBe("hello");
    });

    await act(async () => {
      await hook.result.handleStartCheckout("hello");
    });

    expect(createCheckoutSession).toHaveBeenCalledWith({ planName: "hello" });
    expect(hook.result.actionError.length).toBeGreaterThan(0);

    await hook.unmount();
  });
});
