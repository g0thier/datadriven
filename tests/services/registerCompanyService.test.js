import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignUpWithEmail = vi.fn();
const mockCreateCompany = vi.fn();

vi.mock("../../src/firebase", () => ({
  signUpWithEmail: mockSignUpWithEmail,
  createCompany: mockCreateCompany,
}));

describe("registerCompanyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates auth user then company", async () => {
    const user = { uid: "u1", email: "a@b.com" };
    const payload = { company: { name: "ACME" } };

    mockSignUpWithEmail.mockResolvedValue(user);
    mockCreateCompany.mockResolvedValue({ ok: true });

    const { registerCompanyAccount } = await import("../../src/services/registerCompanyService.js");
    const result = await registerCompanyAccount({ email: user.email, password: "12345678", payload });

    expect(mockSignUpWithEmail).toHaveBeenCalledWith(user.email, "12345678");
    expect(mockCreateCompany).toHaveBeenCalledWith("u1", payload);
    expect(result).toEqual({ user, result: { ok: true } });
  });

  it("throws when sign-up returns no user", async () => {
    mockSignUpWithEmail.mockResolvedValue(null);

    const { registerCompanyAccount } = await import("../../src/services/registerCompanyService.js");
    await expect(
      registerCompanyAccount({ email: "a@b.com", password: "12345678", payload: {} })
    ).rejects.toThrow("Utilisateur introuvable après inscription.");
  });
});
