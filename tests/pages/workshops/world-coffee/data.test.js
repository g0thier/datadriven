import { describe, expect, it } from "vitest";
import { worldCafe } from "../../../../src/pages/workshops/world-coffee/data.js";

describe("world-coffee/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(worldCafe.id).toBe("world-cafe");
    expect(Array.isArray(worldCafe.steps)).toBe(true);
    expect(worldCafe.steps.length).toBe(7);

    worldCafe.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });

  it("defines expected labels and audio settings", () => {
    expect(worldCafe.steps[0].label).toMatch(/preparation|préparation/i);
    expect(worldCafe.steps[2].audioChannel).toBe("subgroup");
    expect(worldCafe.steps[6].audioChannel).toBe("general");
    expect(worldCafe.steps.every((step) => step.audioEnabled)).toBe(true);
  });
});
