import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../../../helpers/renderHook.js";

let authCallback;

const firebaseMocks = {
  auth: { currentUser: { uid: "u1", email: "ada@example.com", displayName: "Ada" } },
  onAuthStateChangedListener: vi.fn((cb) => {
    authCallback = cb;
    return () => {};
  }),
};

const defectuologieServiceMocks = {
  assignDefectuologieParticipantToSubgroup: vi.fn(),
  createDefectuologieDefect: vi.fn(),
  createDefectuologieSolution: vi.fn(),
  fetchDefectuologieSessionOnce: vi.fn(),
  initializeDefectuologieSubgroups: vi.fn(),
  removeDefectuologieDefect: vi.fn(),
  removeDefectuologieSolution: vi.fn(),
  setDefectuologieStep1Description: vi.fn(),
  setDefectuologieStep6Proposal: vi.fn(),
  subscribeDefectuologieSession: vi.fn(),
  toggleDefectuologieDefectVote: vi.fn(),
  toggleDefectuologieSolutionVote: vi.fn(),
  updateDefectuologieDefect: vi.fn(),
  updateDefectuologieSolution: vi.fn(),
  upsertDefectuologieParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock(
  "../../../../src/firebase/workshops/defectuologie.service",
  () => defectuologieServiceMocks
);

describe("useDefectuologieCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    defectuologieServiceMocks.subscribeDefectuologieSession.mockImplementation(
      (_sessionId, onData) => {
        onData({
          step1: { description: "Challenge" },
          participants: {
            u1: { id: "u1", name: "Ada" },
            u2: { id: "u2", name: "Alan" },
          },
          subgroups: {
            "group-1": {
              id: "group-1",
              label: "Sous-groupe 1",
              participantIds: { u1: true, u2: true },
            },
          },
          participantToSubgroup: { u1: "group-1", u2: "group-1" },
          defectsBySubgroup: {
            "group-1": {
              d1: {
                id: "d1",
                authorId: "u1",
                text: "Defaut 1",
                createdAt: "2026-03-25T10:00:00.000Z",
              },
              d2: {
                id: "d2",
                authorId: "u2",
                text: "Defaut 2",
                createdAt: "2026-03-25T10:10:00.000Z",
              },
            },
          },
          solutionsBySubgroup: {
            "group-1": {
              sol1: {
                id: "sol1",
                authorId: "u1",
                text: "Solution 1",
                createdAt: "2026-03-25T10:20:00.000Z",
              },
            },
          },
          defectVotesByParticipant: {
            u1: { d1: true },
            u2: { d1: true },
          },
          solutionVotesByParticipant: {
            u1: { sol1: true },
          },
          step6BySubgroup: {
            "group-1": {
              text: "Proposition initiale",
              updatedAt: "2026-03-25T11:00:00.000Z",
              updatedBy: "u1",
            },
          },
        });

        return () => {};
      }
    );

    defectuologieServiceMocks.fetchDefectuologieSessionOnce.mockResolvedValue(undefined);
    defectuologieServiceMocks.initializeDefectuologieSubgroups.mockResolvedValue(undefined);
    defectuologieServiceMocks.upsertDefectuologieParticipant.mockResolvedValue(undefined);
    defectuologieServiceMocks.assignDefectuologieParticipantToSubgroup.mockResolvedValue(undefined);
    defectuologieServiceMocks.createDefectuologieDefect.mockResolvedValue("d3");
    defectuologieServiceMocks.updateDefectuologieDefect.mockResolvedValue(undefined);
    defectuologieServiceMocks.removeDefectuologieDefect.mockResolvedValue(undefined);
    defectuologieServiceMocks.toggleDefectuologieDefectVote.mockResolvedValue({
      committed: true,
      votes: { d1: true },
    });
    defectuologieServiceMocks.createDefectuologieSolution.mockResolvedValue("sol2");
    defectuologieServiceMocks.updateDefectuologieSolution.mockResolvedValue(undefined);
    defectuologieServiceMocks.removeDefectuologieSolution.mockResolvedValue(undefined);
    defectuologieServiceMocks.toggleDefectuologieSolutionVote.mockResolvedValue({
      committed: true,
      votes: { sol1: true },
    });
    defectuologieServiceMocks.setDefectuologieStep1Description.mockResolvedValue(undefined);
    defectuologieServiceMocks.setDefectuologieStep6Proposal.mockResolvedValue(undefined);
  });

  it("stays disabled for non defectuologie workshop", async () => {
    const { default: useDefectuologieCollaboration } = await import(
      "../../../../src/pages/workshops/defectuologie/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useDefectuologieCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useDefectuologieCollaboration } = await import(
      "../../../../src/pages/workshops/defectuologie/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useDefectuologieCollaboration({
        sessionId: "s1",
        workshopId: "defectuologie",
        session: {
          allGuests: [
            { id: "u1", firstName: "Ada", lastName: "Lovelace" },
            { id: "u2", name: "Alan" },
          ],
        },
      })
    );

    await act(async () => {
      authCallback({ uid: "u1", email: "ada@example.com", displayName: "Ada" });
    });

    await waitFor(() => {
      expect(hook.result.isEnabled).toBe(true);
      expect(hook.result.participantReady).toBe(true);
      expect(hook.result.activeSubgroup?.id).toBe("group-1");
      expect(hook.result.activeDefects).toHaveLength(2);
      expect(hook.result.step1Description).toBe("Challenge");
    });

    await act(async () => {
      await hook.result.actions.setStep1Description("New challenge");
      await hook.result.actions.addDefect({ text: "Mon defaut" });
      await hook.result.actions.updateDefectText("d1", "Defaut modifie", "Defaut 1");
      await hook.result.actions.removeDefect("d1");
      await hook.result.actions.toggleDefectVote("d1");
      await hook.result.actions.addSolution({ text: "Ma solution" });
      await hook.result.actions.updateSolutionText("sol1", "Solution modifiee", "Solution 1");
      await hook.result.actions.removeSolution("sol1");
      await hook.result.actions.toggleSolutionVote("sol1");
      await hook.result.actions.setStep6Proposal("Concept final");
    });

    expect(defectuologieServiceMocks.setDefectuologieStep1Description).toHaveBeenCalled();
    expect(defectuologieServiceMocks.createDefectuologieDefect).toHaveBeenCalled();
    expect(defectuologieServiceMocks.updateDefectuologieDefect).toHaveBeenCalled();
    expect(defectuologieServiceMocks.removeDefectuologieDefect).toHaveBeenCalled();
    expect(defectuologieServiceMocks.toggleDefectuologieDefectVote).toHaveBeenCalled();
    expect(defectuologieServiceMocks.createDefectuologieSolution).toHaveBeenCalled();
    expect(defectuologieServiceMocks.updateDefectuologieSolution).toHaveBeenCalled();
    expect(defectuologieServiceMocks.removeDefectuologieSolution).toHaveBeenCalled();
    expect(defectuologieServiceMocks.toggleDefectuologieSolutionVote).toHaveBeenCalled();
    expect(defectuologieServiceMocks.setDefectuologieStep6Proposal).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    defectuologieServiceMocks.subscribeDefectuologieSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useDefectuologieCollaboration } = await import(
      "../../../../src/pages/workshops/defectuologie/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useDefectuologieCollaboration({ sessionId: "s1", workshopId: "defectuologie", session: {} })
    );

    await act(async () => {
      authCallback({ uid: "u1", email: "ada@example.com", displayName: "Ada" });
    });

    await waitFor(() => {
      expect(hook.result.syncError.length).toBeGreaterThan(0);
    });

    await hook.unmount();
  });
});

