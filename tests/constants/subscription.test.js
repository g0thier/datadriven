import { describe, expect, it } from "vitest";
import {
  PLAN_LABEL_BY_KEY,
  SUBSCRIPTION_ERRORS,
  SUBSCRIPTION_MODE_DIRECT_ACTIVATION,
} from "../../src/constants/subscription.js";

describe("constants/subscription", () => {
  it("contains plan labels", () => {
    expect(PLAN_LABEL_BY_KEY.hello).toBe("Hello");
    expect(PLAN_LABEL_BY_KEY.freelance).toBe("Freelance");
  });

  it("contains mode and user-facing errors", () => {
    expect(SUBSCRIPTION_MODE_DIRECT_ACTIVATION).toBe("direct_activation");
    expect(SUBSCRIPTION_ERRORS.CHECKOUT_FAILED.length).toBeGreaterThan(0);
  });
});
