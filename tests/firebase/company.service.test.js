import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../helpers/firebaseTestUtils.js";

const get = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const update = vi.fn();

vi.mock("firebase/database", () => ({ get, push, ref, update }));
vi.mock("../../src/firebase/app", () => ({ database: {} }));

vi.mock("../../src/utils/string", () => ({
  default: (value) => String(value || "").toLowerCase().replace(/\s+/g, "-"),
}));

describe("firebase/company.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let n = 0;
    push.mockImplementation(() => ({ key: `k${++n}` }));
    update.mockResolvedValue(undefined);
    get.mockResolvedValue(makeSnapshot("c1"));
  });

  it("creates company and returns ids", async () => {
    const mod = await import("../../src/firebase/company.service.js");
    const result = await mod.createCompany("u1", {
      company: {
        name: "My Company",
        addresses: [{ alias: "HQ", city: "Lausanne" }],
        departments: ["RH"],
      },
      admin: { email: "a@b.com", firstName: "Ada", lastName: "Lovelace" },
      acceptTerms: true,
    });

    expect(result.companyId).toBe("k1");
    expect(result.slug).toContain("my-company");
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("gets user company id", async () => {
    const mod = await import("../../src/firebase/company.service.js");
    await expect(mod.getUserCompanyId("u1")).resolves.toBe("c1");
    await expect(mod.getUserCompanyId("")).resolves.toBeNull();
  });
});
