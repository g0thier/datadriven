import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = { currentUser: { uid: "u1" } };
const createUserWithEmailAndPassword = vi.fn();
const signInWithEmailAndPassword = vi.fn();
const signOut = vi.fn();
const sendPasswordResetEmail = vi.fn();
const onAuthStateChanged = vi.fn((_auth, cb) => {
  cb({ uid: "u1" });
  return () => {};
});

vi.mock("../../src/firebase/app", () => ({ auth }));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
}));

describe("firebase/auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs up and returns user", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "u2" } });
    const mod = await import("../../src/firebase/auth.service.js");
    const user = await mod.signUpWithEmail("a@b.com", "pwd");
    expect(user.uid).toBe("u2");
  });

  it("signs in and logs out", async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "u3" } });
    signOut.mockResolvedValue(undefined);

    const mod = await import("../../src/firebase/auth.service.js");
    await expect(mod.signInWithEmail("a@b.com", "pwd")).resolves.toMatchObject({ uid: "u3" });
    await expect(mod.logout()).resolves.toBeUndefined();
  });

  it("resets password and subscribes auth listener", async () => {
    sendPasswordResetEmail.mockResolvedValue(undefined);
    const mod = await import("../../src/firebase/auth.service.js");
    await mod.resetPassword("a@b.com");

    const cb = vi.fn();
    const unsub = mod.onAuthStateChangedListener(cb);
    expect(onAuthStateChanged).toHaveBeenCalled();
    expect(typeof unsub).toBe("function");
  });
});
