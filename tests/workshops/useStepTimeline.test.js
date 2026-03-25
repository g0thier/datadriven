import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStepTimeline } from "../../src/workshops/useStepTimeline.js";
import { renderHook } from "../helpers/renderHook.js";

describe("useStepTimeline", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes current step and completion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T10:00:00.000Z"));

    const hook = await renderHook(() =>
      useStepTimeline(
        { steps: [{ label: "A", duration: 5 }, { label: "B", duration: 5 }] },
        new Date("2026-03-25T10:00:00.000Z")
      )
    );

    expect(hook.result.currentIndex).toBe(0);
    expect(hook.result.isFinished).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(hook.result.isFinished).toBe(true);
    await hook.unmount();
  });
});
