import { describe, expect, it } from "vitest";
import {
  APP_ROLES,
  COLAB_DEFAULT_REDIRECT_PATH,
  COLAB_RESTRICTED_LINKS,
  OVER_CAPACITY_ALLOWED_LINKS,
} from "../../src/constants/routeAccess.js";

describe("constants/routeAccess", () => {
  it("exposes expected role keys", () => {
    expect(APP_ROLES).toMatchObject({ OWNER: "owner", LEADER: "leader", COLAB: "colab" });
  });

  it("keeps redirect and restricted routes coherent", () => {
    expect(COLAB_DEFAULT_REDIRECT_PATH.startsWith("/")).toBe(true);
    expect(COLAB_RESTRICTED_LINKS.length).toBeGreaterThan(0);
    expect(OVER_CAPACITY_ALLOWED_LINKS).toContain("/management");
  });
});
