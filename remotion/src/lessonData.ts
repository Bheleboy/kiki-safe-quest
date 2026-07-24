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

// Split script into logical caption chunks
const scriptChunks = [
  "Hi, I am Kiki!",
  "Today we are learning about:",
  "The Internet — A Big Playground!",
  "The internet is like a big library and playground.",
  "You can learn, play, and talk to friends.",
  "But just like in a real playground,",
  "there are rules to stay safe!",
  "Here is what you need to know:",
  "The internet connects computers all around the world.",
  "You can watch videos, play games,",
  "learn new things, and talk to people.",
  "It's amazing, but we need to be careful too!",
  "Great job today, warrior!",
  "Stay safe, be kind,",
  "and always tell a grown-up if something feels wrong.",
  "See you in the next lesson!",
];

// Evenly divide the 51.6s duration until real timestamps arrive
const TOTAL_MS = 51600;
const perChunk = TOTAL_MS / scriptChunks.length;

export const lesson_young_m1_l1: LessonVideoProps = {
  title: "The Internet — A Big Playground!",
  moduleTheme: "internet",
  durationSeconds: 51.6,
  captionSegments: scriptChunks.map((text, i) => ({
    text,
    startMs: Math.round(i * perChunk),
    endMs: Math.round((i + 1) * perChunk),
  })),
};
