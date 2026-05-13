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

const continueStopTryServiceMocks = {
  createNote: vi.fn(),
  removeNote: vi.fn(),
  setNotePosition: vi.fn(),
  setDescription: vi.fn(),
  setPlaceholder: vi.fn(),
  subscribeSession: vi.fn(),
  toggleVote: vi.fn(),
  updateNote: vi.fn(),
  upsertParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock(
  "../../../../src/firebase/workshops/continue-stop-try.service",
  () => continueStopTryServiceMocks
);

describe("useContinueStopTryCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    continueStopTryServiceMocks.subscribeSession.mockImplementation(
      (_sessionId, onData) => {
        onData({
          step1: { description: "Challenge" },
          participants: {
            u1: { id: "u1", name: "Ada" },
            u2: { id: "u2", name: "Alan" },
          },
          notes: {
            n1: {
              id: "n1",
              authorId: "u1",
              columnId: "continue",
              text: "Conserver la revue hebdo",
              position: { x: 10, y: 20 },
              createdAt: "2026-03-25T10:00:00.000Z",
            },
            n2: {
              id: "n2",
              authorId: "u2",
              columnId: "stop",
              text: "Stopper les longs mails",
              position: { x: 20, y: 30 },
              createdAt: "2026-03-25T10:10:00.000Z",
            },
            n3: {
              id: "n3",
              authorId: "u1",
              columnId: "try",
              text: "Tenter une demo client",
              position: { x: 30, y: 40 },
              createdAt: "2026-03-25T10:20:00.000Z",
            },
          },
          votesByParticipant: {
            u1: { n1: true, n3: true },
            u2: { n1: true },
          },
          step5Placeholders: {
            continue: { text: "Maintenir la revue hebdo" },
            stop: { text: "Limiter les e-mails internes" },
            try: { text: "" },
          },
        });
        return () => {};
      }
    );

    continueStopTryServiceMocks.upsertParticipant.mockResolvedValue(undefined);
    continueStopTryServiceMocks.createNote.mockResolvedValue("n4");
    continueStopTryServiceMocks.updateNote.mockResolvedValue(undefined);
    continueStopTryServiceMocks.removeNote.mockResolvedValue(undefined);
    continueStopTryServiceMocks.setNotePosition.mockResolvedValue(undefined);
    continueStopTryServiceMocks.toggleVote.mockResolvedValue({
      committed: true,
      votes: { n1: true },
    });
    continueStopTryServiceMocks.setDescription.mockResolvedValue(undefined);
    continueStopTryServiceMocks.setPlaceholder.mockResolvedValue(undefined);
  });

  it("stays disabled for non continue-stop-try workshop", async () => {
    const { default: useContinueStopTryCollaboration } = await import(
      "../../../../src/pages/workshops/continue-stop-try/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useContinueStopTryCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useContinueStopTryCollaboration } = await import(
      "../../../../src/pages/workshops/continue-stop-try/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useContinueStopTryCollaboration({
        sessionId: "s1",
        workshopId: "continue-arrete-tente",
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
      expect(hook.result.notes).toHaveLength(3);
      expect(hook.result.description).toBe("Challenge");
      expect(hook.result.myNotes).toHaveLength(2);
    });

    await act(async () => {
      await hook.result.actions.setDescription("Nouveau challenge");
      await hook.result.actions.setPlaceholder("continue", "On garde le rituel");
      await hook.result.actions.addNote({ columnId: "continue", text: "Nouvelle note" });
      await hook.result.actions.updateNoteText("n1", "Note modifiee");
      await hook.result.actions.removeNote("n1");
      await hook.result.actions.setNotePosition("n2", { x: 120, y: 80 });
      await hook.result.actions.toggleVote("n1");
    });

    expect(continueStopTryServiceMocks.setDescription).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.setPlaceholder).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.createNote).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.updateNote).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.removeNote).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.setNotePosition).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.toggleVote).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    continueStopTryServiceMocks.subscribeSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useContinueStopTryCollaboration } = await import(
      "../../../../src/pages/workshops/continue-stop-try/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useContinueStopTryCollaboration({
        sessionId: "s1",
        workshopId: "continue-arrete-tente",
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
