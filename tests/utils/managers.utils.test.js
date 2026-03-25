import { describe, expect, it } from "vitest";
import { buildManagerList } from "../../src/utils/managers.utils.js";

describe("buildManagerList", () => {
  it("returns normalized list with permissionId and label", () => {
    const list = buildManagerList([
      { uid: "u1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
    ]);

    expect(list[0].permissionId).toBe("u1");
    expect(list[0].label.title).toBe("Ada Lovelace");
    expect(list[0].label.subtitle).toContain("ada@example.com");
  });

  it("handles invalid input", () => {
    expect(buildManagerList(null)).toEqual([]);
  });
});
