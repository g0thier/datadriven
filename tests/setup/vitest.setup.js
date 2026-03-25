import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();

  vi.stubGlobal("fetch", vi.fn());

  if (typeof window !== "undefined") {
    if (typeof window.alert === "function") {
      vi.spyOn(window, "alert").mockImplementation(() => {});
    }

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  }
});

afterEach(() => {
  vi.clearAllTimers();
});
