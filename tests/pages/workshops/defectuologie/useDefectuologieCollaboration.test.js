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
  assignParticipantToSubgroup: vi.fn(),
  createDefect: vi.fn(),
  createSolution: vi.fn(),
  fetchSessionOnce: vi.fn(),
  initializeSubgroups: vi.fn(),
  removeDefect: vi.fn(),
  removeSolution: vi.fn(),
  setDescription: vi.fn(),
  setProposal: vi.fn(),
  subscribeSession: vi.fn(),
  toggleDefectVote: vi.fn(),
  toggleSolutionVote: vi.fn(),
  updateDefect: vi.fn(),
  updateSolution: vi.fn(),
  upsertParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock(
  "../../../../src/firebase/workshops/defectuologie.service",
  () => defectuologieServiceMocks
);

describe("useDefectuologieCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    defectuologieServiceMocks.subscribeSession.mockImplementation(
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

    defectuologieServiceMocks.fetchSessionOnce.mockResolvedValue(undefined);
    defectuologieServiceMocks.initializeSubgroups.mockResolvedValue(undefined);
    defectuologieServiceMocks.upsertParticipant.mockResolvedValue(undefined);
    defectuologieServiceMocks.assignParticipantToSubgroup.mockResolvedValue(undefined);
    defectuologieServiceMocks.createDefect.mockResolvedValue("d3");
    defectuologieServiceMocks.updateDefect.mockResolvedValue(undefined);
    defectuologieServiceMocks.removeDefect.mockResolvedValue(undefined);
    defectuologieServiceMocks.toggleDefectVote.mockResolvedValue({
      committed: true,
      votes: { d1: true },
    });
    defectuologieServiceMocks.createSolution.mockResolvedValue("sol2");
    defectuologieServiceMocks.updateSolution.mockResolvedValue(undefined);
    defectuologieServiceMocks.removeSolution.mockResolvedValue(undefined);
    defectuologieServiceMocks.toggleSolutionVote.mockResolvedValue({
      committed: true,
      votes: { sol1: true },
    });
    defectuologieServiceMocks.setDescription.mockResolvedValue(undefined);
    defectuologieServiceMocks.setProposal.mockResolvedValue(undefined);
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
      expect(hook.result.description).toBe("Challenge");
    });

    await act(async () => {
      await hook.result.actions.setDescription("New challenge");
      await hook.result.actions.addDefect({ text: "Mon defaut" });
      await hook.result.actions.updateDefectText("d1", "Defaut modifie", "Defaut 1");
      await hook.result.actions.removeDefect("d1");
      await hook.result.actions.toggleDefectVote("d1");
      await hook.result.actions.addSolution({ text: "Ma solution" });
      await hook.result.actions.updateSolutionText("sol1", "Solution modifiee", "Solution 1");
      await hook.result.actions.removeSolution("sol1");
      await hook.result.actions.toggleSolutionVote("sol1");
      await hook.result.actions.setProposal("Concept final");
    });

    expect(defectuologieServiceMocks.setDescription).toHaveBeenCalled();
    expect(defectuologieServiceMocks.createDefect).toHaveBeenCalled();
    expect(defectuologieServiceMocks.updateDefect).toHaveBeenCalled();
    expect(defectuologieServiceMocks.removeDefect).toHaveBeenCalled();
    expect(defectuologieServiceMocks.toggleDefectVote).toHaveBeenCalled();
    expect(defectuologieServiceMocks.createSolution).toHaveBeenCalled();
    expect(defectuologieServiceMocks.updateSolution).toHaveBeenCalled();
    expect(defectuologieServiceMocks.removeSolution).toHaveBeenCalled();
    expect(defectuologieServiceMocks.toggleSolutionVote).toHaveBeenCalled();
    expect(defectuologieServiceMocks.setProposal).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    defectuologieServiceMocks.subscribeSession.mockImplementation(
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

