import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const remove = vi.fn();
const set = vi.fn();
const update = vi.fn();

vi.mock("firebase/database", () => ({ onValue, push, ref, remove, set, update }));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/team/departments.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ d1: { name: "RH", isActive: true }, d2: { name: "IT", isActive: false } }));
      return () => {};
    });
    push.mockReturnValue({ key: "d_new" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
  });

  it("subscribes and normalizes departments", async () => {
    const mod = await import("../../../src/firebase/team/departments.service.js");
    const cb = vi.fn();
    mod.subscribeCompanyDepartments("c1", cb);
    expect(cb).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "d1", name: "RH" })])
    );
  });

  it("adds/updates/removes department", async () => {
    const mod = await import("../../../src/firebase/team/departments.service.js");
    await expect(mod.addCompanyDepartment("c1", { name: "Ops" })).resolves.toBe("d_new");
    await mod.updateCompanyDepartment("c1", "d1", { name: "Ops", isActive: false });
    await mod.removeCompanyDepartment("c1", "d1");

    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });
});
