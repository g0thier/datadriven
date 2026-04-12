import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = { currentUser: { uid: "owner" } };
const createUserWithEmailAndPassword = vi.fn();
const signOut = vi.fn();
const updateCurrentUser = vi.fn();

vi.mock("../../../src/firebase/auth/app", () => ({ auth }));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword,
  signOut,
  updateCurrentUser,
}));

describe("firebase/auth/member-auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.currentUser = { uid: "owner" };
  });

  it("validates input", async () => {
    const mod = await import("../../../src/firebase/auth/member-auth.service.js");
    await expect(mod.signUpMemberWithEmail("", "x")).rejects.toThrow();
    await expect(mod.signUpMemberWithEmail("a@b.com", "")).rejects.toThrow();
  });

  it("creates member then restores previous user", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "member" } });
    signOut.mockResolvedValue(undefined);
    updateCurrentUser.mockResolvedValue(undefined);

    const mod = await import("../../../src/firebase/auth/member-auth.service.js");
    const user = await mod.signUpMemberWithEmail("m@b.com", "pwd");

    expect(user.uid).toBe("member");
    expect(signOut).toHaveBeenCalled();
    expect(updateCurrentUser).toHaveBeenCalledWith(auth, { uid: "owner" });
  });
});
