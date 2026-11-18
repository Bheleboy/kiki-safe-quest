import { describe, expect, it } from "vitest";
import { clearAuthReturn, readAuthReturn, safeReturnPath, saveAuthReturn } from "./authReturn";
import { parsePublicSettings } from "./maintenance";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe("return after sign-up", () => {
  it("survives to the first sign-in and then clears", () => {
    const s = mem();
    saveAuthReturn("/parent#family-library-buy", s, 1000);
    expect(readAuthReturn(s, 2000)).toBe("/parent#family-library-buy");
    clearAuthReturn(s);
    expect(readAuthReturn(s, 2000)).toBeUndefined();
  });

  it("expires after a day", () => {
    const s = mem();
    saveAuthReturn("/parent#family-library-buy", s, 0);
    expect(readAuthReturn(s, 24 * 60 * 60 * 1000 + 1)).toBeUndefined();
  });

  it("never stores or returns an off-site address", () => {
    const s = mem();
    saveAuthReturn("https://evil.example", s);
    saveAuthReturn("//evil.example", s);
    expect(readAuthReturn(s)).toBeUndefined();
    expect(safeReturnPath("/\\evil.example")).toBeUndefined();
  });
});

describe("public paywall switch", () => {
  it("is true only when the server says true, false when missing", () => {
    expect(parsePublicSettings({ paywall_enabled: true })?.paywall_enabled).toBe(true);
    expect(parsePublicSettings({ maintenance_mode: false })?.paywall_enabled).toBe(false);
    expect(parsePublicSettings({ paywall_enabled: "true" })?.paywall_enabled).toBe(false);
  });
});
