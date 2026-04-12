import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const get = vi.fn();
const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const remove = vi.fn();
const set = vi.fn();
const update = vi.fn();

vi.mock("firebase/database", () => ({ get, onValue, push, ref, remove, set, update }));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/team/offices.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReturnValue({ key: "o_new" });
    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ o1: { alias: "HQ", isDefault: true }, o2: { alias: "Branch", isDefault: false } }));
      return () => {};
    });
    get.mockResolvedValue(makeSnapshot({ o1: { alias: "HQ", isDefault: true } }));
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
  });

  it("subscribes and normalizes offices", async () => {
    const mod = await import("../../../src/firebase/team/offices.service.js");
    const cb = vi.fn();
    mod.subscribeCompanyOffices("c1", cb);
    expect(cb).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "o1" })]));
  });

  it("adds office and manages default logic updates", async () => {
    const mod = await import("../../../src/firebase/team/offices.service.js");
    await expect(mod.addCompanyOffice("c1", { alias: "HQ" })).resolves.toBe("o_new");

    await mod.updateCompanyOffice("c1", "o1", { isDefault: true, city: "Lausanne" });
    expect(update).toHaveBeenCalled();

    get
      .mockResolvedValueOnce(makeSnapshot({ o1: { isDefault: true }, o2: { isDefault: false } }))
      .mockResolvedValueOnce(makeSnapshot({ o2: { isDefault: false } }));
    await mod.removeCompanyOffice("c1", "o1");
    expect(remove).toHaveBeenCalled();
  });
});
