import { describe, expect, it } from "vitest";
import {
  buildCompanyRoleCounts,
  getCompanySubscriptionCapacity,
  isOwnerOnlyCompany,
  isRoleCountOverLimit,
  resolveCompanyPlanKey,
  resolvePlanRoleLimits,
} from "../../src/utils/subscriptionCapacity.utils.js";

describe("subscriptionCapacity utils", () => {
  it("resolves plan key from top-level and billing", () => {
    expect(resolveCompanyPlanKey({ plan: "Startup" })).toBe("startup");
    expect(resolveCompanyPlanKey({ billing: { planKey: "Hello" } })).toBe("hello");
  });

  it("builds role counts with active members only", () => {
    const counts = buildCompanyRoleCounts({
      a: { role: "owner", isActive: true },
      b: { role: "leader" },
      c: { role: "colab", isActive: false },
      d: { role: "colab" },
    });

    expect(counts).toEqual({ owner: 1, leader: 1, colab: 1 });
  });

  it("resolves plan limits and checks over-limit", () => {
    const limits = resolvePlanRoleLimits("startup");
    expect(limits.colabLimit).toBeGreaterThan(0);
    expect(isRoleCountOverLimit(2, 1)).toBe(true);
    expect(isRoleCountOverLimit(1, 1)).toBe(false);
  });

  it("detects owner-only companies", () => {
    expect(isOwnerOnlyCompany({ owner: 1, leader: 0, colab: 0 })).toBe(true);
    expect(isOwnerOnlyCompany({ owner: 1, leader: 1, colab: 0 })).toBe(false);
  });

  it("computes capacity flags", () => {
    const ownerOnly = getCompanySubscriptionCapacity({
      plan: "hello",
      employees: { u1: { role: "owner" } },
    });

    expect(ownerOnly.isOwnerOnlyCompany).toBe(true);
    expect(ownerOnly.isOverCapacity).toBe(false);

    const over = getCompanySubscriptionCapacity({
      plan: "hello",
      employees: {
        u1: { role: "owner" },
        u2: { role: "colab" },
        u3: { role: "colab" },
        u4: { role: "colab" },
        u5: { role: "colab" },
      },
    });

    expect(over.isOverCapacity).toBe(true);
    expect(over.isColabOverCapacity).toBe(true);
  });
});
