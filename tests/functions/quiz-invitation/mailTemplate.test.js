import { describe, expect, it } from "vitest";

import template from "../../../functions/quiz-invitation/mailTemplate.js";

const { buildInviteEmail } = template;

describe("functions/quiz-invitation/mailTemplate", () => {
  it("renders invitee variant", () => {
    const html = buildInviteEmail({
      inviteeName: "Ada",
      inviterFirstName: "Alan",
      inviterLastName: "Turing",
      quizTitle: "Théorie X-Y",
      responseDeadlineLabel: "lundi 1 juin à 10:00",
      responseDelayDays: 14,
      quizLink: "https://example.com/quiz",
    });

    expect(html).toContain("Bonjour Ada");
    expect(html).toContain("Théorie X-Y");
    expect(html).toContain("https://example.com/quiz");
  });

  it("renders inviter confirmation variant", () => {
    const html = buildInviteEmail({
      inviteeName: "Ada",
      inviterFirstName: "Alan",
      inviterLastName: "Turing",
      quizTitle: "Théorie X-Y",
      responseDeadlineLabel: "lundi 1 juin à 10:00",
      responseDelayDays: 14,
      quizLink: "https://example.com/quiz",
      emailVariant: "inviterConfirmation",
      invitedCount: 5,
    });

    expect(html).toContain("Vous avez créé une invitation");
    expect(html).toContain("5 personnes");
  });
});
