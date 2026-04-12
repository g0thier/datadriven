import { describe, expect, it } from "vitest";
import { paperBrain } from "../../../../src/pages/workshops/paper-brain/data.js";

describe("paper-brain/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(paperBrain.id).toBe("paper-brain");
    expect(Array.isArray(paperBrain.steps)).toBe(true);
    expect(paperBrain.steps.length).toBe(5);

    paperBrain.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });
});
