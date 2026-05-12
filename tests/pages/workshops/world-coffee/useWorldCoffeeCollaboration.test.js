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

const worldCoffeeServiceMocks = {
  addWorldCoffeeCommentReply: vi.fn(),
  addWorldCoffeeIdeaComment: vi.fn(),
  applyWorldCoffeeReturnRotation: vi.fn(),
  applyWorldCoffeeRound2Rotation: vi.fn(),
  applyWorldCoffeeRound3Rotation: vi.fn(),
  clearWorldCoffeeFacilitator: vi.fn(),
  createWorldCoffeeDescription: vi.fn(),
  createWorldCoffeeIdea: vi.fn(),
  initializeWorldCoffeeSubgroups: vi.fn(),
  removeWorldCoffeeCommentReply: vi.fn(),
  removeWorldCoffeeDescription: vi.fn(),
  removeWorldCoffeeIdea: vi.fn(),
  removeWorldCoffeeIdeaComment: vi.fn(),
  setWorldCoffeeFacilitator: vi.fn(),
  subscribeWorldCoffeeSession: vi.fn(),
  updateWorldCoffeeCommentReply: vi.fn(),
  updateWorldCoffeeDescription: vi.fn(),
  updateWorldCoffeeIdea: vi.fn(),
  updateWorldCoffeeIdeaComment: vi.fn(),
  updateWorldCoffeeSubgroupSynthesis: vi.fn(),
  upsertWorldCoffeeParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock(
  "../../../../src/firebase/workshops/world-coffee.service",
  () => worldCoffeeServiceMocks
);

describe("useWorldCoffeeCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    worldCoffeeServiceMocks.subscribeWorldCoffeeSession.mockImplementation((_sessionId, onData) => {
      onData({
        descriptions: {
          d1: {
            id: "d1",
            authorId: "u1",
            text: "Sujet 1",
            createdAt: "2026-03-25T10:00:00.000Z",
            updatedAt: "2026-03-25T10:00:00.000Z",
          },
          d2: {
            id: "d2",
            authorId: "u2",
            text: "Sujet 2",
            createdAt: "2026-03-25T10:10:00.000Z",
            updatedAt: "2026-03-25T10:10:00.000Z",
          },
        },
        facilitatorByDescriptionId: {
          d1: "u1",
          d2: "u2",
        },
        participants: {
          u1: { id: "u1", name: "Ada" },
          u2: { id: "u2", name: "Alan" },
          u3: { id: "u3", name: "Grace" },
        },
        subgroups: {
          "group-1": {
            id: "group-1",
            label: "Sous-groupe 1",
            descriptionId: "d1",
            facilitatorId: "u1",
            participantIds: { u1: true, u3: true },
          },
          "group-2": {
            id: "group-2",
            label: "Sous-groupe 2",
            descriptionId: "d2",
            facilitatorId: "u2",
            participantIds: { u2: true },
          },
        },
        participantToSubgroup: {
          u1: "group-1",
          u2: "group-2",
          u3: "group-1",
        },
        ideasBySubgroup: {
          "group-1": {
            i1: {
              id: "i1",
              authorId: "u1",
              text: "Idee 1",
              roundId: "round-1",
              roundLabel: "premier-round",
              createdAt: "2026-03-25T10:20:00.000Z",
              updatedAt: "2026-03-25T10:20:00.000Z",
            },
          },
        },
        commentsByIdea: {
          i1: {
            c1: {
              id: "c1",
              authorId: "u2",
              text: "Commentaire 1",
              roundId: "round-2",
              roundLabel: "premier-rotation",
              createdAt: "2026-03-25T10:30:00.000Z",
              updatedAt: "2026-03-25T10:30:00.000Z",
            },
          },
        },
        repliesByComment: {
          c1: {
            r1: {
              id: "r1",
              authorId: "u1",
              text: "Reponse 1",
              roundId: "round-3",
              roundLabel: "deuxieme-rotation",
              createdAt: "2026-03-25T10:40:00.000Z",
              updatedAt: "2026-03-25T10:40:00.000Z",
            },
          },
          "idea-i1": {
            ir1: {
              id: "ir1",
              authorId: "u1",
              text: "Reponse idee 1",
              roundId: "round-3",
              roundLabel: "deuxieme-rotation",
              createdAt: "2026-03-25T10:45:00.000Z",
              updatedAt: "2026-03-25T10:45:00.000Z",
            },
          },
        },
        synthesisBySubgroup: {
          "group-1": {
            text: "Synthese initiale",
            authorId: "u1",
            createdAt: "2026-03-25T11:00:00.000Z",
            updatedAt: "2026-03-25T11:00:00.000Z",
          },
        },
      });
      return () => {};
    });

    worldCoffeeServiceMocks.upsertWorldCoffeeParticipant.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.initializeWorldCoffeeSubgroups.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.createWorldCoffeeDescription.mockResolvedValue("d3");
    worldCoffeeServiceMocks.updateWorldCoffeeDescription.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.removeWorldCoffeeDescription.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.setWorldCoffeeFacilitator.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.clearWorldCoffeeFacilitator.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.createWorldCoffeeIdea.mockResolvedValue("i2");
    worldCoffeeServiceMocks.updateWorldCoffeeIdea.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.removeWorldCoffeeIdea.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.applyWorldCoffeeRound2Rotation.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.applyWorldCoffeeRound3Rotation.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.applyWorldCoffeeReturnRotation.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.addWorldCoffeeIdeaComment.mockResolvedValue("c2");
    worldCoffeeServiceMocks.updateWorldCoffeeIdeaComment.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.removeWorldCoffeeIdeaComment.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.addWorldCoffeeCommentReply.mockResolvedValue("r2");
    worldCoffeeServiceMocks.updateWorldCoffeeCommentReply.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.removeWorldCoffeeCommentReply.mockResolvedValue(undefined);
    worldCoffeeServiceMocks.updateWorldCoffeeSubgroupSynthesis.mockResolvedValue(undefined);
  });

  it("stays disabled for non world-cafe workshop", async () => {
    const { default: useWorldCoffeeCollaboration } = await import(
      "../../../../src/pages/workshops/world-coffee/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useWorldCoffeeCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useWorldCoffeeCollaboration } = await import(
      "../../../../src/pages/workshops/world-coffee/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useWorldCoffeeCollaboration({
        sessionId: "s1",
        workshopId: "world-cafe",
        session: {
          allGuests: [
            { id: "u1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
            { id: "u2", firstName: "Alan", lastName: "Turing" },
            { id: "u3", firstName: "Grace", lastName: "Hopper" },
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
      expect(hook.result.descriptions).toHaveLength(2);
      expect(hook.result.subgroups).toHaveLength(2);
      expect(hook.result.activeSubgroup?.id).toBe("group-1");
      expect(hook.result.activeSubgroupDescription?.text).toBe("Sujet 1");
      expect(hook.result.activeIdeas).toHaveLength(1);
      expect(hook.result.hasUnassignedDescriptions).toBe(false);
      expect(hook.result.activeRound).toBe("round-2");
    });

    await waitFor(() => {
      expect(worldCoffeeServiceMocks.initializeWorldCoffeeSubgroups).toHaveBeenCalled();
    });

    await act(async () => {
      await hook.result.actions.addDescription({ text: "Sujet 3" });
      await hook.result.actions.updateDescription("d1", "Sujet 1 maj", "Sujet 1");
      await hook.result.actions.removeDescription("d2");
      await hook.result.actions.setFacilitator("d1", "u2");
      await hook.result.actions.clearFacilitator("d2");
      await hook.result.actions.addIdea({ text: "Idee 2" });
      await hook.result.actions.updateIdeaText("i1", "Idee 1 maj", "Idee 1");
      await hook.result.actions.removeIdea("i1");
      await hook.result.actions.ensureRound2Rotation();
      await hook.result.actions.ensureRound3Rotation();
      await hook.result.actions.ensureReturnRotation();
      await hook.result.actions.addIdeaComment("i1", "Commentaire 2");
      await hook.result.actions.updateIdeaCommentText("i1", "c1", "Commentaire 1 maj");
      await hook.result.actions.removeIdeaComment("i1", "c1");
      await hook.result.actions.addCommentReply("c1", "Reponse 2");
      await hook.result.actions.updateCommentReplyText("c1", "r1", "Reponse 1 maj");
      await hook.result.actions.removeCommentReply("idea-i1", "ir1");
      await hook.result.actions.updateSubgroupSynthesis("Synthese finale", "Synthese initiale");
    });

    expect(worldCoffeeServiceMocks.createWorldCoffeeDescription).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.updateWorldCoffeeDescription).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.removeWorldCoffeeDescription).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.setWorldCoffeeFacilitator).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.clearWorldCoffeeFacilitator).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.createWorldCoffeeIdea).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.updateWorldCoffeeIdea).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.removeWorldCoffeeIdea).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.applyWorldCoffeeRound2Rotation).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.applyWorldCoffeeRound3Rotation).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.applyWorldCoffeeReturnRotation).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.addWorldCoffeeIdeaComment).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.updateWorldCoffeeIdeaComment).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.removeWorldCoffeeIdeaComment).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.addWorldCoffeeCommentReply).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.updateWorldCoffeeCommentReply).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.removeWorldCoffeeCommentReply).toHaveBeenCalled();
    expect(worldCoffeeServiceMocks.updateWorldCoffeeSubgroupSynthesis).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    worldCoffeeServiceMocks.subscribeWorldCoffeeSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useWorldCoffeeCollaboration } = await import(
      "../../../../src/pages/workshops/world-coffee/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useWorldCoffeeCollaboration({ sessionId: "s1", workshopId: "world-cafe", session: {} })
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
