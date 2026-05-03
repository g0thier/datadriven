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
  addDesignThinkingIdeationComment: vi.fn(),
  createDesignThinkingIdeationNote: vi.fn(),
  createDesignThinkingPrototypeFeedbackNote: vi.fn(),
  createDesignThinkingSharedNote: vi.fn(),
  removeDesignThinkingIdeationComment: vi.fn(),
  removeDesignThinkingIdeationNote: vi.fn(),
  removeDesignThinkingPrototypeFeedbackNote: vi.fn(),
  removeDesignThinkingSharedNote: vi.fn(),
  setDesignThinkingConclusion: vi.fn(),
  setDesignThinkingIdeationNotePosition: vi.fn(),
  setDesignThinkingProblemStatement: vi.fn(),
  setDesignThinkingStep1Description: vi.fn(),
  subscribeDesignThinkingSession: vi.fn(),
  toggleDesignThinkingIdeationVote: vi.fn(),
  updateDesignThinkingIdeationComment: vi.fn(),
  updateDesignThinkingIdeationNote: vi.fn(),
  updateDesignThinkingPrototypeFeedbackNote: vi.fn(),
  updateDesignThinkingSharedNote: vi.fn(),
  upsertDesignThinkingParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock(
  "../../../../src/firebase/workshops/design-thinking.service",
  () => designThinkingServiceMocks
);

describe("useDesignThinkingCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    designThinkingServiceMocks.subscribeDesignThinkingSession.mockImplementation(
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

    designThinkingServiceMocks.upsertDesignThinkingParticipant.mockResolvedValue(undefined);
    designThinkingServiceMocks.setDesignThinkingStep1Description.mockResolvedValue(undefined);
    designThinkingServiceMocks.setDesignThinkingProblemStatement.mockResolvedValue(undefined);
    designThinkingServiceMocks.setDesignThinkingConclusion.mockResolvedValue(undefined);
    designThinkingServiceMocks.createDesignThinkingSharedNote.mockResolvedValue("s2");
    designThinkingServiceMocks.updateDesignThinkingSharedNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.removeDesignThinkingSharedNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.createDesignThinkingPrototypeFeedbackNote.mockResolvedValue("pf2");
    designThinkingServiceMocks.updateDesignThinkingPrototypeFeedbackNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.removeDesignThinkingPrototypeFeedbackNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.createDesignThinkingIdeationNote.mockResolvedValue("n3");
    designThinkingServiceMocks.updateDesignThinkingIdeationNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.removeDesignThinkingIdeationNote.mockResolvedValue(undefined);
    designThinkingServiceMocks.addDesignThinkingIdeationComment.mockResolvedValue("c2");
    designThinkingServiceMocks.updateDesignThinkingIdeationComment.mockResolvedValue(undefined);
    designThinkingServiceMocks.removeDesignThinkingIdeationComment.mockResolvedValue(undefined);
    designThinkingServiceMocks.setDesignThinkingIdeationNotePosition.mockResolvedValue(undefined);
    designThinkingServiceMocks.toggleDesignThinkingIdeationVote.mockResolvedValue({
      committed: true,
      votes: { n2: true },
    });
  });

  it("stays disabled for non design-thinking workshop", async () => {
    const { default: useDesignThinkingCollaboration } = await import(
      "../../../../src/pages/workshops/design-thinking/useDesignThinkingCollaboration.js"
    );

    const hook = await renderHook(() =>
      useDesignThinkingCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useDesignThinkingCollaboration } = await import(
      "../../../../src/pages/workshops/design-thinking/useDesignThinkingCollaboration.js"
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
      expect(hook.result.step1Description).toBe("Challenge");
      expect(hook.result.problemStatement).toBe("Problem");
      expect(hook.result.conclusion).toBe("Conclusion");
      expect(hook.result.sharedNotes).toHaveLength(1);
      expect(hook.result.prototypeFeedbackNotes).toHaveLength(1);
      expect(hook.result.notes).toHaveLength(2);
    });

    await act(async () => {
      await hook.result.actions.setStep1Description("New challenge");
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

    expect(designThinkingServiceMocks.setDesignThinkingStep1Description).toHaveBeenCalled();
    expect(designThinkingServiceMocks.setDesignThinkingProblemStatement).toHaveBeenCalled();
    expect(designThinkingServiceMocks.setDesignThinkingConclusion).toHaveBeenCalled();

    expect(designThinkingServiceMocks.createDesignThinkingSharedNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updateDesignThinkingSharedNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removeDesignThinkingSharedNote).toHaveBeenCalled();

    expect(designThinkingServiceMocks.createDesignThinkingPrototypeFeedbackNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updateDesignThinkingPrototypeFeedbackNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removeDesignThinkingPrototypeFeedbackNote).toHaveBeenCalled();

    expect(designThinkingServiceMocks.createDesignThinkingIdeationNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updateDesignThinkingIdeationNote).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removeDesignThinkingIdeationNote).toHaveBeenCalled();

    expect(designThinkingServiceMocks.addDesignThinkingIdeationComment).toHaveBeenCalled();
    expect(designThinkingServiceMocks.updateDesignThinkingIdeationComment).toHaveBeenCalled();
    expect(designThinkingServiceMocks.removeDesignThinkingIdeationComment).toHaveBeenCalled();

    expect(designThinkingServiceMocks.setDesignThinkingIdeationNotePosition).toHaveBeenCalled();
    expect(designThinkingServiceMocks.toggleDesignThinkingIdeationVote).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    designThinkingServiceMocks.subscribeDesignThinkingSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useDesignThinkingCollaboration } = await import(
      "../../../../src/pages/workshops/design-thinking/useDesignThinkingCollaboration.js"
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
