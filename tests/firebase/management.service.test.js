import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../helpers/firebaseTestUtils.js";
import { waitFor } from "../helpers/renderHook.js";

const get = vi.fn();
const onValue = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const update = vi.fn();

vi.mock("firebase/database", () => ({ get, onValue, ref, update }));
vi.mock("../../src/firebase/app", () => ({ database: {} }));

describe("firebase/management.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ u1: { role: "owner" }, u2: { role: "leader" }, u3: { role: "colab" } }));
      return () => {};
    });
    get.mockImplementation(async (path) => {
      if (String(path).includes("users/u1")) return makeSnapshot({ firstName: "Ada", lastName: "Lovelace", email: "a@b.com" });
      if (String(path).includes("users/u2")) return makeSnapshot({ firstName: "Alan", lastName: "Turing", email: "t@b.com" });
      if (String(path).includes("managerPermissions")) {
        return makeSnapshot({ u2: { role: "leader", pageAccess: { "/management/comptes": true } } });
      }
      return makeSnapshot(null);
    });
    update.mockResolvedValue(undefined);
  });

  it("subscribes managers from owner/leader roles", async () => {
    const mod = await import("../../src/firebase/management.service.js");
    const cb = vi.fn();
    mod.subscribeCompanyManagers("c1", cb);
    await waitFor(() => {
      expect(cb).toHaveBeenCalled();
    });
    const managers = cb.mock.calls.at(-1)[0];
    expect(managers).toHaveLength(2);
  });

  it("gets and upserts manager permissions", async () => {
    const mod = await import("../../src/firebase/management.service.js");
    const data = await mod.getCompanyManagerPermissions("c1");
    expect(data.u2.pageAccess).toEqual(["/management/comptes"]);

    await mod.upsertCompanyManagerPermissions("c1", "u2", {
      role: "leader",
      pageAccess: { "/management/comptes": true, "/management/abonnement": false },
    });
    expect(update).toHaveBeenCalled();
  });
});
