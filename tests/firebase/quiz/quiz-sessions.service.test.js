import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const update = vi.fn();

vi.mock("firebase/database", () => ({ onValue, push, ref, update }));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/quiz/quiz-sessions.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReturnValue({ key: "q1" });
    update.mockResolvedValue(undefined);
    onValue.mockImplementation((_path, callback) => {
      callback(
        makeSnapshot({
          sessionId: "q1",
          quizId: "theorie-x-y",
          responseDeadline: "2099-01-01T10:00:00.000Z",
          status: "invited",
        })
      );
      return () => {};
    });
  });

  it("creates quiz session with user/company summaries", async () => {
    const mod = await import("../../../src/firebase/quiz/quiz-sessions.service.js");

    const output = await mod.createQuizSession("c1", {
      quizId: "theorie-x-y",
      inviter: { uid: "u1", name: "Ada" },
      allGuests: [{ id: "u2", email: "u2@x.com" }],
      selectedGuests: [{ id: "u3" }],
      guestsFromSelectedDepartments: [],
      totalGuestCount: 2,
    });

    expect(output.sessionId).toBe("q1");
    expect(update).toHaveBeenCalledTimes(1);

    const updates = update.mock.calls[0][1];
    expect(updates).toHaveProperty("quizSessions/q1");
    expect(updates).toHaveProperty("companies/c1/quizSessions/q1");
    expect(updates).toHaveProperty("users/u1/quizSessions/q1");
    expect(updates).toHaveProperty("users/u2/quizSessions/q1");
    expect(updates).toHaveProperty("users/u3/quizSessions/q1");
  });

  it("subscribes one user quiz session", async () => {
    const mod = await import("../../../src/firebase/quiz/quiz-sessions.service.js");
    const callback = vi.fn();

    mod.subscribeUserQuizSession("u1", "q1", callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "q1",
        quizId: "theorie-x-y",
      })
    );
  });
});
