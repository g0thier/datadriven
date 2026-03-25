import { describe, expect, it } from "vitest";
import {
  buildUniquePageTree,
  flattenPageTreePaths,
} from "../../src/utils/navigationTree.utils.js";

describe("navigationTree utils", () => {
  it("builds unique 2-level tree with exceptions", () => {
    const tree = buildUniquePageTree(
      [
        [
          { to: "/team" },
          { to: "/team/annuaire" },
          { to: "/team/annuaire?tab=1" },
          { to: "/management/comptes" },
          { to: "/management/abonnement" },
        ],
      ],
      ["/management/abonnement"]
    );

    expect(tree).toEqual([
      { path: "/team", children: [{ path: "/team/annuaire" }] },
      { path: "/management", children: [{ path: "/management/comptes" }] },
    ]);
  });

  it("flattens tree", () => {
    const flat = flattenPageTreePaths([
      { path: "/a", children: [{ path: "/a/b" }] },
      { path: "/c", children: [] },
    ]);

    expect(flat).toEqual(["/a", "/a/b", "/c"]);
  });
});
