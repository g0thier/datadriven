import { describe, expect, it, vi } from "vitest";
import {
  getWorkshopTimeZoneOptions,
  resolveDefaultWorkshopTimeZone,
  toWorkshopStartIso,
} from "../../src/utils/workshopDateTime.js";

describe("workshopDateTime utils", () => {
  it("resolves default timezone", () => {
    const resolvedOptionsSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
      .mockReturnValue({ timeZone: "Europe/Zurich" });
    expect(resolveDefaultWorkshopTimeZone()).toBe("Europe/Zurich");
    resolvedOptionsSpy.mockRestore();
  });

  it("returns timezone options as value/label pairs", () => {
    const options = getWorkshopTimeZoneOptions("Europe/Zurich", {
      date: "2026-07-15",
      time: "10:30",
    });

    expect(options[0].value).toBe("Europe/Zurich");
    expect(options[0].label).toContain("Europe/Zurich");
    expect(options[0].label).toContain("UTC+02:00");
    expect(options.some((option) => option.value === "UTC")).toBe(true);
  });

  it("converts local workshop date/time with IANA timezone (winter vs summer)", () => {
    const winterIso = toWorkshopStartIso("2026-01-15", "10:30", "Europe/Zurich");
    const summerIso = toWorkshopStartIso("2026-07-15", "10:30", "Europe/Zurich");

    expect(winterIso).toBe("2026-01-15T09:30:00.000Z");
    expect(summerIso).toBe("2026-07-15T08:30:00.000Z");
  });

  it("keeps legacy UTC offset compatibility", () => {
    const iso = toWorkshopStartIso("2026-03-25", "10:30", "UTC+01:00");
    expect(iso).toBe("2026-03-25T09:30:00.000Z");
  });

  it("returns empty string on invalid inputs", () => {
    expect(toWorkshopStartIso("bad", "10:30", "Europe/Zurich")).toBe("");
    expect(toWorkshopStartIso("2026-03-25", "10:30", "UTC+99:00")).toBe(
      "2026-03-25T10:30:00.000Z"
    );
  });
});
