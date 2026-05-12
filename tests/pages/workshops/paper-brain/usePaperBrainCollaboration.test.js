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

const paperBrainServiceMocks = {
  addPaperBrainComment: vi.fn(),
  createPaperBrainNote: vi.fn(),
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

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock("../../../../src/firebase/workshops/paper-brain.service", () => paperBrainServiceMocks);

describe("usePaperBrainCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    paperBrainServiceMocks.subscribePaperBrainSession.mockImplementation((_sessionId, onData) => {
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

    paperBrainServiceMocks.upsertPaperBrainParticipant.mockResolvedValue(undefined);
    paperBrainServiceMocks.createPaperBrainNote.mockResolvedValue("n3");
    paperBrainServiceMocks.updatePaperBrainNote.mockResolvedValue(undefined);
    paperBrainServiceMocks.removePaperBrainNote.mockResolvedValue(undefined);
    paperBrainServiceMocks.addPaperBrainComment.mockResolvedValue("c2");
    paperBrainServiceMocks.updatePaperBrainComment.mockResolvedValue(undefined);
    paperBrainServiceMocks.removePaperBrainComment.mockResolvedValue(undefined);
    paperBrainServiceMocks.setPaperBrainNotePosition.mockResolvedValue(undefined);
    paperBrainServiceMocks.setPaperBrainStep1Description.mockResolvedValue(undefined);
    paperBrainServiceMocks.togglePaperBrainVote.mockResolvedValue({
      committed: true,
      votes: { n1: true },
    });
  });

  it("stays disabled for non paper-brain workshop", async () => {
    const { default: usePaperBrainCollaboration } = await import(
      "../../../../src/pages/workshops/paper-brain/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      usePaperBrainCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: usePaperBrainCollaboration } = await import(
      "../../../../src/pages/workshops/paper-brain/useCollaboration.js"
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

    expect(paperBrainServiceMocks.setPaperBrainStep1Description).toHaveBeenCalled();
    expect(paperBrainServiceMocks.createPaperBrainNote).toHaveBeenCalled();
    expect(paperBrainServiceMocks.updatePaperBrainNote).toHaveBeenCalled();
    expect(paperBrainServiceMocks.removePaperBrainNote).toHaveBeenCalled();
    expect(paperBrainServiceMocks.addPaperBrainComment).toHaveBeenCalled();
    expect(paperBrainServiceMocks.updatePaperBrainComment).toHaveBeenCalled();
    expect(paperBrainServiceMocks.removePaperBrainComment).toHaveBeenCalled();
    expect(paperBrainServiceMocks.setPaperBrainNotePosition).toHaveBeenCalled();
    expect(paperBrainServiceMocks.togglePaperBrainVote).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    paperBrainServiceMocks.subscribePaperBrainSession.mockImplementation(
      (_sessionId, _onData, onError) => {
      onError(new Error("sync failed"));
      return () => {};
      }
    );

    const { default: usePaperBrainCollaboration } = await import(
      "../../../../src/pages/workshops/paper-brain/useCollaboration.js"
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
