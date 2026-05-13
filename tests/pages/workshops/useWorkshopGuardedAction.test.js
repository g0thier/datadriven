import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "../../helpers/renderHook.js";

describe("useWorkshopGuardedAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not execute when participant is not ready", async () => {
    const { useWorkshopGuardedAction } = await import("../../../src/pages/workshops/useWorkshopGuardedAction.js");

    const execute = vi.fn().mockResolvedValue("ok");
    const setSessionError = vi.fn();

    const hook = await renderHook(() =>
      useWorkshopGuardedAction({
        isEnabled: true,
        sessionId: "s1",
        participantReady: false,
        participantId: "",
        setSessionError,
      })
    );

    await act(async () => {
      const result = await hook.result.runGuardedAction({ execute, fallback: null });
      expect(result).toBeNull();
    });

    expect(execute).not.toHaveBeenCalled();
    expect(setSessionError).not.toHaveBeenCalled();
  });

  it("propagates session error message when execute throws", async () => {
    const { useWorkshopGuardedAction } = await import("../../../src/pages/workshops/useWorkshopGuardedAction.js");

    const execute = vi.fn().mockRejectedValue(new Error("boom"));
    const setSessionError = vi.fn();

    const hook = await renderHook(() =>
      useWorkshopGuardedAction({
        isEnabled: true,
        sessionId: "s1",
        participantReady: true,
        participantId: "p1",
        setSessionError,
      })
    );

    await act(async () => {
      const result = await hook.result.runGuardedAction({
        execute,
        errorMessage: "Erreur de synchro",
        fallback: { ok: false },
      });
      expect(result).toEqual({ ok: false });
    });

    expect(setSessionError).toHaveBeenCalledWith("Erreur de synchro");
  });
});
