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

const speedBoatServiceMocks = {
  createBrakeNote: vi.fn(),
  createLeverNote: vi.fn(),
  removeBrakeNote: vi.fn(),
  removeLeverNote: vi.fn(),
  setBrakeNotePosition: vi.fn(),
  setLeverNotePosition: vi.fn(),
  setBrakeAction: vi.fn(),
  setDescription: vi.fn(),
  setObjective: vi.fn(),
  subscribeSession: vi.fn(),
  toggleBrakeVote: vi.fn(),
  updateBrakeNote: vi.fn(),
  updateLeverNote: vi.fn(),
  upsertParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock("../../../../src/firebase/workshops/speed-boat.service", () => speedBoatServiceMocks);

describe("useSpeedBoatCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    speedBoatServiceMocks.subscribeSession.mockImplementation((_sessionId, onData) => {
      onData({
        step1: { description: "Challenge" },
        step2: { objective: "Objectif" },
        notesByType: {
          brakes: {
            b1: {
              id: "b1",
              authorId: "u1",
              text: "Frein 1",
              position: { x: 10, y: 20 },
              createdAt: "2026-03-25T10:00:00.000Z",
            },
            b2: {
              id: "b2",
              authorId: "u2",
              text: "Frein 2",
              position: { x: 30, y: 40 },
              createdAt: "2026-03-25T10:10:00.000Z",
            },
          },
          levers: {
            l1: {
              id: "l1",
              authorId: "u1",
              text: "Levier 1",
              position: { x: 15, y: 25 },
              createdAt: "2026-03-25T10:05:00.000Z",
            },
          },
        },
        votesByParticipant: {
          u1: { b2: true },
          u2: { b1: true },
        },
        actionsByBrake: {
          b1: { text: "Action frein 1" },
        },
        participants: {
          u1: { id: "u1", name: "Ada" },
          u2: { id: "u2", name: "Alan" },
        },
      });
      return () => {};
    });

    speedBoatServiceMocks.upsertParticipant.mockResolvedValue(undefined);
    speedBoatServiceMocks.createBrakeNote.mockResolvedValue("b3");
    speedBoatServiceMocks.updateBrakeNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.removeBrakeNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.setBrakeNotePosition.mockResolvedValue(undefined);
    speedBoatServiceMocks.createLeverNote.mockResolvedValue("l2");
    speedBoatServiceMocks.updateLeverNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.removeLeverNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.setLeverNotePosition.mockResolvedValue(undefined);
    speedBoatServiceMocks.toggleBrakeVote.mockResolvedValue({
      committed: true,
      votes: { b2: true },
    });
    speedBoatServiceMocks.setDescription.mockResolvedValue(undefined);
    speedBoatServiceMocks.setObjective.mockResolvedValue(undefined);
    speedBoatServiceMocks.setBrakeAction.mockResolvedValue(undefined);
  });

  it("stays disabled for non speed-boat workshop", async () => {
    const { default: useSpeedBoatCollaboration } = await import(
      "../../../../src/pages/workshops/speed-boat/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useSpeedBoatCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useSpeedBoatCollaboration } = await import(
      "../../../../src/pages/workshops/speed-boat/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useSpeedBoatCollaboration({
        sessionId: "s1",
        workshopId: "speed-boat",
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
      expect(hook.result.objective).toBe("Objectif");
      expect(hook.result.brakeNotes).toHaveLength(2);
      expect(hook.result.leverNotes).toHaveLength(1);
      expect(hook.result.actionsByBrake.b1).toBe("Action frein 1");
    });

    await act(async () => {
      await hook.result.actions.setDescription("Nouveau challenge");
      await hook.result.actions.setObjective("Nouvel objectif");
      await hook.result.actions.addBrakeNote({ text: "Mon frein" });
      await hook.result.actions.updateBrakeNoteText("b1", "Frein modifie");
      await hook.result.actions.removeBrakeNote("b1");
      await hook.result.actions.setBrakeNotePosition("b2", { x: 120, y: 80 });
      await hook.result.actions.addLeverNote({ text: "Mon levier" });
      await hook.result.actions.updateLeverNoteText("l1", "Levier modifie");
      await hook.result.actions.removeLeverNote("l1");
      await hook.result.actions.setLeverNotePosition("l1", { x: 90, y: 60 });
      await hook.result.actions.toggleBrakeVote("b2");
      await hook.result.actions.setBrakeAction("b1", "Action finale");
    });

    expect(speedBoatServiceMocks.setDescription).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setObjective).toHaveBeenCalled();
    expect(speedBoatServiceMocks.createBrakeNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.updateBrakeNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.removeBrakeNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setBrakeNotePosition).toHaveBeenCalled();
    expect(speedBoatServiceMocks.createLeverNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.updateLeverNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.removeLeverNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setLeverNotePosition).toHaveBeenCalled();
    expect(speedBoatServiceMocks.toggleBrakeVote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setBrakeAction).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    speedBoatServiceMocks.subscribeSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useSpeedBoatCollaboration } = await import(
      "../../../../src/pages/workshops/speed-boat/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useSpeedBoatCollaboration({ sessionId: "s1", workshopId: "speed-boat", session: {} })
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
