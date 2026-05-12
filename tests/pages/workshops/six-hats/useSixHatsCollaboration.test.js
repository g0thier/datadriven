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

const sixHatsServiceMocks = {
  createSixHatsItem: vi.fn(),
  removeSixHatsItem: vi.fn(),
  setSixHatsBlueConclusion: vi.fn(),
  setSixHatsStep1Description: vi.fn(),
  subscribeSixHatsSession: vi.fn(),
  updateSixHatsItem: vi.fn(),
  upsertSixHatsParticipant: vi.fn(),
};

vi.mock("../../../../src/firebase", () => firebaseMocks);
vi.mock("../../../../src/firebase/workshops/six-hats.service", () => sixHatsServiceMocks);

describe("useSixHatsCollaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    sixHatsServiceMocks.subscribeSixHatsSession.mockImplementation((_sessionId, onData) => {
      onData({
        step1: { description: "Sujet" },
        step7: { blueConclusion: { text: "Conclusion" } },
        participants: {
          u1: { id: "u1", name: "Ada" },
          u2: { id: "u2", name: "Alan" },
        },
        itemsByHat: {
          white: {
            w1: {
              id: "w1",
              authorId: "u1",
              text: "Fait",
              createdAt: "2026-03-25T10:00:00.000Z",
            },
          },
          red: {
            r1: {
              id: "r1",
              authorId: "u2",
              text: "Ressenti",
              createdAt: "2026-03-25T10:10:00.000Z",
            },
          },
        },
      });
      return () => {};
    });

    sixHatsServiceMocks.upsertSixHatsParticipant.mockResolvedValue(undefined);
    sixHatsServiceMocks.createSixHatsItem.mockResolvedValue("w2");
    sixHatsServiceMocks.updateSixHatsItem.mockResolvedValue(undefined);
    sixHatsServiceMocks.removeSixHatsItem.mockResolvedValue(undefined);
    sixHatsServiceMocks.setSixHatsStep1Description.mockResolvedValue(undefined);
    sixHatsServiceMocks.setSixHatsBlueConclusion.mockResolvedValue(undefined);
  });

  it("stays disabled for non six-hats workshop", async () => {
    const { default: useSixHatsCollaboration } = await import(
      "../../../../src/pages/workshops/six-hats/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useSixHatsCollaboration({ sessionId: "s1", session: {}, workshopId: "other" })
    );

    expect(hook.result.isEnabled).toBe(false);
    await hook.unmount();
  });

  it("hydrates state and executes actions", async () => {
    const { default: useSixHatsCollaboration } = await import(
      "../../../../src/pages/workshops/six-hats/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useSixHatsCollaboration({
        sessionId: "s1",
        workshopId: "six-chapeaux-bono",
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
      expect(hook.result.step1Description).toBe("Sujet");
      expect(hook.result.blueConclusion).toBe("Conclusion");
      expect(hook.result.items).toHaveLength(2);
      expect(hook.result.itemsByHat.white).toHaveLength(1);
    });

    await act(async () => {
      await hook.result.actions.setStep1Description("Nouveau sujet");
      await hook.result.actions.addHatItem("white", { text: "Nouveau fait" });
      await hook.result.actions.updateHatItemText("white", "w1", "Fait modifie");
      await hook.result.actions.removeHatItem("white", "w1");
      await hook.result.actions.setBlueConclusion("Decision finale");
    });

    expect(sixHatsServiceMocks.setSixHatsStep1Description).toHaveBeenCalled();
    expect(sixHatsServiceMocks.createSixHatsItem).toHaveBeenCalled();
    expect(sixHatsServiceMocks.updateSixHatsItem).toHaveBeenCalled();
    expect(sixHatsServiceMocks.removeSixHatsItem).toHaveBeenCalled();
    expect(sixHatsServiceMocks.setSixHatsBlueConclusion).toHaveBeenCalled();

    await hook.unmount();
  });

  it("surfaces sync error from subscription", async () => {
    sixHatsServiceMocks.subscribeSixHatsSession.mockImplementation(
      (_sessionId, _onData, onError) => {
        onError(new Error("sync failed"));
        return () => {};
      }
    );

    const { default: useSixHatsCollaboration } = await import(
      "../../../../src/pages/workshops/six-hats/useCollaboration.js"
    );

    const hook = await renderHook(() =>
      useSixHatsCollaboration({ sessionId: "s1", workshopId: "six-chapeaux-bono", session: {} })
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
