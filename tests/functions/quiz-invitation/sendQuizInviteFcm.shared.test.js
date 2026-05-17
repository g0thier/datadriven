import { describe, expect, it } from "vitest";

import shared from "../../../functions/quiz-invitation/sendQuizInviteFcm.shared.js";

const {
  validateQuizInvitePayload,
  extractTokensFromUserData,
  aggregateMulticastResults,
  normalizeRecipients,
} = shared;

describe("functions/quiz-invitation/sendQuizInviteFcm.shared", () => {
  it("validates payload shape", () => {
    expect(validateQuizInvitePayload({}).error).toBe("missing_invitation_id");

    const valid = validateQuizInvitePayload({
      invitationId: "q1",
      companyId: "c1",
      quizId: "theorie-x-y",
      quizTitle: "Théorie X-Y",
      responseDeadline: "2026-06-01T10:00:00.000Z",
      responseDelayDays: 14,
      recipients: [],
    });

    expect(valid.value.quizId).toBe("theorie-x-y");
    expect(valid.value.responseDelayDays).toBe(14);
  });

  it("filters and deduplicates recipients and tokens", () => {
    const recipients = normalizeRecipients([
      { uid: "u1", label: "A" },
      { id: "u1", label: "A2" },
      { uid: "", label: "X" },
      { uid: "u2", label: "B" },
    ]);

    expect(recipients.map((entry) => entry.uid)).toEqual(["u1", "u2"]);

    const tokens = extractTokensFromUserData({
      fcmToken: "tok-1",
      fcmTokens: ["tok-1", "tok-2"],
      devices: {
        d1: { token: "tok-3" },
        d2: { fcmToken: "tok-2" },
      },
    });

    expect(tokens).toEqual(["tok-1", "tok-2", "tok-3"]);
  });

  it("aggregates multicast results", () => {
    const summary = aggregateMulticastResults(
      {
        successCount: 8,
        failureCount: 2,
      },
      3
    );

    expect(summary).toEqual({ sentCount: 8, failedCount: 2, skippedCount: 3 });
  });
});
