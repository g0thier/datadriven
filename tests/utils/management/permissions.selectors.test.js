import { describe, expect, it } from "vitest";
import {
  getLevel1SelectionState,
  getLevel1TargetPaths,
  getSelectedDepartments,
  getSelectedLevel2Pages,
  getTotalLevel2PagesCount,
  isOwnerProfile,
} from "../../../src/utils/management/permissions.selectors.js";

const tree = [
  { path: "/management", children: [{ path: "/management/comptes" }, { path: "/management/abonnement" }] },
  { path: "/team", children: [] },
];

describe("permissions.selectors", () => {
  it("computes target and selection state", () => {
    expect(getLevel1TargetPaths(tree[0])).toEqual(["/management/comptes", "/management/abonnement"]);

    const state = getLevel1SelectionState(tree[0], {
      "/management/comptes": true,
      "/management/abonnement": false,
    });

    expect(state).toMatchObject({ hasAny: true, allSelected: false, selectedCount: 1, totalCount: 2 });
  });

  it("computes selected paths and counters", () => {
    const pageAccess = {
      "/management/comptes": true,
      "/management/abonnement": false,
      "/team": true,
    };

    expect(getTotalLevel2PagesCount(tree)).toBe(2);
    expect(getSelectedDepartments(tree, pageAccess)).toEqual(["/management", "/team"]);
    expect(getSelectedLevel2Pages(tree, pageAccess)).toEqual(["/management/comptes", "/team"]);
  });

  it("detects owner profile", () => {
    expect(isOwnerProfile({ role: "OWNER" })).toBe(true);
    expect(isOwnerProfile({ role: "leader" })).toBe(false);
  });
});
