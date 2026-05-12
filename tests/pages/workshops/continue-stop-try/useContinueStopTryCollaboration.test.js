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
  createContinueStopTryNote: vi.fn(),
  removeContinueStopTryNote: vi.fn(),
  setContinueStopTryNotePosition: vi.fn(),
  setContinueStopTryStep1Description: vi.fn(),
  setContinueStopTryStep5Placeholder: vi.fn(),
  subscribeContinueStopTrySession: vi.fn(),
  toggleContinueStopTryVote: vi.fn(),
  updateContinueStopTryNote: vi.fn(),
  upsertContinueStopTryParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock(
  "../../../../src/firebase/workshops/continue-stop-try.service",
  () => continueStopTryServiceMocks
);

describe("useContinueStopTryCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    continueStopTryServiceMocks.subscribeContinueStopTrySession.mockImplementation(
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

    continueStopTryServiceMocks.upsertContinueStopTryParticipant.mockResolvedValue(undefined);
    continueStopTryServiceMocks.createContinueStopTryNote.mockResolvedValue("n4");
    continueStopTryServiceMocks.updateContinueStopTryNote.mockResolvedValue(undefined);
    continueStopTryServiceMocks.removeContinueStopTryNote.mockResolvedValue(undefined);
    continueStopTryServiceMocks.setContinueStopTryNotePosition.mockResolvedValue(undefined);
    continueStopTryServiceMocks.toggleContinueStopTryVote.mockResolvedValue({
      committed: true,
      votes: { n1: true },
    });
    continueStopTryServiceMocks.setContinueStopTryStep1Description.mockResolvedValue(undefined);
    continueStopTryServiceMocks.setContinueStopTryStep5Placeholder.mockResolvedValue(undefined);
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
      expect(hook.result.step1Description).toBe("Challenge");
      expect(hook.result.myNotes).toHaveLength(2);
    });

    await act(async () => {
      await hook.result.actions.setStep1Description("Nouveau challenge");
      await hook.result.actions.setStep5Placeholder("continue", "On garde le rituel");
      await hook.result.actions.addNote({ columnId: "continue", text: "Nouvelle note" });
      await hook.result.actions.updateNoteText("n1", "Note modifiee");
      await hook.result.actions.removeNote("n1");
      await hook.result.actions.setNotePosition("n2", { x: 120, y: 80 });
      await hook.result.actions.toggleVote("n1");
    });

    expect(continueStopTryServiceMocks.setContinueStopTryStep1Description).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.setContinueStopTryStep5Placeholder).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.createContinueStopTryNote).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.updateContinueStopTryNote).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.removeContinueStopTryNote).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.setContinueStopTryNotePosition).toHaveBeenCalled();
    expect(continueStopTryServiceMocks.toggleContinueStopTryVote).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    continueStopTryServiceMocks.subscribeContinueStopTrySession.mockImplementation(
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
