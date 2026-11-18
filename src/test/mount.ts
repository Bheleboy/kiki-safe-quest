import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactElement } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const act: (cb: () => void) => void = (React as any).act ?? require("react-dom/test-utils").act;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/** Minimal render helper used by component tests (no extra testing packages needed). */
export function mount(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => root.render(ui));
  return {
    container,
    unmount: () => { act(() => root.unmount()); container.remove(); },
  };
}
