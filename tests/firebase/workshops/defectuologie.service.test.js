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
    mod.subscribeDefectuologieSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    const once = await mod.fetchDefectuologieSessionOnce("s1");
    expect(once).toBeTruthy();
  });

  it("handles participant/subgroup lifecycle and step1", async () => {
    const mod = await import("../../../src/firebase/workshops/defectuologie.service.js");

    await mod.upsertDefectuologieParticipant("s1", { id: "p1", name: "Ada" });
    await mod.initializeDefectuologieSubgroups("s1");
    await mod.assignDefectuologieParticipantToSubgroup("s1", "p1");
    await mod.setDefectuologieStep1Description("s1", "p1", "Nouveau sujet", {
      expectedPreviousDescription: "Sujet",
    });

    expect(runTransaction).toHaveBeenCalled();
  });

  it("creates, updates, removes and votes defects/solutions", async () => {
    const mod = await import("../../../src/firebase/workshops/defectuologie.service.js");

    await expect(
      mod.createDefectuologieDefect("s1", "group-1", { authorId: "p1", text: "Defaut" })
    ).resolves.toBe("d_new");

    await mod.updateDefectuologieDefect(
      "s1",
      "group-1",
      "d_new",
      { text: "Defaut maj" },
      { expectedPreviousText: "Defaut initial" }
    );

    await mod.removeDefectuologieDefect("s1", "group-1", "d_new");

    const defectVote = await mod.toggleDefectuologieDefectVote("s1", "p1", "d_new", {
      maxVotes: 1,
      validDefectIds: new Set(["d_new"]),
    });

    await expect(
      mod.createDefectuologieSolution("s1", "group-1", { authorId: "p1", text: "Solution" })
    ).resolves.toBe("s_new");

    await mod.updateDefectuologieSolution(
      "s1",
      "group-1",
      "s_new",
      { text: "Solution maj" },
      { expectedPreviousText: "Solution initiale" }
    );

    await mod.removeDefectuologieSolution("s1", "group-1", "s_new");

    const solutionVote = await mod.toggleDefectuologieSolutionVote("s1", "p1", "s_new", {
      maxVotes: 1,
      validSolutionIds: new Set(["s_new"]),
    });

    await mod.setDefectuologieStep6Proposal("s1", "p1", "group-1", "Proposition finale");

    expect(defectVote.committed).toBe(true);
    expect(solutionVote.committed).toBe(true);
    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(get).toHaveBeenCalled();
  });
});
