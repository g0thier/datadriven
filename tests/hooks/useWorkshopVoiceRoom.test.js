import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "../helpers/renderHook.js";
import { installBasicWebRTCMocks } from "../helpers/webrtcMocks.js";

const firebaseMocks = {
  ackWorkshopVoiceSignal: vi.fn(),
  auth: { currentUser: { uid: "u1", displayName: "Ada" } },
  getWorkshopVoiceParticipantCount: vi.fn(),
  registerWorkshopVoiceDisconnectCleanup: vi.fn(),
  removeWorkshopVoiceParticipant: vi.fn(),
  sendWorkshopVoiceSignal: vi.fn(),
  setWorkshopVoiceParticipant: vi.fn(),
  subscribeWorkshopVoiceParticipants: vi.fn(),
  subscribeWorkshopVoiceSignals: vi.fn(),
  touchWorkshopVoiceParticipant: vi.fn(),
};

vi.mock("../../src/firebase", () => firebaseMocks);

describe("useWorkshopVoiceRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installBasicWebRTCMocks();

    firebaseMocks.getWorkshopVoiceParticipantCount.mockResolvedValue(0);
    firebaseMocks.setWorkshopVoiceParticipant.mockResolvedValue(undefined);
    firebaseMocks.registerWorkshopVoiceDisconnectCleanup.mockResolvedValue(async () => {});
    firebaseMocks.removeWorkshopVoiceParticipant.mockResolvedValue(undefined);
    firebaseMocks.touchWorkshopVoiceParticipant.mockResolvedValue(undefined);

    firebaseMocks.subscribeWorkshopVoiceParticipants.mockImplementation((_room, cb) => {
      cb([{ id: "u-u1-123456", name: "Ada" }]);
      return () => {};
    });
    firebaseMocks.subscribeWorkshopVoiceSignals.mockImplementation(() => () => {});
  });

  it("reports unsupported browser", async () => {
    Object.defineProperty(window, "RTCPeerConnection", { value: undefined, configurable: true });

    const { default: useWorkshopVoiceRoom } = await import("../../src/hooks/useWorkshopVoiceRoom.js");
    const hook = await renderHook(() =>
      useWorkshopVoiceRoom({ roomId: "r1", workshopActive: true, stepAudioEnabled: true })
    );

    await act(async () => {
      await hook.result.joinRoom();
    });

    expect(hook.result.errorMessage).toContain("WebRTC");
    await hook.unmount();
  });

  it("joins and leaves room with lifecycle cleanup", async () => {
    const { default: useWorkshopVoiceRoom } = await import("../../src/hooks/useWorkshopVoiceRoom.js");

    const hook = await renderHook(() =>
      useWorkshopVoiceRoom({ roomId: "r1", workshopActive: true, stepAudioEnabled: true })
    );

    await act(async () => {
      await hook.result.joinRoom();
    });

    await waitFor(() => {
      expect(hook.result.isJoined).toBe(true);
      expect(hook.result.localParticipantId).toContain("u-u1-");
    });

    await act(async () => {
      hook.result.startTalking();
    });
    expect(hook.result.isTalkPressed).toBe(true);

    await act(async () => {
      hook.result.stopTalking();
      hook.result.toggleOthersMutedLocally();
    });
    expect(hook.result.isOthersMutedLocally).toBe(true);

    await act(async () => {
      await hook.result.leaveRoom();
    });

    expect(firebaseMocks.removeWorkshopVoiceParticipant).toHaveBeenCalled();
    expect(hook.result.isJoined).toBe(false);

    await hook.unmount();
  });

  it("handles join failures", async () => {
    const mediaDevices = navigator.mediaDevices;
    mediaDevices.getUserMedia.mockRejectedValueOnce(new Error("mic denied"));

    const { default: useWorkshopVoiceRoom } = await import("../../src/hooks/useWorkshopVoiceRoom.js");
    const hook = await renderHook(() =>
      useWorkshopVoiceRoom({ roomId: "r1", workshopActive: true, stepAudioEnabled: true })
    );

    await act(async () => {
      await hook.result.joinRoom();
    });

    expect(hook.result.status).toBe("idle");
    expect(hook.result.errorMessage).toContain("mic denied");

    await hook.unmount();
  });
});
