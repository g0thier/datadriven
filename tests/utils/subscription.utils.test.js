import { describe, expect, it } from "vitest";
import {
  buildSubscriptionStatusMessage,
  parseSubscriptionSearch,
  resolvePlanLabel,
} from "../../src/utils/subscription.utils.js";

describe("subscription utils", () => {
  it("resolves plan label", () => {
    expect(resolvePlanLabel("HELLO")).toBe("Hello");
    expect(resolvePlanLabel("custom")).toBe("custom");
    expect(resolvePlanLabel("")).toBe("");
  });

  it("parses query string", () => {
    expect(parseSubscriptionSearch("?success=true&plan=freelance&session_id=s_1")).toEqual({
      isSuccess: true,
      isCanceled: false,
      mode: "",
      sessionIdFromQuery: "s_1",
      planLabel: "Freelance",
    });
  });

  it("builds status messages", () => {
    expect(
      buildSubscriptionStatusMessage({
        isSuccess: true,
        isCanceled: false,
        mode: "direct_activation",
        planLabel: "Startup",
      })?.variant
    ).toBe("success");

    expect(
      buildSubscriptionStatusMessage({
        isSuccess: false,
        isCanceled: true,
        mode: "",
        planLabel: "",
      })?.variant
    ).toBe("warning");

    expect(
      buildSubscriptionStatusMessage({
        isSuccess: false,
        isCanceled: false,
        mode: "",
        planLabel: "",
      })
    ).toBeNull();
  });
});
