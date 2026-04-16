import { describe, expect, it } from "vitest";
import { sixChapeauxBono } from "../../../../src/pages/workshops/six-hats/data.js";

describe("six-hats/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(sixChapeauxBono.id).toBe("six-chapeaux-bono");
    expect(Array.isArray(sixChapeauxBono.steps)).toBe(true);
    expect(sixChapeauxBono.steps.length).toBe(7);

    sixChapeauxBono.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });
});
