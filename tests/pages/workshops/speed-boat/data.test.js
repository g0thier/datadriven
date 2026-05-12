import { describe, expect, it } from "vitest";
import speedBoat from "../../../../src/pages/workshops/speed-boat/data.js";

describe("speed-boat/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(speedBoat.id).toBe("speed-boat");
    expect(Array.isArray(speedBoat.steps)).toBe(true);
    expect(speedBoat.steps.length).toBe(8);

    speedBoat.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });
});
