import { describe, expect, it } from "vitest";
import mindMapping from "../../../../src/pages/workshops/mind-mapping/data.js";

describe("mind-mapping/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(mindMapping.id).toBe("mind-mapping");
    expect(Array.isArray(mindMapping.steps)).toBe(true);
    expect(mindMapping.steps.length).toBe(6);

    mindMapping.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });
});
