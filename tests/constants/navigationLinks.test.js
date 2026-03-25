import { describe, expect, it } from "vitest";
import {
  innovationLinks,
  managementLinks,
  navbarLinks,
  soonLinks,
  teamLinks,
} from "../../src/constants/navigationLinks.js";
import { SECTION_LINKS_BY_ROOT } from "../../src/constants/sectionLinks.js";

describe("constants/navigation", () => {
  it("exports link groups", () => {
    expect(navbarLinks.length).toBeGreaterThan(0);
    expect(innovationLinks.some((l) => l.to.startsWith("/innovation"))).toBe(true);
    expect(teamLinks.some((l) => l.to.startsWith("/team"))).toBe(true);
    expect(managementLinks.some((l) => l.to.startsWith("/management"))).toBe(true);
  });

  it("deduplicates soon links by label", () => {
    const labels = soonLinks.map((link) => link.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("maps section roots", () => {
    expect(SECTION_LINKS_BY_ROOT["/innovation"]).toBe(innovationLinks);
    expect(SECTION_LINKS_BY_ROOT["/team"]).toBe(teamLinks);
    expect(SECTION_LINKS_BY_ROOT["/management"]).toBe(managementLinks);
  });
});
