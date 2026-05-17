import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "../helpers/renderHook.js";

const navigateMock = vi.fn();
const createWorkshopSession = vi.fn();
const auth = {
  currentUser: {
    uid: "u1",
    email: "inviter@example.com",
    displayName: "Ada Lovelace",
  },
};

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: { workshop: { id: "paper-brain", title: "Paper Brain", duration: "50 minutes" } } }),
  useNavigate: () => navigateMock,
}));

vi.mock("../../src/firebase", () => ({
  auth,
  createWorkshopSession,
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

vi.mock("../../src/workshops", () => ({
  WORKSHOPS: { "paper-brain": { id: "paper-brain", title: "Paper Brain" } },
  getWorkshop: (id) => (id === "paper-brain" ? { id, title: "Paper Brain" } : null),
}));

vi.mock("../../src/utils/workshopDateTime", () => ({
  resolveDefaultWorkshopTimeZone: () => "Europe/Zurich",
  toWorkshopStartIso: vi.fn(() => "2026-03-25T09:30:00.000Z"),
}));

describe("useWorkshopInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createWorkshopSession.mockResolvedValue({ sessionId: "s1" });
    global.fetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) });
  });

  it("builds selection and sends invites", async () => {
    const { default: useWorkshopInvitation } = await import("../../src/hooks/useWorkshopInvitation.js");
    const hook = await renderHook(() => useWorkshopInvitation());

    await act(async () => {
      hook.result.setWorkshopDate("2026-03-25");
      hook.result.setWorkshopTime("10:30");
      hook.result.toggleDepartment("d1");
    });

    expect(hook.result.canSend).toBe(true);

    await act(async () => {
      await hook.result.handleSendInvites();
    });

    expect(createWorkshopSession).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ workshopId: "paper-brain", totalGuestCount: 1 })
    );
    expect(global.fetch).toHaveBeenCalled();
    expect(hook.result.inviteResultModal.isOpen).toBe(true);

    await hook.unmount();
  }, 10000);
});
