import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const get = vi.fn();
const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const runTransaction = vi.fn();
const set = vi.fn();
const update = vi.fn();

vi.mock("firebase/database", () => ({
  get,
  onValue,
  push,
  ref,
  runTransaction,
  set,
  update,
}));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/workshops/continue-stop-try.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ notes: { n1: { text: "Note" } } }));
      return () => {};
    });

    push.mockReturnValue({ key: "n_new" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    get.mockResolvedValue(makeSnapshot({ p1: { n1: true } }));

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
    const mod = await import("../../../src/firebase/workshops/continue-stop-try.service.js");

    const cb = vi.fn();
    mod.subscribeSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    await mod.upsertParticipant("s1", { id: "p1", name: "Ada" });
    expect(runTransaction).toHaveBeenCalled();
  });

  it("sets step fields and manages notes", async () => {
    const mod = await import("../../../src/firebase/workshops/continue-stop-try.service.js");

    await mod.setDescription("s1", "p1", "Challenge", {
      expectedPreviousDescription: "",
    });
    await mod.setPlaceholder("s1", "p1", "continue", "On garde");

    await expect(
      mod.createNote("s1", {
        authorId: "p1",
        columnId: "continue",
        text: "Nouvelle note",
      })
    ).resolves.toBe("n_new");

    await mod.updateNote("s1", "n1", {
      text: "Maj",
      position: { x: 100, y: 120 },
      columnId: "try",
    });

    await mod.setNotePosition("s1", "n1", { x: 50, y: 60 });
    await mod.removeNote("s1", "n1");

    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(get).toHaveBeenCalled();
  });

  it("toggles votes and returns transaction payload", async () => {
    const mod = await import("../../../src/firebase/workshops/continue-stop-try.service.js");

    const result = await mod.toggleVote("s1", "p1", "n1", {
      maxVotesPerColumn: 3,
      validNoteIds: new Set(["n1", "n_existing"]),
      noteColumnsById: { n1: "continue", n_existing: "continue" },
    });

    expect(result.committed).toBe(true);
    expect(result.votes).toBeTruthy();
  });
});
