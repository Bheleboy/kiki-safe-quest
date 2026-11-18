import type { AgeStream, Module } from "@/data/courseData";

/** Where a lesson sits: mission x of y, lesson x of y in that mission, and overall. */
export interface LessonPosition {
  missionNumber: number;
  missionCount: number;
  missionTitle: string;
  lessonNumber: number;
  lessonCount: number;
  overallNumber: number;
  overallCount: number;
}

export function missionNumber(stream: AgeStream, moduleId: string): { missionNumber: number; missionCount: number } {
  const idx = stream.modules.findIndex((m) => m.id === moduleId);
  return { missionNumber: idx + 1, missionCount: stream.modules.length };
}

export function missionLabel(stream: AgeStream, moduleId: string): string {
  const { missionNumber: n, missionCount } = missionNumber(stream, moduleId);
  return `Mission ${n} of ${missionCount}`;
}

export function lessonPosition(stream: AgeStream, lessonId: string): LessonPosition | null {
  let overall = 0;
  const overallCount = stream.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  for (let mi = 0; mi < stream.modules.length; mi++) {
    const mod = stream.modules[mi];
    for (let li = 0; li < mod.lessons.length; li++) {
      overall++;
      if (mod.lessons[li].id === lessonId) {
        return {
          missionNumber: mi + 1,
          missionCount: stream.modules.length,
          missionTitle: mod.title,
          lessonNumber: li + 1,
          lessonCount: mod.lessons.length,
          overallNumber: overall,
          overallCount,
        };
      }
    }
  }
  return null;
}

export type LessonRowState = "done" | "locked" | "next" | "todo";

export interface LessonRow {
  id: string;
  title: string;
  number: number;
  label: string;
  state: LessonRowState;
}

/** First lesson in the stream that is neither completed nor locked: the one to do next. */
export function nextLessonId(
  stream: AgeStream,
  isComplete: (id: string) => boolean,
  isLocked: (id: string) => boolean,
): string | null {
  for (const m of stream.modules) {
    for (const l of m.lessons) {
      if (!isComplete(l.id) && !isLocked(l.id)) return l.id;
    }
  }
  return null;
}

/** Numbered lesson rows for a mission card. Completed wins over locked, so finished work never shows a lock. */
export function missionLessonRows(
  mod: Module,
  isComplete: (id: string) => boolean,
  isLocked: (id: string) => boolean,
  nextId: string | null,
): LessonRow[] {
  return mod.lessons.map((l, i) => {
    const state: LessonRowState = isComplete(l.id) ? "done" : isLocked(l.id) ? "locked" : l.id === nextId ? "next" : "todo";
    return { id: l.id, title: l.title, number: i + 1, label: `${i + 1}. ${l.title}`, state };
  });
}

export type StripState = "done" | "current" | "todo";

/** Segments for the thin progress strip inside a lesson: done, current or still to do. */
export function missionStrip(mod: Module, currentLessonId: string, isComplete: (id: string) => boolean): StripState[] {
  return mod.lessons.map((l) => (l.id === currentLessonId ? "current" : isComplete(l.id) ? "done" : "todo"));
}
