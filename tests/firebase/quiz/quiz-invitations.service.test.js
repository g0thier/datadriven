import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../../helpers/firebaseTestUtils.js";

const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const update = vi.fn();

vi.mock("firebase/database", () => ({ onValue, push, ref, update }));
vi.mock("../../../src/firebase/auth/app", () => ({ database: {} }));

describe("firebase/quiz/quiz-invitations.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReturnValue({ key: "q1" });
    update.mockResolvedValue(undefined);
    onValue.mockImplementation((_path, callback) => {
      callback(
        makeSnapshot({
          invitationId: "q1",
          quizId: "theorie-x-y",
          quizTitle: "Théorie X-Y",
          responseDeadline: "2099-01-01T10:00:00.000Z",
          status: "invited",
        })
      );
      return () => {};
    });
  });

  it("creates quiz invitation with user/company summaries", async () => {
    const mod = await import("../../../src/firebase/quiz/quiz-invitations.service.js");

    const output = await mod.createQuizInvitation("c1", {
      quizId: "theorie-x-y",
      quizTitle: "Théorie X-Y",
      inviter: { uid: "u1", name: "Ada" },
      allGuests: [{ id: "u2", email: "u2@x.com" }],
      selectedGuests: [{ id: "u3" }],
      guestsFromSelectedDepartments: [],
      totalGuestCount: 2,
    });

    expect(output.invitationId).toBe("q1");
    expect(update).toHaveBeenCalledTimes(1);

    const updates = update.mock.calls[0][1];
    expect(updates).toHaveProperty("quizInvitations/q1");
    expect(updates).toHaveProperty("companies/c1/quizInvitations/q1");
    expect(updates).toHaveProperty("users/u1/quizInvitations/q1");
    expect(updates).toHaveProperty("users/u2/quizInvitations/q1");
    expect(updates).toHaveProperty("users/u3/quizInvitations/q1");
  });

  it("subscribes one user quiz invitation", async () => {
    const mod = await import("../../../src/firebase/quiz/quiz-invitations.service.js");
    const callback = vi.fn();

    mod.subscribeUserQuizInvitation("u1", "q1", callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: "q1",
        quizId: "theorie-x-y",
      })
    );
  });
});
