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

const ROOT_PATH = "workshopSessions/s1/worldCafe";

const deepClone = (value) => JSON.parse(JSON.stringify(value));

describe("firebase/workshops/world-coffee.service", () => {
  let transactionStateByPath;

  beforeEach(() => {
    vi.clearAllMocks();
    transactionStateByPath = new Map();

    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ descriptions: { d1: { text: "Sujet" } } }));
      return () => {};
    });

    push.mockReturnValue({ key: "new_id" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);

    runTransaction.mockImplementation(async (transactionRef, updater) => {
      const path = String(transactionRef || "");
      const current = transactionStateByPath.has(path)
        ? deepClone(transactionStateByPath.get(path))
        : undefined;
      const next = updater(current);

      if (next !== undefined) {
        transactionStateByPath.set(path, deepClone(next));
      }

      return {
        committed: true,
        snapshot: {
          exists: () => next !== null && next !== undefined,
          val: () => next,
        },
      };
    });
  });

  it("subscribes a session payload and upserts participant", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    const cb = vi.fn();
    mod.subscribeSession("s1", cb);
    expect(cb).toHaveBeenCalled();

    const emptyCb = vi.fn();
    mod.subscribeSession("", emptyCb);
    expect(emptyCb).toHaveBeenCalledWith(null);

    await mod.upsertParticipant("s1", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      isAuthenticated: true,
    });

    const participantPath = `${ROOT_PATH}/participants/u1`;
    const participantState = transactionStateByPath.get(participantPath);
    expect(participantState.id).toBe("u1");
    expect(participantState.name).toBe("Ada");
    expect(participantState.email).toBe("ada@example.com");
    expect(participantState.isAuthenticated).toBe(true);
    expect(participantState.joinedAt).toBeTruthy();
    expect(participantState.lastSeenAt).toBeTruthy();
  });

  it("initializes subgroups to empty when no eligible description exists", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    transactionStateByPath.set(ROOT_PATH, {
      descriptions: {
        d1: { id: "d1", text: "Sujet 1", createdAt: "2026-01-01T10:00:00.000Z" },
      },
      facilitatorByDescriptionId: {},
      subgroups: { "group-1": { id: "group-1", participantIds: { u1: true } } },
      participantToSubgroup: { u1: "group-1" },
    });

    await mod.initializeSubgroups("s1", [
      { id: "u1", name: "Ada" },
      { id: "u2", name: "Alan" },
    ]);

    const next = transactionStateByPath.get(ROOT_PATH);
    expect(next.subgroups).toEqual({});
    expect(next.participantToSubgroup).toEqual({});
  });

  it("initializes facilitator subgroups and distributes invited participants", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    transactionStateByPath.set(ROOT_PATH, {
      descriptions: {
        d1: { id: "d1", text: "Sujet 1", createdAt: "2026-01-01T10:00:00.000Z" },
        d2: { id: "d2", text: "Sujet 2", createdAt: "2026-01-01T10:05:00.000Z" },
        d3: { id: "d3", text: "Sujet 3", createdAt: "2026-01-01T10:10:00.000Z" },
      },
      facilitatorByDescriptionId: {
        d1: "u1",
        d2: "u2",
      },
      subgroups: {},
      participantToSubgroup: {},
    });

    await mod.initializeSubgroups("s1", [
      { id: "u1", firstName: "Ada", lastName: "Lovelace" },
      { id: "u2", firstName: "Alan", lastName: "Turing" },
      { id: "u3", firstName: "Grace", lastName: "Hopper" },
      { id: "u4", firstName: "Katherine", lastName: "Johnson" },
    ]);

    const next = transactionStateByPath.get(ROOT_PATH);
    expect(Object.keys(next.subgroups)).toEqual(["group-1", "group-2"]);
    expect(next.subgroups["group-1"].facilitatorId).toBe("u1");
    expect(next.subgroups["group-2"].facilitatorId).toBe("u2");
    expect(next.participantToSubgroup.u1).toBe("group-1");
    expect(next.participantToSubgroup.u2).toBe("group-2");
    expect(next.participantToSubgroup.u3).toBe("group-1");
    expect(next.participantToSubgroup.u4).toBe("group-2");
    expect(next.subgroupInitializedAt).toBeTruthy();
  });

  it("applies round 2 rotation and stays idempotent", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    transactionStateByPath.set(ROOT_PATH, {
      subgroups: {
        "group-1": {
          id: "group-1",
          facilitatorId: "u1",
          participantIds: { u1: true, u3: true },
        },
        "group-2": {
          id: "group-2",
          facilitatorId: "u2",
          participantIds: { u2: true, u4: true },
        },
        "group-3": {
          id: "group-3",
          facilitatorId: "u5",
          participantIds: { u5: true, u6: true },
        },
      },
      participantToSubgroup: {
        u1: "group-1",
        u2: "group-2",
        u3: "group-1",
        u4: "group-2",
        u5: "group-3",
        u6: "group-3",
      },
    });

    await mod.applyRound2Rotation("s1");
    const rotated = deepClone(transactionStateByPath.get(ROOT_PATH));

    expect(rotated.participantToSubgroup).toMatchObject({
      u1: "group-1",
      u2: "group-2",
      u5: "group-3",
      u3: "group-2",
      u4: "group-3",
      u6: "group-1",
    });
    expect(rotated.round2RotationAppliedAt).toBeTruthy();

    await mod.applyRound2Rotation("s1");
    const second = transactionStateByPath.get(ROOT_PATH);
    expect(second).toEqual(rotated);
  });

  it("applies round 3 rotation and stays idempotent", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    transactionStateByPath.set(ROOT_PATH, {
      subgroups: {
        "group-1": {
          id: "group-1",
          facilitatorId: "u1",
          participantIds: { u1: true, u3: true },
        },
        "group-2": {
          id: "group-2",
          facilitatorId: "u2",
          participantIds: { u2: true, u4: true },
        },
        "group-3": {
          id: "group-3",
          facilitatorId: "u5",
          participantIds: { u5: true, u6: true },
        },
      },
      participantToSubgroup: {
        u1: "group-1",
        u2: "group-2",
        u3: "group-1",
        u4: "group-2",
        u5: "group-3",
        u6: "group-3",
      },
    });

    await mod.applyRound3Rotation("s1");
    const rotated = deepClone(transactionStateByPath.get(ROOT_PATH));

    expect(rotated.participantToSubgroup).toMatchObject({
      u1: "group-1",
      u2: "group-2",
      u5: "group-3",
      u3: "group-2",
      u4: "group-3",
      u6: "group-1",
    });
    expect(rotated.round3RotationAppliedAt).toBeTruthy();

    await mod.applyRound3Rotation("s1");
    const second = transactionStateByPath.get(ROOT_PATH);
    expect(second).toEqual(rotated);
  });

  it("applies return rotation and stays idempotent", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    transactionStateByPath.set(ROOT_PATH, {
      subgroups: {
        "group-1": {
          id: "group-1",
          facilitatorId: "u1",
          participantIds: { u1: true, a: true },
        },
        "group-2": {
          id: "group-2",
          facilitatorId: "u2",
          participantIds: { u2: true, b: true },
        },
        "group-3": {
          id: "group-3",
          facilitatorId: "u3",
          participantIds: { u3: true, c: true },
        },
        "group-4": {
          id: "group-4",
          facilitatorId: "u4",
          participantIds: { u4: true, d: true },
        },
      },
      participantToSubgroup: {
        u1: "group-1",
        u2: "group-2",
        u3: "group-3",
        u4: "group-4",
        a: "group-1",
        b: "group-2",
        c: "group-3",
        d: "group-4",
      },
    });

    await mod.applyReturnRotation("s1");
    const rotated = deepClone(transactionStateByPath.get(ROOT_PATH));

    expect(rotated.participantToSubgroup).toMatchObject({
      u1: "group-1",
      u2: "group-2",
      u3: "group-3",
      u4: "group-4",
      a: "group-3",
      b: "group-4",
      c: "group-1",
      d: "group-2",
    });
    expect(rotated.returnRotationAppliedAt).toBeTruthy();

    await mod.applyReturnRotation("s1");
    const second = transactionStateByPath.get(ROOT_PATH);
    expect(second).toEqual(rotated);
  });

  it("manages descriptions, synthesis, and facilitator uniqueness", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    push.mockReturnValueOnce({ key: "d_new" });
    await expect(
      mod.createDescription("s1", { authorId: "u1", text: "Nouveau sujet" })
    ).resolves.toBe("d_new");

    await expect(mod.createDescription("s1", { text: "x" })).rejects.toThrow(
      /authorId manquant/i
    );

    const descriptionPath = `${ROOT_PATH}/descriptions/d1`;
    transactionStateByPath.set(descriptionPath, {
      id: "d1",
      text: "Ancien texte",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    });

    await mod.updateDescription(
      "s1",
      "d1",
      { text: "Texte maj" },
      { expectedPreviousText: "Ancien texte" }
    );
    expect(transactionStateByPath.get(descriptionPath).text).toBe("Texte maj");

    await mod.updateDescription(
      "s1",
      "d1",
      { text: "Ne doit pas passer" },
      { expectedPreviousText: "texte stale" }
    );
    expect(transactionStateByPath.get(descriptionPath).text).toBe("Texte maj");

    await mod.updateDescription("s1", "d1", {});
    expect(update).toHaveBeenCalledWith(
      `${ROOT_PATH}/descriptions/d1`,
      expect.objectContaining({ updatedAt: expect.any(String) })
    );

    await mod.updateSubgroupSynthesis(
      "s1",
      "group-1",
      { text: "Synthese 1", authorId: "u1" },
      { expectedPreviousText: "" }
    );
    const synthesisPath = `${ROOT_PATH}/synthesisBySubgroup/group-1`;
    expect(transactionStateByPath.get(synthesisPath)).toEqual(
      expect.objectContaining({
        text: "Synthese 1",
        authorId: "u1",
      })
    );

    transactionStateByPath.set(ROOT_PATH, {
      descriptions: {
        d1: { id: "d1", text: "Sujet 1" },
        d2: { id: "d2", text: "Sujet 2" },
      },
      facilitatorByDescriptionId: {
        d1: "u1",
        d2: "u2",
      },
    });

    await mod.setFacilitator("s1", "d2", "u1");
    expect(transactionStateByPath.get(ROOT_PATH).facilitatorByDescriptionId).toEqual({
      d2: "u1",
    });

    await mod.clearFacilitator("s1", "d2");
    expect(transactionStateByPath.get(ROOT_PATH).facilitatorByDescriptionId).toEqual({});
  });

  it("manages ideas, comments, replies, and cascade deletions", async () => {
    const mod = await import("../../../src/firebase/workshops/world-coffee.service.js");

    push.mockReturnValueOnce({ key: "i_new" });
    await expect(
      mod.createIdea("s1", "group-1", { authorId: "u1", text: "Idee" })
    ).resolves.toBe("i_new");

    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "i_new",
        roundId: "round-1",
        roundLabel: "premier-round",
      })
    );

    await expect(mod.createIdea("s1", "group-1", { text: "x" })).rejects.toThrow(
      /authorId manquant/i
    );

    const ideaPath = `${ROOT_PATH}/ideasBySubgroup/group-1/i_new`;
    transactionStateByPath.set(ideaPath, {
      id: "i_new",
      text: "Idee",
      authorId: "u1",
    });

    await mod.updateIdea(
      "s1",
      "group-1",
      "i_new",
      { text: "Idee maj" },
      { expectedPreviousText: "Idee" }
    );
    expect(transactionStateByPath.get(ideaPath).text).toBe("Idee maj");

    await mod.updateIdea("s1", "group-1", "i_new", {});
    expect(update).toHaveBeenCalledWith(
      `${ROOT_PATH}/ideasBySubgroup/group-1/i_new`,
      expect.objectContaining({ updatedAt: expect.any(String) })
    );

    await mod.removeIdea("s1", "group-1", "i_new");
    expect(update).toHaveBeenCalledWith("root", {
      [`${ROOT_PATH}/ideasBySubgroup/group-1/i_new`]: null,
      [`${ROOT_PATH}/commentsByIdea/i_new`]: null,
      [`${ROOT_PATH}/repliesByComment/idea-i_new`]: null,
    });

    push.mockReturnValueOnce({ key: "c_new" });
    await expect(
      mod.addIdeaComment("s1", "i_new", { authorId: "u2", text: "Commentaire" })
    ).resolves.toBe("c_new");
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "c_new",
        roundId: "round-2",
        roundLabel: "premier-rotation",
      })
    );

    await expect(mod.addIdeaComment("s1", "i_new", { text: "x" })).rejects.toThrow(
      /authorId manquant/i
    );

    await mod.updateIdeaComment("s1", "i_new", "c_new", { text: "Commentaire maj" });
    expect(update).toHaveBeenCalledWith(
      `${ROOT_PATH}/commentsByIdea/i_new/c_new`,
      expect.objectContaining({ text: "Commentaire maj", updatedAt: expect.any(String) })
    );

    await mod.removeIdeaComment("s1", "i_new", "c_new");
    expect(update).toHaveBeenCalledWith("root", {
      [`${ROOT_PATH}/commentsByIdea/i_new/c_new`]: null,
      [`${ROOT_PATH}/repliesByComment/c_new`]: null,
    });

    push.mockReturnValueOnce({ key: "r_new" });
    await expect(
      mod.addCommentReply("s1", "c_new", { authorId: "u3", text: "Reponse" })
    ).resolves.toBe("r_new");
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "r_new",
        roundId: "round-3",
        roundLabel: "deuxieme-rotation",
      })
    );

    await expect(mod.addCommentReply("s1", "c_new", { text: "x" })).rejects.toThrow(
      /authorId manquant/i
    );

    await mod.updateCommentReply("s1", "c_new", "r_new", { text: "Reponse maj" });
    expect(update).toHaveBeenCalledWith(
      `${ROOT_PATH}/repliesByComment/c_new/r_new`,
      expect.objectContaining({ text: "Reponse maj", updatedAt: expect.any(String) })
    );

    await mod.removeCommentReply("s1", "c_new", "r_new");
    expect(update).toHaveBeenCalledWith("root", {
      [`${ROOT_PATH}/repliesByComment/c_new/r_new`]: null,
    });

    await mod.removeDescription("s1", "d1");
    expect(update).toHaveBeenCalledWith("root", {
      [`${ROOT_PATH}/descriptions/d1`]: null,
      [`${ROOT_PATH}/facilitatorByDescriptionId/d1`]: null,
    });
  });
});
