import { describe, expect, it } from "vitest";
import continueArreteTente from "../../../../src/pages/workshops/continue-stop-try/data.js";

describe("continue-stop-try/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(continueArreteTente.id).toBe("continue-arrete-tente");
    expect(Array.isArray(continueArreteTente.steps)).toBe(true);
    expect(continueArreteTente.steps.length).toBe(5);

    continueArreteTente.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });
});

