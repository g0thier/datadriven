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

describe("firebase/workshops/speed-boat.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ notesByType: { brakes: { b1: { text: "Frein" } } } }));
      return () => {};
    });

    push.mockReturnValue({ key: "n_new" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);

    runTransaction.mockImplementation(async (_transactionRef, updater) => {
      const next = updater({ n_existing: true });
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
    const mod = await import("../../../src/firebase/workshops/speed-boat.service.js");

    const cb = vi.fn();
    mod.subscribeSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    await mod.upsertParticipant("s1", { id: "p1", name: "Ada" });
    expect(runTransaction).toHaveBeenCalled();
  });

  it("sets step fields and manages brake and lever notes", async () => {
    const mod = await import("../../../src/firebase/workshops/speed-boat.service.js");

    await mod.setDescription("s1", "p1", "Challenge", {
      expectedPreviousDescription: "",
    });
    await mod.setObjective("s1", "p1", "Objectif", {
      expectedPreviousObjective: "",
    });

    await expect(
      mod.createBrakeNote("s1", { authorId: "p1", text: "Frein nouveau" })
    ).resolves.toBe("n_new");
    await mod.updateBrakeNote("s1", "b1", { text: "Frein maj" });
    await mod.setBrakeNotePosition("s1", "b1", { x: 100, y: 140 });
    await mod.removeBrakeNote("s1", "b1");

    await expect(
      mod.createLeverNote("s1", { authorId: "p1", text: "Levier nouveau" })
    ).resolves.toBe("n_new");
    await mod.updateLeverNote("s1", "l1", { text: "Levier maj" });
    await mod.setLeverNotePosition("s1", "l1", { x: 80, y: 60 });
    await mod.removeLeverNote("s1", "l1");

    await mod.setBrakeAction("s1", "p1", "b1", "Faire une action");

    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it("toggles brake votes and returns transaction payload", async () => {
    const mod = await import("../../../src/firebase/workshops/speed-boat.service.js");

    const result = await mod.toggleBrakeVote("s1", "p1", "b1", {
      maxVotes: 3,
      validNoteIds: new Set(["b1", "n_existing"]),
    });

    expect(result.committed).toBe(true);
    expect(result.votes).toBeTruthy();
  });
});
