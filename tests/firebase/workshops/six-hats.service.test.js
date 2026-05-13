import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const runTransaction = vi.fn();
const set = vi.fn();
const update = vi.fn();

vi.mock("firebase/database", () => ({
  onValue,
  push,
  ref,
  runTransaction,
  set,
  update,
}));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/workshops/six-hats.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ itemsByHat: { white: { w1: { text: "Fait" } } } }));
      return () => {};
    });

    push.mockReturnValue({ key: "item_new" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);

    runTransaction.mockImplementation(async (transactionRef, updater) => {
      const current = String(transactionRef).includes("itemsByHat")
        ? { id: "w1", text: "Fait initial" }
        : { description: "Sujet initial" };

      const next = updater(current);
      return {
        committed: true,
        snapshot: {
          exists: () => next !== null && next !== undefined,
          val: () => next,
        },
      };
    });
  });

  it("subscribes session and upserts participant", async () => {
    const mod = await import("../../../src/firebase/workshops/six-hats.service.js");

    const cb = vi.fn();
    mod.subscribeSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    await mod.upsertParticipant("s1", { id: "p1", name: "Ada" });
    expect(runTransaction).toHaveBeenCalled();
  });

  it("sets step1, creates/updates/removes item and sets blue conclusion", async () => {
    const mod = await import("../../../src/firebase/workshops/six-hats.service.js");

    await mod.setDescription("s1", "p1", "Nouveau sujet", {
      expectedPreviousDescription: "Sujet initial",
    });

    await expect(
      mod.createItem("s1", "white", { authorId: "p1", text: "Fait" })
    ).resolves.toBe("item_new");

    await mod.updateItem(
      "s1",
      "white",
      "w1",
      { text: "Fait modifie" },
      { expectedPreviousText: "Fait initial" }
    );

    await mod.removeItem("s1", "white", "w1");
    await mod.setBlueConclusion("s1", "p1", "Conclusion");

    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(runTransaction).toHaveBeenCalled();
  });
});
