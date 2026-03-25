import { describe, expect, it } from "vitest";
import {
  getDeptLabel,
  getId,
  getMemberLabel,
  normalizeDepartments,
  normalizeMembers,
  toggleInArray,
} from "../../src/utils/workshopInvitationNormalizers.js";

describe("workshopInvitationNormalizers", () => {
  it("resolves ids and labels", () => {
    expect(getId({ uid: "x" }, 1)).toBe("1");
    expect(getDeptLabel({ title: "Produit" })).toBe("Produit");
    expect(getMemberLabel({ firstName: "Ada", lastName: "Lovelace" })).toContain("Ada Lovelace");
  });

  it("normalizes departments and members", () => {
    expect(normalizeDepartments([{ name: "RH" }])[0]).toMatchObject({ __id: "0", __label: "RH" });
    expect(normalizeMembers([{ email: "a@b.com", name: "Ada" }])[0].__label).toContain("a@b.com");
  });

  it("toggles id in array", () => {
    expect(toggleInArray(["a"], "a")).toEqual([]);
    expect(toggleInArray(["a"], "b")).toEqual(["a", "b"]);
  });
});
