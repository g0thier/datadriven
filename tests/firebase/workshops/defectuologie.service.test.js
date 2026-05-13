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

describe("firebase/workshops/defectuologie.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ step1: { description: "Sujet" } }));
      return () => {};
    });

    push
      .mockReturnValueOnce({ key: "d_new" })
      .mockReturnValueOnce({ key: "s_new" });

    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    get.mockResolvedValue(makeSnapshot({ p1: { d_new: true, s_new: true } }));

    runTransaction.mockImplementation(async (transactionRef, updater) => {
      let current = {};
      const path = String(transactionRef || "");

      if (path.includes("/defectsBySubgroup/")) {
        current = { id: "d_new", text: "Defaut initial" };
      } else if (path.includes("/solutionsBySubgroup/")) {
        current = { id: "s_new", text: "Solution initiale" };
      } else if (path.includes("/step1")) {
        current = { description: "Sujet" };
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

  it("subscribes and fetches session state", async () => {
    const mod = await import("../../../src/firebase/workshops/defectuologie.service.js");

    const cb = vi.fn();
    mod.subscribeSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    const once = await mod.fetchSessionOnce("s1");
    expect(once).toBeTruthy();
  });

  it("handles participant/subgroup lifecycle and step1", async () => {
    const mod = await import("../../../src/firebase/workshops/defectuologie.service.js");

    await mod.upsertParticipant("s1", { id: "p1", name: "Ada" });
    await mod.initializeSubgroups("s1");
    await mod.assignParticipantToSubgroup("s1", "p1");
    await mod.setDescription("s1", "p1", "Nouveau sujet", {
      expectedPreviousDescription: "Sujet",
    });

    expect(runTransaction).toHaveBeenCalled();
  });

  it("creates, updates, removes and votes defects/solutions", async () => {
    const mod = await import("../../../src/firebase/workshops/defectuologie.service.js");

    await expect(
      mod.createDefect("s1", "group-1", { authorId: "p1", text: "Defaut" })
    ).resolves.toBe("d_new");

    await mod.updateDefect(
      "s1",
      "group-1",
      "d_new",
      { text: "Defaut maj" },
      { expectedPreviousText: "Defaut initial" }
    );

    await mod.removeDefect("s1", "group-1", "d_new");

    const defectVote = await mod.toggleDefectVote("s1", "p1", "d_new", {
      maxVotes: 1,
      validDefectIds: new Set(["d_new"]),
    });

    await expect(
      mod.createSolution("s1", "group-1", { authorId: "p1", text: "Solution" })
    ).resolves.toBe("s_new");

    await mod.updateSolution(
      "s1",
      "group-1",
      "s_new",
      { text: "Solution maj" },
      { expectedPreviousText: "Solution initiale" }
    );

    await mod.removeSolution("s1", "group-1", "s_new");

    const solutionVote = await mod.toggleSolutionVote("s1", "p1", "s_new", {
      maxVotes: 1,
      validSolutionIds: new Set(["s_new"]),
    });

    await mod.setProposal("s1", "p1", "group-1", "Proposition finale");

    expect(defectVote.committed).toBe(true);
    expect(solutionVote.committed).toBe(true);
    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(get).toHaveBeenCalled();
  });
});
