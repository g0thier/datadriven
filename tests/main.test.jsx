import { describe, expect, it, vi } from "vitest";

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({ render: renderMock }));

vi.mock("react-dom/client", () => ({
  createRoot: createRootMock,
}));

vi.mock("../src/App.jsx", () => ({
  default: () => null,
}));

describe("main bootstrap", () => {
  it("creates root and renders app", async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import("../src/main.jsx");

    expect(createRootMock).toHaveBeenCalledWith(document.getElementById("root"));
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
