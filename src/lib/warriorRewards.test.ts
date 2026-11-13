import { describe, expect, it } from "vitest";
import { courseData } from "@/data/courseData";
import {
  COURSE_STRUCTURE,
  computePointRows,
  decideKitRelease,
  isStreamFinished,
  missingPointRows,
  pickShipmentGroup,
  streamFor,
  streamLessonIds,
  sumPoints,
  totalPossible,
} from "../../supabase/functions/_shared/warrior-rewards";

const done = (ids: string[], score = 80) => ids.map((lesson_id) => ({ lesson_id, score }));
const youngM1 = ["young-m1-l1", "young-m1-l2", "young-m1-l3", "young-m1-l4", "young-m1-l5"];

describe("course structure shared with the award-points function", () => {
  it("matches the lesson and module ids in courseData", () => {
    const fromCourse = Object.fromEntries(
      courseData.map((s) => [s.id, s.modules.map((m) => ({ id: m.id, lessons: m.lessons.map((l) => l.id) }))]),
    );
    expect(COURSE_STRUCTURE).toEqual(fromCourse);
  });
});

describe("Warrior Points", () => {
  it("gives 10 points per completed lesson", () => {
    const rows = computePointRows("6-9", done(["young-m1-l1", "young-m1-l2"]));
    expect(rows).toEqual([
      { reason: "lesson", lesson_id: "young-m1-l1", points: 10 },
      { reason: "lesson", lesson_id: "young-m1-l2", points: 10 },
    ]);
  });

  it("adds 5 bonus points for a 100 percent quiz score", () => {
    const rows = computePointRows("6-9", done(["young-m1-l1"], 100));
    expect(rows).toContainEqual({ reason: "perfect_quiz", lesson_id: "young-m1-l1", points: 5 });
    expect(sumPoints(rows)).toBe(15);
    expect(computePointRows("6-9", done(["young-m1-l1"], 90)).some((r) => r.reason === "perfect_quiz")).toBe(false);
  });

  it("adds 25 points per fully completed module, stored under the module id", () => {
    const rows = computePointRows("6-9", done(youngM1));
    expect(rows).toContainEqual({ reason: "module", lesson_id: "young-m1", points: 25 });
    expect(sumPoints(rows)).toBe(5 * 10 + 25);
    expect(computePointRows("6-9", done(youngM1.slice(0, 4))).some((r) => r.reason === "module")).toBe(false);
  });

  it("never produces a row without a lesson id and ignores lessons from the other stream", () => {
    const rows = computePointRows("6-9", [...done(["teen-m1-l1", "young-m1-l1"]), { lesson_id: "", score: 100 }]);
    expect(rows.every((r) => typeof r.lesson_id === "string" && r.lesson_id.length > 0)).toBe(true);
    expect(rows.map((r) => r.lesson_id)).toEqual(["young-m1-l1"]);
  });

  it("is idempotent: rows already stored are not added again and the total stays the same", () => {
    const wanted = computePointRows("6-9", done(youngM1, 100));
    const firstRun = missingPointRows(wanted, []);
    expect(firstRun).toHaveLength(wanted.length);
    const secondRun = missingPointRows(wanted, firstRun);
    expect(secondRun).toHaveLength(0);
    expect(sumPoints(firstRun) + sumPoints(secondRun)).toBe(5 * 15 + 25);
  });

  it("works out the most points a stream can give", () => {
    expect(totalPossible("6-9")).toBe(15 * 15 + 3 * 25);
    expect(totalPossible("10-13")).toBe(25 * 15 + 5 * 25);
    const all = computePointRows("10-13", done(streamLessonIds("10-13"), 100));
    expect(sumPoints(all)).toBe(totalPossible("10-13"));
  });

  it("follows the child's age band", () => {
    expect(streamFor("10-13")).toBe("10-13");
    expect(streamFor("6-9")).toBe("6-9");
    expect(streamFor(null)).toBe("6-9");
  });
});

describe("Armour Kit release", () => {
  const now = new Date("2026-11-20T10:00:00Z");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60_000).toISOString();

  it("does nothing until every lesson in the stream is done", () => {
    expect(isStreamFinished("6-9", youngM1)).toBe(false);
    expect(decideKitRelease({ kitStatus: "locked", streamFinished: false, hasDeliveryProfile: true, siblingShipments: [], now }))
      .toEqual({ release: false });
  });

  it("asks for an address when the course is finished and there is no delivery profile", () => {
    expect(isStreamFinished("6-9", streamLessonIds("6-9"))).toBe(true);
    expect(decideKitRelease({ kitStatus: "locked", streamFinished: true, hasDeliveryProfile: false, siblingShipments: [], now }))
      .toEqual({ release: true, newStatus: "address_needed", createShipment: false, reuseGroupId: null });
  });

  it("creates a shipment in a new group when the course is finished and a delivery profile exists", () => {
    expect(decideKitRelease({ kitStatus: "locked", streamFinished: true, hasDeliveryProfile: true, siblingShipments: [], now }))
      .toEqual({ release: true, newStatus: "ready_to_ship", createShipment: true, reuseGroupId: null });
  });

  it("joins a sibling's open shipment from inside the last 7 days", () => {
    const siblings = [{ shipment_group_id: "group-a", status: "draft", created_at: daysAgo(6) }];
    const d = decideKitRelease({ kitStatus: "locked", streamFinished: true, hasDeliveryProfile: true, siblingShipments: siblings, now });
    expect(d).toEqual({ release: true, newStatus: "ready_to_ship", createShipment: true, reuseGroupId: "group-a" });
    expect(pickShipmentGroup([{ shipment_group_id: "group-b", status: "submitted", created_at: daysAgo(1) }], now)).toBe("group-b");
  });

  it("starts a new group when the sibling shipment is older than 7 days or already booked", () => {
    expect(pickShipmentGroup([{ shipment_group_id: "old", status: "draft", created_at: daysAgo(8) }], now)).toBeNull();
    expect(pickShipmentGroup([{ shipment_group_id: "booked", status: "booked", created_at: daysAgo(1) }], now)).toBeNull();
  });

  it("never releases a kit twice", () => {
    for (const status of ["earned", "address_needed", "ready_to_ship", "shipped", "delivered"]) {
      expect(decideKitRelease({ kitStatus: status, streamFinished: true, hasDeliveryProfile: true, siblingShipments: [], now }))
        .toEqual({ release: false });
    }
    expect(decideKitRelease({ kitStatus: null, streamFinished: true, hasDeliveryProfile: true, siblingShipments: [], now }))
      .toEqual({ release: false });
  });
});
