import { describe, expect, it } from "vitest";
import DEFAULT_DEPARTMENTS from "../../src/constants/defaults.js";

describe("constants/defaults", () => {
  it("exports a non-empty unique list of default departments", () => {
    expect(Array.isArray(DEFAULT_DEPARTMENTS)).toBe(true);
    expect(DEFAULT_DEPARTMENTS.length).toBeGreaterThan(0);
    expect(new Set(DEFAULT_DEPARTMENTS).size).toBe(DEFAULT_DEPARTMENTS.length);
  });
});
