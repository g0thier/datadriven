import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const get = vi.fn();
const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const remove = vi.fn();
const runTransaction = vi.fn();
const set = vi.fn();
const update = vi.fn();

vi.mock("firebase/database", () => ({
  get,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
  update,
}));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/workshops/paper-brain.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ notes: { n1: { text: "Idea" } } }));
      return () => {};
    });
    push.mockReturnValue({ key: "n_new" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
    get.mockResolvedValue(makeSnapshot({ p1: { n1: true } }));
    runTransaction.mockImplementation(async (_r, updater) => {
      const next = updater({ n1: true });
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
    const mod = await import("../../../src/firebase/workshops/paper-brain.service.js");
    const cb = vi.fn();
    mod.subscribeSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    await mod.upsertParticipant("s1", { id: "p1", name: "Ada" });
    expect(runTransaction).toHaveBeenCalled();
  });

  it("creates/updates/removes notes and comments", async () => {
    const mod = await import("../../../src/firebase/workshops/paper-brain.service.js");

    await expect(mod.createNote("s1", { authorId: "p1", text: "Idea" })).resolves.toBe("n_new");
    await mod.updateNote("s1", "n1", { text: "Updated" });
    await mod.setNotePosition("s1", "n1", { x: 12, y: 45 });
    await mod.removeNote("s1", "n1");

    push.mockReturnValueOnce({ key: "c1" });
    await expect(mod.addComment("s1", "n1", { authorId: "p2", text: "Comment" })).resolves.toBe("c1");
    await mod.updateComment("s1", "n1", "c1", { text: "Edited" });
    await mod.removeComment("s1", "n1", "c1");

    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });

  it("toggles votes with transaction result", async () => {
    const mod = await import("../../../src/firebase/workshops/paper-brain.service.js");
    const result = await mod.toggleVote("s1", "p1", "n1", { maxVotes: 3, validNoteIds: new Set(["n1"]) });
    expect(result.committed).toBe(true);
    expect(result.votes).toBeTruthy();
  });
});
