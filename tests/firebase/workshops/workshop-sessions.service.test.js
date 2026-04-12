import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const get = vi.fn();
const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const update = vi.fn();

vi.mock("firebase/database", () => ({ get, onValue, push, ref, update }));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/workshops/workshop-sessions.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReturnValue({ key: "s1" });
    update.mockResolvedValue(undefined);
    get.mockResolvedValue(makeSnapshot({ sessionId: "s1", workshopId: "paper-brain" }));
    onValue.mockImplementation((_r, cb) => {
      cb(
        makeSnapshot({
          s1: { workshopTitle: "A", workshopDateTime: "2026-03-25T10:00:00.000Z" },
          s2: { workshopTitle: "B", workshopDateTime: "2026-03-26T10:00:00.000Z" },
        })
      );
      return () => {};
    });
  });

  it("creates workshop session with summaries", async () => {
    const mod = await import("../../../src/firebase/workshops/workshop-sessions.service.js");
    const out = await mod.createWorkshopSession("c1", {
      workshopId: "paper-brain",
      workshopTitle: "Paper Brain",
      inviter: { uid: "u1", name: "Ada" },
      allGuests: [{ id: "u2", email: "u2@x.com" }],
      selectedGuests: [{ id: "u3" }],
      guestsFromSelectedDepartments: [],
    });

    expect(out.sessionId).toBe("s1");
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("gets a workshop session", async () => {
    const mod = await import("../../../src/firebase/workshops/workshop-sessions.service.js");
    const session = await mod.getWorkshopSession("s1");
    expect(session.id).toBe("s1");
  });

  it("subscribes user sessions and sorts them", async () => {
    const mod = await import("../../../src/firebase/workshops/workshop-sessions.service.js");
    const cb = vi.fn();
    mod.subscribeUserWorkshopSessions("u1", cb);
    const sessions = cb.mock.calls.at(-1)[0];
    expect(sessions[0].id).toBe("s2");
  });
});
