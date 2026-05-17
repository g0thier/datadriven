import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "../helpers/renderHook.js";

const navigateMock = vi.fn();
const createQuizInvitation = vi.fn();
const auth = {
  currentUser: {
    uid: "u1",
    email: "inviter@example.com",
    displayName: "Ada Lovelace",
    getIdToken: vi.fn().mockResolvedValue("token"),
  },
};

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: { quiz: { id: "theorie-x-y", title: "Théorie X-Y" } } }),
  useNavigate: () => navigateMock,
}));

vi.mock("../../src/firebase", () => ({
  auth,
  createQuizInvitation,
}));

vi.mock("../../src/hooks/useCompanyTeam", () => ({
  default: () => ({
    companyId: "c1",
    officeLocations: [{ id: "o1", name: "HQ", alias: "HQ" }],
    departments: [{ id: "d1", name: "RH" }],
    teamMembers: [
      {
        id: "m1",
        firstName: "Alan",
        lastName: "Turing",
        email: "alan@example.com",
        departments: ["d1"],
      },
    ],
  }),
}));

vi.mock("../../src/pages/quiz/index.js", () => ({
  QUIZZES: { "theorie-x-y": { id: "theorie-x-y", title: "Théorie X-Y" } },
  getQuiz: (id) => (id === "theorie-x-y" ? { id, title: "Théorie X-Y" } : null),
}));

describe("useQuizInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_SEND_QUIZ_INVITE_FCM_URL", "https://example.com/fcm");
    createQuizInvitation.mockResolvedValue({ invitationId: "q1" });
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ sentCount: 1, failedCount: 0, skippedCount: 0 }),
    });
  });

  it("builds selection, persists and sends FCM invites", async () => {
    const { default: useQuizInvitation } = await import("../../src/hooks/useQuizInvitation.js");
    const hook = await renderHook(() => useQuizInvitation());

    await act(async () => {
      hook.result.setResponseDelayDays(21);
      hook.result.toggleDepartment("d1");
    });

    expect(hook.result.canSend).toBe(true);

    await act(async () => {
      await hook.result.handleSendInvites();
    });

    expect(createQuizInvitation).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ quizId: "theorie-x-y", totalGuestCount: 1 })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/fcm",
      expect.objectContaining({ method: "POST" })
    );

    expect(hook.result.inviteResultModal.isOpen).toBe(true);

    await hook.unmount();
  }, 10000);
});
