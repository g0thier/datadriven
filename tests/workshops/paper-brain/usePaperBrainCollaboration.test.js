import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../../helpers/renderHook.js";

let authCallback;

const firebaseMocks = {
  addPaperBrainComment: vi.fn(),
  auth: { currentUser: { uid: "u1", email: "ada@example.com", displayName: "Ada" } },
  createPaperBrainNote: vi.fn(),
  onAuthStateChangedListener: vi.fn((cb) => {
    authCallback = cb;
    return () => {};
  }),
  removePaperBrainComment: vi.fn(),
  removePaperBrainNote: vi.fn(),
  setPaperBrainNotePosition: vi.fn(),
  setPaperBrainStep1Description: vi.fn(),
  subscribePaperBrainSession: vi.fn(),
  togglePaperBrainVote: vi.fn(),
  updatePaperBrainComment: vi.fn(),
  updatePaperBrainNote: vi.fn(),
  upsertPaperBrainParticipant: vi.fn(),
};

vi.mock("../../../src/firebase", () => firebaseMocks);

describe("usePaperBrainCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firebaseMocks.subscribePaperBrainSession.mockImplementation((_sessionId, onData) => {
      onData({
        step1: { description: "Challenge" },
        notes: {
          n1: {
            id: "n1",
            authorId: "u1",
            text: "Idea",
            position: { x: 10, y: 20 },
            createdAt: "2026-03-25T10:00:00.000Z",
          },
          n2: {
            id: "n2",
            authorId: "u2",
            text: "Other",
            position: { x: 20, y: 30 },
            createdAt: "2026-03-25T10:10:00.000Z",
          },
        },
        commentsByNote: {
          n2: {
            c1: { id: "c1", authorId: "u1", text: "Nice", createdAt: "2026-03-25T10:15:00.000Z" },
          },
        },
        votesByParticipant: {
          u1: { n2: true },
          u2: { n1: true },
        },
        participants: {
          u1: { id: "u1", name: "Ada" },
          u2: { id: "u2", name: "Alan" },
        },
      });
      return () => {};
    });

    firebaseMocks.upsertPaperBrainParticipant.mockResolvedValue(undefined);
    firebaseMocks.createPaperBrainNote.mockResolvedValue("n3");
    firebaseMocks.updatePaperBrainNote.mockResolvedValue(undefined);
    firebaseMocks.removePaperBrainNote.mockResolvedValue(undefined);
    firebaseMocks.addPaperBrainComment.mockResolvedValue("c2");
    firebaseMocks.updatePaperBrainComment.mockResolvedValue(undefined);
    firebaseMocks.removePaperBrainComment.mockResolvedValue(undefined);
    firebaseMocks.setPaperBrainNotePosition.mockResolvedValue(undefined);
    firebaseMocks.setPaperBrainStep1Description.mockResolvedValue(undefined);
    firebaseMocks.togglePaperBrainVote.mockResolvedValue({ committed: true, votes: { n1: true } });
  });

  it("stays disabled for non paper-brain workshop", async () => {
    const { default: usePaperBrainCollaboration } = await import(
      "../../../src/workshops/paper-brain/usePaperBrainCollaboration.js"
    );

    const hook = await renderHook(() =>
      usePaperBrainCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: usePaperBrainCollaboration } = await import(
      "../../../src/workshops/paper-brain/usePaperBrainCollaboration.js"
    );

    const hook = await renderHook(() =>
      usePaperBrainCollaboration({
        sessionId: "s1",
        workshopId: "paper-brain",
        session: { allGuests: [{ id: "u1", firstName: "Ada", lastName: "Lovelace" }, { id: "u2", name: "Alan" }] },
      })
    );

    await act(async () => {
      authCallback({ uid: "u1", email: "ada@example.com", displayName: "Ada" });
    });

    await waitFor(() => {
      expect(hook.result.isEnabled).toBe(true);
      expect(hook.result.participantReady).toBe(true);
      expect(hook.result.notes).toHaveLength(2);
      expect(hook.result.step1Description).toBe("Challenge");
    });

    await act(async () => {
      await hook.result.actions.setStep1Description("New challenge");
      await hook.result.actions.addNote({ text: "My note" });
      await hook.result.actions.updateNoteText("n1", "Edited");
      await hook.result.actions.removeNote("n1");
      await hook.result.actions.addComment("n2", "Hey");
      await hook.result.actions.updateCommentText("n2", "c1", "Edited comment");
      await hook.result.actions.removeComment("n2", "c1");
      await hook.result.actions.setNotePosition("n2", { x: 33, y: 44 });
      await hook.result.actions.toggleVote("n2");
    });

    expect(firebaseMocks.setPaperBrainStep1Description).toHaveBeenCalled();
    expect(firebaseMocks.createPaperBrainNote).toHaveBeenCalled();
    expect(firebaseMocks.updatePaperBrainNote).toHaveBeenCalled();
    expect(firebaseMocks.removePaperBrainNote).toHaveBeenCalled();
    expect(firebaseMocks.addPaperBrainComment).toHaveBeenCalled();
    expect(firebaseMocks.updatePaperBrainComment).toHaveBeenCalled();
    expect(firebaseMocks.removePaperBrainComment).toHaveBeenCalled();
    expect(firebaseMocks.setPaperBrainNotePosition).toHaveBeenCalled();
    expect(firebaseMocks.togglePaperBrainVote).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    firebaseMocks.subscribePaperBrainSession.mockImplementation((_sessionId, _onData, onError) => {
      onError(new Error("sync failed"));
      return () => {};
    });

    const { default: usePaperBrainCollaboration } = await import(
      "../../../src/workshops/paper-brain/usePaperBrainCollaboration.js"
    );

    const hook = await renderHook(() =>
      usePaperBrainCollaboration({ sessionId: "s1", workshopId: "paper-brain", session: {} })
    );

    await act(async () => {
      authCallback({ uid: "u1", email: "ada@example.com" });
    });

    await waitFor(() => {
      expect(hook.result.syncError.length).toBeGreaterThan(0);
    });

    await hook.unmount();
  });
});
