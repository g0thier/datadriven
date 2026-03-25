import { describe, expect, it, vi } from "vitest";

const initializeApp = vi.fn(() => ({ app: true }));
const getAuth = vi.fn(() => ({ auth: true }));
const getDatabase = vi.fn(() => ({ db: true }));

vi.mock("firebase/app", () => ({ initializeApp }));
vi.mock("firebase/auth", () => ({ getAuth }));
vi.mock("firebase/database", () => ({ getDatabase }));

describe("firebase/app", () => {
  it("initializes app and shared instances", async () => {
    const mod = await import("../../src/firebase/app.js");

    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledTimes(1);
    expect(getDatabase).toHaveBeenCalledTimes(1);
    expect(mod.auth).toEqual({ auth: true });
    expect(mod.database).toEqual({ db: true });
  });
});
