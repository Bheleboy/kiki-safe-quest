import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router-dom";
import { act, mount } from "@/test/mount";
import { PREVIEW_PAYWALL_KEY, clearPreviewPaywall, resolvePreviewPaywall, usePreviewPaywall } from "./previewPaywall";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => { data.set(k, v); }),
    removeItem: vi.fn((k: string) => { data.delete(k); }),
  };
}

describe("admin preview flag (kw_preview_paywall)", () => {
  it("remembers ?previewPaywall=1 for an admin and keeps it on pages without the parameter", () => {
    const s = fakeStorage();
    expect(resolvePreviewPaywall(true, "?previewPaywall=1", s)).toBe(true);
    expect(s.data.get(PREVIEW_PAYWALL_KEY)).toBe("1");
    expect(resolvePreviewPaywall(true, "?child=abc", s)).toBe(true);
    expect(resolvePreviewPaywall(true, "", s)).toBe(true);
  });

  it("has no effect for a non-admin and never reads or writes the stored flag", () => {
    const s = fakeStorage({ [PREVIEW_PAYWALL_KEY]: "1" });
    expect(resolvePreviewPaywall(false, "?previewPaywall=1", s)).toBe(false);
    expect(resolvePreviewPaywall(undefined, "", s)).toBe(false);
    expect(resolvePreviewPaywall(null, "", s)).toBe(false);
    expect(s.getItem).not.toHaveBeenCalled();
    expect(s.setItem).not.toHaveBeenCalled();
    expect(s.removeItem).not.toHaveBeenCalled();
  });

  it("exit preview clears the stored flag", () => {
    const s = fakeStorage({ [PREVIEW_PAYWALL_KEY]: "1" });
    clearPreviewPaywall(s);
    expect(resolvePreviewPaywall(true, "", s)).toBe(false);
  });

  it("?previewPaywall=0 switches it off for an admin", () => {
    const s = fakeStorage({ [PREVIEW_PAYWALL_KEY]: "1" });
    expect(resolvePreviewPaywall(true, "?previewPaywall=0", s)).toBe(false);
    expect(resolvePreviewPaywall(true, "", s)).toBe(false);
  });
});

describe("usePreviewPaywall across pages", () => {
  beforeEach(() => window.sessionStorage.clear());

  type Probe = { preview: boolean; exitPreview: () => void; nav: NavigateFunction };
  function probe(isAdmin: boolean, initial: string) {
    const out = {} as Probe;
    function P() {
      Object.assign(out, usePreviewPaywall(isAdmin), { nav: useNavigate() });
      return null;
    }
    const m = mount(createElement(MemoryRouter, { initialEntries: [initial] }, createElement(P)));
    return { out, unmount: m.unmount };
  }

  it("stays on while an admin moves from /family to /course and /parent, and Exit preview turns it off", () => {
    const { out, unmount } = probe(true, "/family?previewPaywall=1");
    expect(out.preview).toBe(true);
    act(() => out.nav("/course?child=abc"));
    expect(out.preview).toBe(true);
    act(() => out.nav("/parent"));
    expect(out.preview).toBe(true);
    act(() => out.exitPreview());
    expect(out.preview).toBe(false);
    expect(window.sessionStorage.getItem(PREVIEW_PAYWALL_KEY)).toBeNull();
    unmount();
  });

  it("survives a reload (new mount) for an admin", () => {
    window.sessionStorage.setItem(PREVIEW_PAYWALL_KEY, "1");
    const { out, unmount } = probe(true, "/course");
    expect(out.preview).toBe(true);
    unmount();
  });

  it("ignores a stored flag for a non-admin", () => {
    window.sessionStorage.setItem(PREVIEW_PAYWALL_KEY, "1");
    const { out, unmount } = probe(false, "/course");
    expect(out.preview).toBe(false);
    unmount();
  });
});
