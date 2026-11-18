import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@/test/mount";
import { courseData } from "@/data/courseData";
import { ModuleCard } from "./ModuleCard";
import { computeLessonLocked, resolveAccess, type GateConfig } from "@/hooks/useCourseAccess";
import { missionLessonRows, nextLessonId } from "@/lib/courseWayfinding";

const young = courseData.find((s) => s.modules[0].lessons.some((l) => l.id === "young-m1-l5"))!;
const config: GateConfig = { paywallEnabled: false, gateLessons: ["young-m1-l5", "teen-m1-l5"], alwaysFree: [] };
const none = () => false;

let cleanup: (() => void) | null = null;
function track<T extends { unmount: () => void }>(m: T) { cleanup = m.unmount; return m; }
afterEach(() => { cleanup?.(); cleanup = null; });
const texts = (el: HTMLElement, s: string) => Array.from(el.querySelectorAll("span, p")).filter((n) => n.textContent?.trim() === s);

function renderMission(preview: boolean) {
  const state = resolveAccess(config, true, preview);
  const isLocked = (id: string) => computeLessonLocked(state, young, id, false);
  const mod = young.modules[1]; // a mission after the gate lesson
  const rows = missionLessonRows(mod, none, isLocked, nextLessonId(young, none, isLocked));
  const firstOpen = mod.lessons.findIndex((l) => !isLocked(l.id));
  return track(mount(
    <ModuleCard
      module={mod}
      index={1}
      progress={0}
      missionNumber={2}
      missionCount={young.modules.length}
      lessons={rows}
      {...(state.paywallActive && firstOpen === -1 ? { locked: true } : {})}
      onClick={() => {}}
      onSelectLesson={() => {}}
    />,
  ));
}

describe("ModuleCard Warrior Pass labels", () => {
  it("shows no lock and no Warrior Pass label with the paywall off and no preview", () => {
    const { container } = renderMission(false);
    expect(texts(container, "Warrior Pass")).toHaveLength(0);
    expect(container.querySelector(".lucide-lock")).toBeNull();
    expect(texts(container, `Mission 2 of ${young.modules.length}`)).toHaveLength(1);
  });

  it("shows the lock labels in admin preview (same check, so the test above can fail)", () => {
    const { container } = renderMission(true);
    expect(texts(container, "Warrior Pass").length).toBeGreaterThan(0);
    expect(container.querySelector(".lucide-lock")).not.toBeNull();
  });
});
