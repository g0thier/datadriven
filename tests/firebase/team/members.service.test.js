import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";
import { waitFor } from "../../helpers/renderHook.js";

const get = vi.fn();
const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const update = vi.fn();

vi.mock("firebase/database", () => ({ get, onValue, push, ref, update }));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/team/members.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReturnValue({ key: "m_new" });
    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ u1: { role: "owner" }, u2: { role: "colab" } }));
      return () => {};
    });
    get.mockImplementation(async (path) => {
      if (String(path).includes("users/u1")) return makeSnapshot({ firstName: "Ada", lastName: "Lovelace" });
      if (String(path).includes("users/u2")) return makeSnapshot({ firstName: "Alan", lastName: "Turing" });
      return makeSnapshot(null);
    });
    update.mockResolvedValue(undefined);
  });

  it("subscribes members", async () => {
    const mod = await import("../../../src/firebase/team/members.service.js");
    const cb = vi.fn();
    mod.subscribeCompanyMembers("c1", cb);
    await waitFor(() => {
      expect(cb).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "u1" })])
      );
    });
  });

  it("adds, updates and removes member", async () => {
    const mod = await import("../../../src/firebase/team/members.service.js");
    await expect(mod.addCompanyMember("c1", { name: "Ada Lovelace", role: "leader" })).resolves.toBe("m_new");
    await mod.updateCompanyMember("c1", "m_new", { name: "Grace Hopper", office: "o1", departments: ["d1"] });
    await mod.removeCompanyMember("c1", "m_new");
    expect(update).toHaveBeenCalled();
  });
});
