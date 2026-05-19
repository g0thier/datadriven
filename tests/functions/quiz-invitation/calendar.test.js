import { describe, expect, it } from "vitest";

import calendar from "../../../functions/quiz-invitation/calendar.js";

const { buildQuizReminderIcs } = calendar;

describe("functions/quiz-invitation/calendar", () => {
  it("builds quiz reminder ics payload", () => {
    const ics = buildQuizReminderIcs({
      uid: "quiz-1@example.com",
      title: "Rappel quiz : Théorie X-Y",
      description: "Invitation quiz",
      startDate: new Date("2026-06-01T09:00:00.000Z"),
      endDate: new Date("2026-06-01T10:00:00.000Z"),
      url: "https://example.com/team/motivation/theorie-x-y/q1",
      organizerName: "Ada",
      organizerEmail: "ada@example.com",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Rappel quiz : Théorie X-Y");
    expect(ics).toContain("DTSTART:20260601T090000Z");
    expect(ics).toContain("DTEND:20260601T100000Z");
    expect(ics).toContain("URL:https://example.com/team/motivation/theorie-x-y/q1");
  });
});
