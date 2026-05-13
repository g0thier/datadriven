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

describe("firebase/workshops/design-thinking.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ step1: { description: "Challenge" } }));
      return () => {};
    });

    push.mockReturnValue({ key: "new_id" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    get.mockResolvedValue(makeSnapshot({ p1: { n1: true } }));

    runTransaction.mockImplementation(async (transactionRef, updater) => {
      const path = String(transactionRef || "");
      let current = {};

      if (path.includes("/votesByParticipant/")) {
        current = { n_existing: true };
      }

      if (path.includes("/sharedNotes/") || path.includes("/prototypeFeedback/notes/")) {
        current = { id: "existing", text: "Old text", columnId: "works" };
      }

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
    const mod = await import("../../../src/firebase/workshops/design-thinking.service.js");

    const cb = vi.fn();
    mod.subscribeSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    await mod.upsertParticipant("s1", { id: "p1", name: "Ada" });
    expect(runTransaction).toHaveBeenCalled();
  });

  it("sets challenge/problem/conclusion fields", async () => {
    const mod = await import("../../../src/firebase/workshops/design-thinking.service.js");

    await mod.setDescription("s1", "p1", "Challenge", {
      expectedPreviousDescription: "",
    });
    await mod.setProblemStatement("s1", "p1", "Problem", {
      expectedPreviousStatement: "",
    });
    await mod.setConclusion("s1", "p1", "Conclusion", {
      expectedPreviousConclusion: "",
    });

    expect(runTransaction).toHaveBeenCalled();
  });

  it("creates/updates/removes shared notes", async () => {
    const mod = await import("../../../src/firebase/workshops/design-thinking.service.js");

    push.mockReturnValueOnce({ key: "s_new" });
    await expect(
      mod.createSharedNote("s1", { authorId: "p1", text: "Observation" })
    ).resolves.toBe("s_new");

    await mod.updateSharedNote(
      "s1",
      "s_new",
      { text: "Observation MAJ" },
      { expectedPreviousText: "Observation" }
    );

    await mod.removeSharedNote("s1", "s_new");

    expect(set).toHaveBeenCalled();
    expect(runTransaction).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it("creates/updates/removes prototype feedback notes", async () => {
    const mod = await import("../../../src/firebase/workshops/design-thinking.service.js");

    push.mockReturnValueOnce({ key: "pf_new" });
    await expect(
      mod.createPrototypeFeedbackNote("s1", {
        authorId: "p1",
        columnId: "works",
        text: "Feedback",
      })
    ).resolves.toBe("pf_new");

    await mod.updatePrototypeFeedbackNote(
      "s1",
      "pf_new",
      { text: "Feedback MAJ", columnId: "problems" },
      { expectedPreviousText: "Feedback" }
    );

    await mod.removePrototypeFeedbackNote("s1", "pf_new");

    await expect(
      mod.createPrototypeFeedbackNote("s1", {
        authorId: "p1",
        columnId: "invalid",
        text: "x",
      })
    ).rejects.toThrow(/columnId invalide/i);

    await expect(
      mod.updatePrototypeFeedbackNote("s1", "pf_new", {
        columnId: "invalid",
      })
    ).rejects.toThrow(/columnId invalide/i);

    expect(set).toHaveBeenCalled();
    expect(runTransaction).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it("creates/updates/removes ideation notes and comments", async () => {
    const mod = await import("../../../src/firebase/workshops/design-thinking.service.js");

    push.mockReturnValueOnce({ key: "n_new" });
    await expect(
      mod.createIdeationNote("s1", {
        authorId: "p1",
        text: "Idée",
        position: { x: 10, y: 20 },
      })
    ).resolves.toBe("n_new");

    await mod.updateIdeationNote("s1", "n_new", {
      text: "Idée MAJ",
      position: { x: 30, y: 40 },
    });

    await mod.setIdeationNotePosition("s1", "n_new", { x: 50, y: 60 });

    push.mockReturnValueOnce({ key: "c_new" });
    await expect(
      mod.addIdeationComment("s1", "n_new", {
        authorId: "p2",
        text: "Comment",
      })
    ).resolves.toBe("c_new");

    await mod.updateIdeationComment("s1", "n_new", "c_new", {
      text: "Comment MAJ",
    });

    await mod.removeIdeationComment("s1", "n_new", "c_new");
    await mod.removeIdeationNote("s1", "n_new");

    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(get).toHaveBeenCalled();
  });

  it("toggles ideation votes and returns transaction payload", async () => {
    const mod = await import("../../../src/firebase/workshops/design-thinking.service.js");

    const result = await mod.toggleIdeationVote("s1", "p1", "n1", {
      maxVotes: 3,
      validNoteIds: new Set(["n1", "n_existing"]),
    });

    expect(result.committed).toBe(true);
    expect(result.votes).toBeTruthy();
  });
});
