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

describe("firebase/workshops/workshop-service.shared", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReturnValue({ key: "id_1" });
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    onValue.mockImplementation((_refPath, cb) => {
      cb(makeSnapshot({ hello: "world" }));
      return () => {};
    });
  });

  it("createSubscribeSession returns null payload when session is missing", async () => {
    const mod = await import("../../../src/firebase/workshops/workshop-service.shared.js");
    const subscribe = mod.createSubscribeSession((sessionId) => `workshopSessions/${sessionId}/paperBrain`);

    const cb = vi.fn();
    subscribe("", cb);

    expect(cb).toHaveBeenCalledWith(null);
    expect(onValue).not.toHaveBeenCalled();
  });

  it("createUpsertParticipant preserves joinedAt and refreshes lastSeenAt", async () => {
    const mod = await import("../../../src/firebase/workshops/workshop-service.shared.js");
    const upsertParticipant = mod.createUpsertParticipant((sessionId) => `workshopSessions/${sessionId}/paperBrain`);

    runTransaction.mockImplementation(async (_refPath, updater) => {
      const current = {
        id: "p1",
        name: "Ada",
        email: "ada@example.com",
        joinedAt: "2026-01-01T00:00:00.000Z",
        lastSeenAt: "2026-01-01T00:00:00.000Z",
      };
      const next = updater(current);

      expect(next.joinedAt).toBe(current.joinedAt);
      expect(next.lastSeenAt).not.toBe(current.lastSeenAt);

      return { committed: true, snapshot: makeSnapshot(next) };
    });

    await upsertParticipant("s1", { id: "p1", name: "Ada Lovelace" });

    expect(runTransaction).toHaveBeenCalledTimes(1);
  });

  it("setTextFieldWithStaleClearGuard blocks stale clears", async () => {
    const mod = await import("../../../src/firebase/workshops/workshop-service.shared.js");

    runTransaction.mockImplementation(async (_refPath, updater) => {
      const current = {
        description: "Sujet initial",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      const next = updater(current);

      expect(next).toBeUndefined();
      return { committed: false, snapshot: makeSnapshot(current) };
    });

    await mod.setTextFieldWithStaleClearGuard({
      path: "workshopSessions/s1/paperBrain/step1",
      fieldName: "description",
      value: "",
      participantId: "p1",
      expectedPreviousValue: "autre valeur",
    });

    expect(runTransaction).toHaveBeenCalledTimes(1);
  });
});
