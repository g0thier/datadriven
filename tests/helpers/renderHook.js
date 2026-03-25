import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

export async function renderHook(hook, initialProps) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let latestValue;
  let currentProps = initialProps;

  function HookHost(props) {
    latestValue = hook(props);
    return null;
  }

  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(HookHost, currentProps));
  });

  return {
    get result() {
      return latestValue;
    },
    async rerender(nextProps = currentProps) {
      currentProps = nextProps;
      await act(async () => {
        root.render(React.createElement(HookHost, currentProps));
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

export async function waitFor(expectation, { timeout = 1000, interval = 10 } = {}) {
  const end = Date.now() + timeout;

  while (Date.now() < end) {
    try {
      expectation();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  expectation();
}
