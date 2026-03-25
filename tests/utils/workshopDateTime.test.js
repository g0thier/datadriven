import { describe, expect, it } from "vitest";
import {
  getWorkshopTimeZoneOptions,
  resolveDefaultWorkshopTimeZone,
  toWorkshopStartIso,
} from "../../src/utils/workshopDateTime.js";

describe("workshopDateTime utils", () => {
  it("resolves default timezone", () => {
    expect(resolveDefaultWorkshopTimeZone()).toBe("UTC+01:00");
  });

  it("returns timezone options with selected first", () => {
    const options = getWorkshopTimeZoneOptions("UTC+02:00");
    expect(options[0]).toBe("UTC+02:00");
    expect(options).toContain("UTC+00:00");
  });

  it("converts local workshop date to ISO", () => {
    const iso = toWorkshopStartIso("2026-03-25", "10:30", "UTC+01:00");
    expect(iso).toBe("2026-03-25T09:30:00.000Z");
  });

  it("returns empty string on invalid inputs", () => {
    expect(toWorkshopStartIso("bad", "10:30", "UTC+01:00")).toBe("");
    expect(toWorkshopStartIso("2026-03-25", "10:30", "UTC+99:00")).toBe(
      "2026-03-25T09:30:00.000Z"
    );
  });
});
