import { describe, expect, it } from "vitest";
import { designThinking } from "../../../../src/pages/workshops/design-thinking/data.js";

describe("design-thinking/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(designThinking.id).toBe("design-thinking");
    expect(Array.isArray(designThinking.steps)).toBe(true);
    expect(designThinking.steps.length).toBe(10);

    designThinking.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });
});
