import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = {
  currentUser: null,
};

vi.mock("../../src/firebase", () => ({
  auth: mockAuth,
}));

describe("stripeService", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("persists and reads last session id", async () => {
    const service = await import("../../src/services/stripeService.js");

    service.persistStripeLastSessionId("sess_123");
    expect(service.readStripeLastSessionId()).toBe("sess_123");
  });

  it("throws auth_required when no current user", async () => {
    mockAuth.currentUser = null;
    const service = await import("../../src/services/stripeService.js");

    await expect(service.createCheckoutSession({ planName: "Startup" })).rejects.toThrow(
      "auth_required"
    );
  });

  it("calls checkout endpoint and returns body", async () => {
    vi.stubEnv("VITE_STRIPE_CREATE_CHECKOUT_SESSION_URL", "https://example.com/checkout");
    mockAuth.currentUser = { getIdToken: vi.fn().mockResolvedValue("token") };

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: "https://stripe.test/session" }),
    });

    const service = await import("../../src/services/stripeService.js");
    const response = await service.createCheckoutSession({ planName: "Hello" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(response.url).toBe("https://stripe.test/session");
  });
});
