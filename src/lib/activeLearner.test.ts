import { describe, it, expect, beforeEach } from "vitest";
import { canSwitchFreely, readActiveLearner, writeActiveLearner, clearActiveLearner } from "./activeLearner";

describe("learner lock", () => {
  beforeEach(() => localStorage.clear());
  it("switching to a different child needs the PIN", () => {
    expect(canSwitchFreely("a", "b", false)).toBe(false);
  });
  it("same child or no stored child is free", () => {
    expect(canSwitchFreely("a", "a", false)).toBe(true);
    expect(canSwitchFreely(null, "b", false)).toBe(true);
  });
  it("open parent unlock window makes switching free", () => {
    expect(canSwitchFreely("a", "b", true)).toBe(true);
  });
  it("removing a child clears the lock only if it pointed at them", () => {
    writeActiveLearner("u", "a");
    clearActiveLearner("b");
    expect(readActiveLearner("u")).toBe("a");
    clearActiveLearner("a");
    expect(readActiveLearner("u")).toBeNull();
  });
});
