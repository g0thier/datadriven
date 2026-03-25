import { describe, expect, it } from "vitest";
import {
  buildDefaultPageAccess,
  cloneDefaultPermissions,
  createDefaultPermissions,
} from "../../../src/utils/management/permissions.defaults.js";

describe("permissions.defaults", () => {
  it("builds default page access map", () => {
    expect(buildDefaultPageAccess(["/a", "/b"])).toEqual({ "/a": false, "/b": false });
  });

  it("creates and clones default permissions", () => {
    const p = createDefaultPermissions(["/a"]);
    const c = cloneDefaultPermissions(["/a"]);
    expect(p).toEqual(c);
    expect(p).not.toBe(c);
  });
});
