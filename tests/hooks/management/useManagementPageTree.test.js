import { describe, expect, it } from "vitest";
import { renderHook } from "../../helpers/renderHook.js";

describe("useManagementPageTree", () => {
  it("builds restricted tree and metadata resolver", async () => {
    const { default: useManagementPageTree } = await import(
      "../../../src/hooks/management/useManagementPageTree.js"
    );

    const hook = await renderHook(() => useManagementPageTree());

    expect(hook.result.pageTree.length).toBeGreaterThan(0);
    expect(hook.result.pageLeafPaths.length).toBeGreaterThan(0);
    expect(hook.result.getPathDisplayMeta("/management/comptes")).toMatchObject({
      icon: expect.any(String),
      label: expect.any(String),
    });

    await hook.unmount();
  });
});
