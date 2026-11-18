import { describe, expect, it } from "vitest";
import { courseData } from "@/data/courseData";
import { lessonPosition, missionLabel, missionLessonRows, missionStrip, nextLessonId } from "./courseWayfinding";

const young = courseData.find((s) => s.modules[0].lessons.some((l) => l.id === "young-m1-l5"))!;
const none = () => false;

describe("mission and lesson numbering", () => {
  it("labels missions with the stream's module count", () => {
    const count = young.modules.length;
    expect(missionLabel(young, young.modules[0].id)).toBe(`Mission 1 of ${count}`);
    expect(missionLabel(young, young.modules[count - 1].id)).toBe(`Mission ${count} of ${count}`);
  });

  it("places a lesson within its mission and in the whole stream", () => {
    const second = young.modules[1];
    const pos = lessonPosition(young, second.lessons[2].id)!;
    expect(pos.missionNumber).toBe(2);
    expect(pos.lessonNumber).toBe(3);
    expect(pos.lessonCount).toBe(second.lessons.length);
    expect(pos.overallNumber).toBe(young.modules[0].lessons.length + 3);
    expect(pos.overallCount).toBe(young.modules.reduce((n, m) => n + m.lessons.length, 0));
    expect(pos.missionTitle).toBe(second.title);
  });

  it("numbers lesson rows 1 to 5 as '1. Lesson title'", () => {
    const mod = young.modules[0];
    const rows = missionLessonRows(mod, none, none, null);
    expect(rows).toHaveLength(5);
    expect(rows[0].label).toBe(`1. ${mod.lessons[0].title}`);
    expect(rows[4].label).toBe(`5. ${mod.lessons[4].title}`);
  });

  it("marks done, locked and the next lesson to do, never locking finished work", () => {
    const mod = young.modules[0];
    const done = new Set([mod.lessons[0].id, mod.lessons[3].id]);
    const isDone = (id: string) => done.has(id);
    const isLocked = (id: string) => id === mod.lessons[3].id || id === mod.lessons[4].id;
    const next = nextLessonId(young, isDone, isLocked);
    expect(next).toBe(mod.lessons[1].id);
    const states = missionLessonRows(mod, isDone, isLocked, next).map((r) => r.state);
    expect(states).toEqual(["done", "next", "todo", "done", "locked"]);
  });

  it("builds the in-lesson strip as done, current and to do", () => {
    const mod = young.modules[0];
    const isDone = (id: string) => id === mod.lessons[0].id;
    expect(missionStrip(mod, mod.lessons[1].id, isDone)).toEqual(["done", "current", "todo", "todo", "todo"]);
  });
});
