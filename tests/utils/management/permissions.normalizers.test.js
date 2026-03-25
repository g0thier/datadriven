import { describe, expect, it } from "vitest";
import { normalizePermissions } from "../../../src/utils/management/permissions.normalizers.js";

describe("permissions.normalizers", () => {
  it("normalizes per manager with defaults", () => {
    const out = normalizePermissions(
      {
        m1: {
          pageAccess: { "/management/comptes": true },
          teamSections: { offices: true },
        },
      },
      [{ permissionId: "m1" }, { permissionId: "m2" }],
      ["/management/comptes", "/management/abonnement"]
    );

    expect(out.m1.pageAccess["/management/comptes"]).toBe(true);
    expect(out.m1.pageAccess["/management/abonnement"]).toBe(false);
    expect(out.m2.teamSections.members).toBe(false);
  });
});
