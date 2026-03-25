import { describe, expect, it } from "vitest";
import {
  getSectionRootPath,
  isRouteAllowedForRole,
  normalizeLeaderPageAccess,
  normalizePath,
  normalizePathList,
  resolveAuthorizedTargetPath,
  resolveFirstAllowedPath,
} from "../../src/utils/routeAccess.utils.js";

describe("routeAccess utils", () => {
  it("normalizes paths", () => {
    expect(normalizePath(" /team/annuaire/?x=1 ")).toBe("/team/annuaire");
    expect(normalizePath("team")).toBe("");
  });

  it("normalizes path list and deduplicates", () => {
    expect(normalizePathList(["/a", "/a/", "", " /b "])).toEqual(["/a", "/b"]);
  });

  it("extracts section root", () => {
    expect(getSectionRootPath("/management/comptes")).toBe("/management");
    expect(getSectionRootPath("/")).toBe("");
  });

  it("normalizes leader access object and array", () => {
    expect(normalizeLeaderPageAccess(["/management/comptes", "/management/comptes/"])).toEqual([
      "/management/comptes",
    ]);

    expect(
      normalizeLeaderPageAccess({
        "/management/comptes": true,
        "/management/abonnement": false,
      })
    ).toEqual(["/management/comptes"]);
  });

  it("authorizes by role and over-capacity rules", () => {
    expect(isRouteAllowedForRole({ role: "owner", path: "/team" })).toBe(true);
    expect(isRouteAllowedForRole({ role: "colab", path: "/team" })).toBe(false);
    expect(
      isRouteAllowedForRole({
        role: "leader",
        path: "/management/comptes",
        leaderPageAccess: ["/management/comptes"],
      })
    ).toBe(true);

    expect(
      isRouteAllowedForRole({
        role: "leader",
        path: "/innovation/ateliers",
        leaderPageAccess: ["/innovation/ateliers"],
        isSubscriptionOverCapacity: true,
      })
    ).toBe(false);
  });

  it("resolves first allowed and authorized target paths", () => {
    const candidatePaths = ["/team", "/soon", "/management/comptes"];

    expect(resolveFirstAllowedPath({ role: "colab", candidatePaths })).toBe("/soon");

    expect(
      resolveAuthorizedTargetPath({
        targetPath: "/team",
        role: "colab",
        candidatePaths,
      })
    ).toBe("/soon");
  });
});
