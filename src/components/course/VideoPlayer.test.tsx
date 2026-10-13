import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactElement } from "react";
import { VideoPlayer } from "./VideoPlayer";

// React 19 exposes act() directly; older versions only via react-dom/test-utils.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const act: (cb: () => void) => void = (React as any).act ?? require("react-dom/test-utils").act;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const MP4 = "https://project.supabase.co/storage/v1/object/public/videos/lessons-v2/clip.mp4";

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(ui: ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(ui);
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  container?.remove();
  container = null;
});

describe("VideoPlayer hosted mp4", () => {
  it("shows a friendly retry message instead of a blank box when the video cannot load", () => {
    mount(<VideoPlayer videoUrl={MP4} title="Lesson" durationMinutes={3} />);

    const video = container!.querySelector("video");
    expect(video).not.toBeNull();
    expect(container!.querySelector('[role="status"]')).toBeNull();

    act(() => {
      video!.dispatchEvent(new Event("error"));
    });

    const notice = container!.querySelector('[role="status"]');
    expect(notice).not.toBeNull();
    expect(notice!.textContent!.trim().length).toBeGreaterThan(0);
  });
});
