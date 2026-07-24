export type ModuleTheme = "internet" | "smart" | "kind" | "brave" | "helper";

export interface CaptionSegment {
  text: string;
  startMs: number;
  endMs: number;
}

export interface LessonVideoProps {
  title: string;
  audioUrl?: string;
  captionSegments: CaptionSegment[];
  moduleTheme: ModuleTheme;
  durationSeconds: number;
}

// Caption chunks aligned to the recorded VO (per transcription of The_Internet.m4a).
const scriptChunks = [
  "Hi, I'm Kiki!",
  "Today we are learning about the internet —",
  "a big playground!",
  "The internet is like a big library and playground.",
  "You can learn, play, and talk to friends.",
  "But just like in a real playground,",
  "there are rules to stay safe.",
  "Here is what you need to know.",
  "The internet connects computers all around the world.",
  "You can use it to watch videos, play games,",
  "learn new things, and talk to people.",
  "It's amazing, but we need to be careful too.",
  "Great job today, warrior!",
  "Remember — stay safe, be kind,",
  "and always tell a grown-up if something feels wrong.",
  "See you in the next lesson!",
];

// Total voice-over duration (measured with ffprobe on the cleaned m4a).
const TOTAL_MS = 51590;
// Small trailing pad so the last caption doesn't cut on the very last frame.
const END_PAD_MS = 200;
const SPEAK_MS = TOTAL_MS - END_PAD_MS;

// Distribute time proportional to word count — closer to real timing than an even split.
const wordCounts = scriptChunks.map((c) => c.split(/\s+/).filter(Boolean).length);
const totalWords = wordCounts.reduce((a, b) => a + b, 0);

let cursor = 0;
const captionSegments: CaptionSegment[] = scriptChunks.map((text, i) => {
  const dur = Math.round((wordCounts[i] / totalWords) * SPEAK_MS);
  const startMs = cursor;
  const endMs = i === scriptChunks.length - 1 ? SPEAK_MS : cursor + dur;
  cursor = endMs;
  return { text, startMs, endMs };
});

import audioAsset from "../../src/assets/the-internet-young-m1-l1.m4a.asset.json";

// Absolute URL so Remotion's renderer (headless chromium) can fetch it during bundling.
const audioUrl = `https://kikiwarrior.com${audioAsset.url}`;

export const lesson_young_m1_l1: LessonVideoProps = {
  title: "The Internet — A Big Playground!",
  moduleTheme: "internet",
  durationSeconds: 51.59,
  audioUrl,
  captionSegments,
};
