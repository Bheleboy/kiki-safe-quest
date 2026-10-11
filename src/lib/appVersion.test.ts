import { describe, it, expect } from "vitest";
import { extractEntry, shouldReload } from "./appVersion";

describe("app version check", () => {
  it("reads the entry script from html", () => {
    expect(extractEntry('<script type="module" crossorigin src="/assets/index-AbC123.js"></script>')).toBe("/assets/index-AbC123.js");
  });
  it("reloads when a different version is live", () => {
    expect(shouldReload("/assets/index-a.js", "/assets/index-b.js", null)).toBe(true);
  });
  it("does not reload for the same version", () => {
    expect(shouldReload("/assets/index-a.js", "/assets/index-a.js", null)).toBe(false);
  });
  it("never reloads twice for the same version", () => {
    expect(shouldReload("/assets/index-a.js", "/assets/index-b.js", "/assets/index-b.js")).toBe(false);
  });
});
