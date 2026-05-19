import { describe, expect, it } from "vitest";

import shared from "../../../functions/quiz-invitation/sendQuizInvite.shared.js";

const {
  validateQuizInvitePayload,
  toPositiveInteger,
} = shared;

describe("functions/quiz-invitation/sendQuizInvite.shared", () => {
  it("validates payload shape", () => {
    expect(validateQuizInvitePayload({}).error).toBe("missing_invitee_email");

    const valid = validateQuizInvitePayload({
      inviteeEmail: "guest@example.com",
      inviteeName: "Guest",
      quizTitle: "Théorie X-Y",
      responseDeadline: "2026-06-01T10:00:00.000Z",
      responseDelayDays: 21,
      quizLink: "https://app.example.com/team/motivation/theorie-x-y/q1",
      invitationId: "q1",
      quizId: "theorie-x-y",
      sendInviterConfirmation: "true",
      invitedCount: 3,
    });

    expect(valid.value.quizTitle).toBe("Théorie X-Y");
    expect(valid.value.sendInviterConfirmation).toBe(true);
    expect(valid.value.invitedCount).toBe(3);
  });

  it("normalizes positive integer values", () => {
    expect(toPositiveInteger("15", 14)).toBe(15);
    expect(toPositiveInteger("0", 14)).toBe(1);
    expect(toPositiveInteger("bad", 14)).toBe(14);
  });
});
