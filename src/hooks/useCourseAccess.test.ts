import { describe, expect, it } from "vitest";
import { courseData } from "@/data/courseData";
import {
  OPEN_ACCESS,
  computeLessonLocked,
  isPreviewPaywall,
  parseGateConfig,
  resolveAccess,
  type GateConfig,
} from "./useCourseAccess";

const young = courseData.find((s) => s.modules[0].lessons.some((l) => l.id === "young-m1-l5"))!;
const order = young.modules.flatMap((m) => m.lessons.map((l) => l.id));
const gateIdx = order.indexOf("young-m1-l5");
const afterGate = order[gateIdx + 1];
const beforeGate = order[gateIdx - 1];

const config: GateConfig = {
  paywallEnabled: true,
  gateLessons: ["young-m1-l5", "teen-m1-l5"],
  alwaysFree: [],
};
const locked = resolveAccess(config, false, false);

describe("isLessonLocked", () => {
  it("never locks when the paywall is off", () => {
    const state = resolveAccess({ ...config, paywallEnabled: false }, false, false);
    expect(state.paywallActive).toBe(false);
    expect(computeLessonLocked(state, young, afterGate, false)).toBe(false);
  });

  it("never locks when the family has access", () => {
    const state = resolveAccess(config, true, false);
    expect(computeLessonLocked(state, young, afterGate, false)).toBe(false);
  });

  it("never locks a completed lesson past the gate", () => {
    expect(computeLessonLocked(locked, young, afterGate, true)).toBe(false);
  });

  it("never locks an always-free lesson past the gate", () => {
    const state = resolveAccess({ ...config, alwaysFree: [afterGate] }, false, false);
    expect(computeLessonLocked(state, young, afterGate, false)).toBe(false);
  });

  it("keeps the gate lesson and earlier lessons open", () => {
    expect(computeLessonLocked(locked, young, "young-m1-l5", false)).toBe(false);
    expect(computeLessonLocked(locked, young, beforeGate, false)).toBe(false);
  });

  it("locks lessons after the gate when paywall is on and there is no access", () => {
    expect(computeLessonLocked(locked, young, afterGate, false)).toBe(true);
    expect(computeLessonLocked(locked, young, order[order.length - 1], false)).toBe(true);
  });

  it("locks nothing when the gate id is not in the stream", () => {
    const state = resolveAccess({ ...config, gateLessons: ["unknown-lesson"] }, false, false);
    expect(computeLessonLocked(state, young, afterGate, false)).toBe(false);
  });

  it("fails open on missing or malformed settings and on RPC errors", () => {
    expect(resolveAccess(null, false, false)).toEqual(OPEN_ACCESS);
    expect(parseGateConfig([{ key: "paywall_enabled", value: true }])).toBeNull();
    expect(parseGateConfig([
      { key: "paywall_enabled", value: "true" },
      { key: "gate_lessons", value: {} },
      { key: "always_free_lessons", value: [] },
    ])).toBeNull();
    expect(resolveAccess(config, undefined, false).hasAccess).toBe(true);
    expect(resolveAccess(config, null, false).hasAccess).toBe(true);
  });

  it("parses the seeded settings rows", () => {
    expect(parseGateConfig([
      { key: "paywall_enabled", value: false },
      { key: "gate_lessons", value: { young: "young-m1-l5", teen: "teen-m1-l5" } },
      { key: "always_free_lessons", value: [] },
    ])).toEqual({ paywallEnabled: false, gateLessons: ["young-m1-l5", "teen-m1-l5"], alwaysFree: [] });
  });
});

describe("admin preview (?previewPaywall=1)", () => {
  const off = { ...config, paywallEnabled: false };

  it("locks lessons after the gate for an admin while the switch is off", () => {
    const preview = isPreviewPaywall(true, "?previewPaywall=1");
    expect(preview).toBe(true);
    const state = resolveAccess(off, true, preview);
    expect(state.paywallActive).toBe(true);
    expect(state.hasAccess).toBe(false);
    expect(computeLessonLocked(state, young, afterGate, false)).toBe(true);
  });

  it("has no effect for a non-admin", () => {
    const preview = isPreviewPaywall(false, "?previewPaywall=1");
    expect(preview).toBe(false);
    expect(isPreviewPaywall(undefined, "?previewPaywall=1")).toBe(false);
    const state = resolveAccess(off, true, preview);
    expect(state).toEqual(OPEN_ACCESS);
    expect(computeLessonLocked(state, young, afterGate, false)).toBe(false);
  });
});
