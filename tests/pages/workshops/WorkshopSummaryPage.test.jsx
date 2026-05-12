import { describe, expect, it } from "vitest";
import { WORKSHOPS, getWorkshopRuntime } from "../../../src/pages/workshops/index.js";

describe("workshops runtime resolution", () => {
  it("exposes runtime bridge and summary for paper-brain", () => {
    const runtime = getWorkshopRuntime("paper-brain");

    expect(runtime).toBeDefined();
    expect(runtime?.bridge).toBeTypeOf("function");
    expect(runtime?.summary).toBeTypeOf("object");
  });

  it("returns undefined runtime for unknown workshop", () => {
    expect(getWorkshopRuntime("other")).toBeUndefined();
  });

  it("keeps runtime ids aligned with workshop data ids", () => {
    const workshopIds = Object.keys(WORKSHOPS).sort();
    const runtimeIds = workshopIds.filter((id) => Boolean(getWorkshopRuntime(id))).sort();

    expect(runtimeIds).toEqual(workshopIds);
  });
});
