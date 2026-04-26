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
  createSpeedBoatBrakeNote: vi.fn(),
  createSpeedBoatLeverNote: vi.fn(),
  removeSpeedBoatBrakeNote: vi.fn(),
  removeSpeedBoatLeverNote: vi.fn(),
  setSpeedBoatBrakeNotePosition: vi.fn(),
  setSpeedBoatLeverNotePosition: vi.fn(),
  setSpeedBoatStep8BrakeAction: vi.fn(),
  setSpeedBoatStep1Description: vi.fn(),
  setSpeedBoatStep2Objective: vi.fn(),
  subscribeSpeedBoatSession: vi.fn(),
  toggleSpeedBoatBrakeVote: vi.fn(),
  updateSpeedBoatBrakeNote: vi.fn(),
  updateSpeedBoatLeverNote: vi.fn(),
  upsertSpeedBoatParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock("../../../../src/firebase/workshops/speed-boat.service", () => speedBoatServiceMocks);

describe("useSpeedBoatCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    speedBoatServiceMocks.subscribeSpeedBoatSession.mockImplementation((_sessionId, onData) => {
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
        step8ActionsByBrake: {
          b1: { text: "Action frein 1" },
        },
        participants: {
          u1: { id: "u1", name: "Ada" },
          u2: { id: "u2", name: "Alan" },
        },
      });
      return () => {};
    });

    speedBoatServiceMocks.upsertSpeedBoatParticipant.mockResolvedValue(undefined);
    speedBoatServiceMocks.createSpeedBoatBrakeNote.mockResolvedValue("b3");
    speedBoatServiceMocks.updateSpeedBoatBrakeNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.removeSpeedBoatBrakeNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.setSpeedBoatBrakeNotePosition.mockResolvedValue(undefined);
    speedBoatServiceMocks.createSpeedBoatLeverNote.mockResolvedValue("l2");
    speedBoatServiceMocks.updateSpeedBoatLeverNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.removeSpeedBoatLeverNote.mockResolvedValue(undefined);
    speedBoatServiceMocks.setSpeedBoatLeverNotePosition.mockResolvedValue(undefined);
    speedBoatServiceMocks.toggleSpeedBoatBrakeVote.mockResolvedValue({
      committed: true,
      votes: { b2: true },
    });
    speedBoatServiceMocks.setSpeedBoatStep1Description.mockResolvedValue(undefined);
    speedBoatServiceMocks.setSpeedBoatStep2Objective.mockResolvedValue(undefined);
    speedBoatServiceMocks.setSpeedBoatStep8BrakeAction.mockResolvedValue(undefined);
  });

  it("stays disabled for non speed-boat workshop", async () => {
    const { default: useSpeedBoatCollaboration } = await import(
      "../../../../src/pages/workshops/speed-boat/useSpeedBoatCollaboration.js"
    );

    const hook = await renderHook(() =>
      useSpeedBoatCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useSpeedBoatCollaboration } = await import(
      "../../../../src/pages/workshops/speed-boat/useSpeedBoatCollaboration.js"
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
      expect(hook.result.step1Description).toBe("Challenge");
      expect(hook.result.step2Objective).toBe("Objectif");
      expect(hook.result.brakeNotes).toHaveLength(2);
      expect(hook.result.leverNotes).toHaveLength(1);
      expect(hook.result.step8ActionsByBrake.b1).toBe("Action frein 1");
    });

    await act(async () => {
      await hook.result.actions.setStep1Description("Nouveau challenge");
      await hook.result.actions.setStep2Objective("Nouvel objectif");
      await hook.result.actions.addBrakeNote({ text: "Mon frein" });
      await hook.result.actions.updateBrakeNoteText("b1", "Frein modifie");
      await hook.result.actions.removeBrakeNote("b1");
      await hook.result.actions.setBrakeNotePosition("b2", { x: 120, y: 80 });
      await hook.result.actions.addLeverNote({ text: "Mon levier" });
      await hook.result.actions.updateLeverNoteText("l1", "Levier modifie");
      await hook.result.actions.removeLeverNote("l1");
      await hook.result.actions.setLeverNotePosition("l1", { x: 90, y: 60 });
      await hook.result.actions.toggleBrakeVote("b2");
      await hook.result.actions.setStep8BrakeAction("b1", "Action finale");
    });

    expect(speedBoatServiceMocks.setSpeedBoatStep1Description).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setSpeedBoatStep2Objective).toHaveBeenCalled();
    expect(speedBoatServiceMocks.createSpeedBoatBrakeNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.updateSpeedBoatBrakeNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.removeSpeedBoatBrakeNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setSpeedBoatBrakeNotePosition).toHaveBeenCalled();
    expect(speedBoatServiceMocks.createSpeedBoatLeverNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.updateSpeedBoatLeverNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.removeSpeedBoatLeverNote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setSpeedBoatLeverNotePosition).toHaveBeenCalled();
    expect(speedBoatServiceMocks.toggleSpeedBoatBrakeVote).toHaveBeenCalled();
    expect(speedBoatServiceMocks.setSpeedBoatStep8BrakeAction).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    speedBoatServiceMocks.subscribeSpeedBoatSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useSpeedBoatCollaboration } = await import(
      "../../../../src/pages/workshops/speed-boat/useSpeedBoatCollaboration.js"
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
