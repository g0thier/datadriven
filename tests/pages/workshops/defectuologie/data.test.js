import { describe, expect, it } from "vitest";
import defectuologie from "../../../../src/pages/workshops/defectuologie/data.js";

describe("defectuologie/data", () => {
  it("exports workshop metadata with valid steps", () => {
    expect(defectuologie.id).toBe("defectuologie");
    expect(Array.isArray(defectuologie.steps)).toBe(true);
    expect(defectuologie.steps.length).toBe(7);

    defectuologie.steps.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(Number(step.duration)).toBeGreaterThan(0);
      expect(typeof step.component).toBe("function");
    });
  });
});

