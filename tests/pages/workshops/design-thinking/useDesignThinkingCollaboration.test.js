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

const designThinkingServiceMocks = {
  addIdeationComment: vi.fn(),
  createIdeationNote: vi.fn(),
  createPrototypeFeedbackNote: vi.fn(),
  createSharedNote: vi.fn(),
  removeIdeationComment: vi.fn(),
  removeIdeationNote: vi.fn(),
  removePrototypeFeedbackNote: vi.fn(),
  removeSharedNote: vi.fn(),
  setConclusion: vi.fn(),
  setIdeationNotePosition: vi.fn(),
  setProblemStatement: vi.fn(),
  setDescription: vi.fn(),
  subscribeSession: vi.fn(),
  toggleIdeationVote: vi.fn(),
  updateIdeationComment: vi.fn(),
  updateIdeationNote: vi.fn(),
  updatePrototypeFeedbackNote: vi.fn(),
  updateSharedNote: vi.fn(),
  upsertParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock(
  "../../../../src/firebase/workshops/design-thinking.service",
  () => designThinkingServiceMocks
);

describe("useDesignThinkingCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    designThinkingServiceMocks.subscribeSession.mockImplementation(
      (_sessionId, onData) => {
        onData({
          step1: { description: "Challenge" },
          sharedNotes: {
            s1: {
              id: "s1",
              authorId: "u1",
              text: "Observation",
              createdAt: "2026-03-25T09:00:00.000Z",
            },
          },
          problemStatement: { text: "Problem" },
          conclusion: { text: "Conclusion" },
          participants: {
            u1: { id: "u1", name: "Ada" },
            u2: { id: "u2", name: "Alan" },
          },
          prototypeFeedback: {
            notes: {
              pf1: {
                id: "pf1",
                authorId: "u2",
                columnId: "works",
                text: "Fonctionne",
                createdAt: "2026-03-25T09:30:00.000Z",
              },
            },
          },
          ideation: {
            notes: {
              n1: {
                id: "n1",
                authorId: "u1",
                text: "My idea",
                position: { x: 10, y: 20 },
                createdAt: "2026-03-25T10:00:00.000Z",
              },
              n2: {
                id: "n2",
                authorId: "u2",
                text: "Other idea",
                position: { x: 20, y: 30 },
                createdAt: "2026-03-25T10:10:00.000Z",
              },
            },
            commentsByNote: {
              n2: {
                c1: {
                  id: "c1",
                  authorId: "u1",
                  text: "Nice",
                  createdAt: "2026-03-25T10:15:00.000Z",
                },
              },
            },
            votesByParticipant: {
              u1: { n2: true },
              u2: { n1: true },
            },
          },
        });
        return () => {};
      }
    );

    designThinkingServiceMocks.upsertParticipant.mockResolvedValue(undefined);
    designThinkingServiceMocks.setDescription.mockResolvedValue(undefined);
    designThinkingServiceMocks.setProblemStatement.mockResolvedValue(undefined);
    designThinkingServiceMocks.setConclusion.mockResolvedValue(undefined);
    designThinkingServiceMocks.createSharedNote.mockResolvedValue("s2");
    designThinkingServiceMocks.updateSharedNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.removeSharedNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.createPrototypeFeedbackNote.mockResolvedValue("pf2");
    designThinkingServiceMocks.updatePrototypeFeedbackNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.removePrototypeFeedbackNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.createIdeationNote.mockResolvedValue("n3");
    designThinkingServiceMocks.updateIdeationNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.removeIdeationNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.addIdeationComment.mockResolvedValue("c2");
    designThinkingServiceMocks.updateIdeationComment.mockResolvedValue(undefined);
    designThinkingServiceMocks.removeIdeationComment.mockResolvedValue(undefined);
    designThinkingServiceMocks.setIdeationNotePosition.mockResolvedValue(undefined);
    designThinkingServiceMocks.toggleIdeationVote.mockResolvedValue({
      committed: true,
      votes: { n2: true },
    });
  });

  it("stays disabled for non design-thinking workshop", async () => {
    const { default: useDesignThinkingCollaboration } = await import(
      "../../../../src/pages/workshops/design-thinking/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useDesignThinkingCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useDesignThinkingCollaboration } = await import(
      "../../../../src/pages/workshops/design-thinking/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useDesignThinkingCollaboration({
        sessionId: "s1",
        workshopId: "design-thinking",
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
      expect(hook.result.description).toBe("Challenge");
      expect(hook.result.problemStatement).toBe("Problem");
      expect(hook.result.conclusion).toBe("Conclusion");
      expect(hook.result.sharedNotes).toHaveLength(1);
      expect(hook.result.prototypeFeedbackNotes).toHaveLength(1);
      expect(hook.result.notes).toHaveLength(2);
    });

    await act(async () => {
      await hook.result.actions.setDescription("New challenge");
      await hook.result.actions.setProblemStatement("New problem");
      await hook.result.actions.setConclusion("New conclusion");

      await hook.result.actions.addSharedNote({ text: "Shared" });
      await hook.result.actions.updateSharedNoteText("s1", "Shared edited");
      await hook.result.actions.removeSharedNote("s1");

      await hook.result.actions.addPrototypeFeedbackNote({ columnId: "works", text: "Feedback" });
      await hook.result.actions.updatePrototypeFeedbackNoteText("pf1", "Feedback edited");
      await hook.result.actions.removePrototypeFeedbackNote("pf1");

      await hook.result.actions.addNote({ text: "Idea" });
      await hook.result.actions.updateNoteText("n1", "Idea edited");
      await hook.result.actions.removeNote("n1");

      await hook.result.actions.addComment("n2", "Comment");
      await hook.result.actions.updateCommentText("n2", "c1", "Comment edited");
      await hook.result.actions.removeComment("n2", "c1");

      await hook.result.actions.setNotePosition("n2", { x: 33, y: 44 });
      await hook.result.actions.toggleVote("n2");
    });

    expect(designThinkingServiceMocks.setDescription).toHaveBeenCalled();
    expect(designThinkingServiceMocks.setProblemStatement).toHaveBeenCalled();
    expect(designThinkingServiceMocks.setConclusion).toHaveBeenCalled();

    expect(designThinkingServiceMocks.createSharedNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updateSharedNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removeSharedNote).toHaveBeenCalled();

    expect(designThinkingServiceMocks.createPrototypeFeedbackNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updatePrototypeFeedbackNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removePrototypeFeedbackNote).toHaveBeenCalled();

    expect(designThinkingServiceMocks.createIdeationNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updateIdeationNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removeIdeationNote).toHaveBeenCalled();

    expect(designThinkingServiceMocks.addIdeationComment).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updateIdeationComment).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removeIdeationComment).toHaveBeenCalled();

    expect(designThinkingServiceMocks.setIdeationNotePosition).toHaveBeenCalled();
    expect(designThinkingServiceMocks.toggleIdeationVote).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    designThinkingServiceMocks.subscribeSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useDesignThinkingCollaboration } = await import(
      "../../../../src/pages/workshops/design-thinking/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useDesignThinkingCollaboration({
        sessionId: "s1",
        workshopId: "design-thinking",
        session: {},
      })
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
