import { describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VideoPlayer } from "./VideoPlayer";

const MP4 = "https://project.supabase.co/storage/v1/object/public/videos/lessons-v2/clip.mp4";

describe("VideoPlayer hosted mp4", () => {
  it("shows a friendly retry message instead of a blank box when the video cannot load", () => {
    render(<VideoPlayer videoUrl={MP4} title="Lesson" durationMinutes={3} />);

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent(video!, new Event("error"));

    const notice = screen.getByRole("status");
    expect(notice.textContent!.trim().length).toBeGreaterThan(0);

    cleanup();
  });
});
