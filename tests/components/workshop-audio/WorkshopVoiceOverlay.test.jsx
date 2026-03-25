import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const joinRoom = vi.fn(async () => {});
const leaveRoom = vi.fn(async () => {});
const toggleOthersMutedLocally = vi.fn();

vi.mock("../../../src/hooks/useWorkshopVoiceRoom.js", () => ({
  default: () => ({
    isSupported: true,
    isJoining: false,
    isJoined: false,
    errorMessage: "",
    participantCount: 1,
    remoteParticipantCount: 0,
    remoteSpeakingCount: 0,
    isTalkPressed: false,
    isOthersMutedLocally: false,
    localIndicatorState: "idle",
    joinRoom,
    leaveRoom,
    startTalking: vi.fn(),
    stopTalking: vi.fn(),
    toggleOthersMutedLocally,
  }),
}));

import WorkshopVoiceOverlay from "../../../src/components/workshop-audio/WorkshopVoiceOverlay.jsx";

describe("WorkshopVoiceOverlay", () => {
  it("allows joining voice room when enabled", async () => {
    const user = userEvent.setup();
    render(<WorkshopVoiceOverlay roomId="s1" workshopActive stepAudioEnabled />);

    await user.click(screen.getByRole("button", { name: /rejoindre l'appel/i }));
    expect(joinRoom).toHaveBeenCalled();
  });

  it("does not render when workshop audio is disabled", () => {
    const { container } = render(
      <WorkshopVoiceOverlay roomId="s1" workshopActive={false} stepAudioEnabled />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
