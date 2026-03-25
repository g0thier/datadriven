import { describe, expect, it } from "vitest";
import { innovationLinks, managementLinks, teamLinks } from "../../src/constants/navigationLinks.js";
import { SECTION_LINKS_BY_ROOT } from "../../src/constants/sectionLinks.js";

describe("constants/sectionLinks", () => {
  it("maps section roots to the expected link groups", () => {
    expect(SECTION_LINKS_BY_ROOT["/innovation"]).toBe(innovationLinks);
    expect(SECTION_LINKS_BY_ROOT["/team"]).toBe(teamLinks);
    expect(SECTION_LINKS_BY_ROOT["/management"]).toBe(managementLinks);
  });
});
