import { describe, expect, it } from "vitest";
import { WORKSHOPS, getWorkshop } from "../../../src/pages/workshops/index.js";

describe("workshops/index", () => {
  it("exposes workshop registry and getter", () => {
    expect(Object.keys(WORKSHOPS)).toContain("paper-brain");
    expect(getWorkshop("paper-brain")).toBe(WORKSHOPS["paper-brain"]);
    expect(getWorkshop("unknown")).toBeUndefined();
  });
});
