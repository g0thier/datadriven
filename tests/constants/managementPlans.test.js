import { describe, expect, it } from "vitest";
import { PLANS } from "../../src/constants/managementPlans.js";

describe("constants/managementPlans", () => {
  it("contains named plans with limits", () => {
    expect(PLANS.length).toBeGreaterThanOrEqual(3);
    expect(PLANS.map((p) => p.name)).toEqual(expect.arrayContaining(["Hello", "Freelance", "Startup"]));
    expect(PLANS.every((p) => Number.isFinite(p.colab))).toBe(true);
  });
});
