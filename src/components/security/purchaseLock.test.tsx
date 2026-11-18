import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { mount, act } from "@/test/mount";

// Fake parent PIN prompt: records every guard() call so tests can "enter" the PIN.
const pinPrompt = vi.hoisted(() => ({
  calls: [] as { opts: unknown; action: (pin?: string) => void }[],
  enter(pin: string) { const c = pinPrompt.calls[pinPrompt.calls.length - 1]; c.action(pin); },
}));
vi.mock("@/components/security/ParentGate", () => ({
  useParentPin: () => ({
    guard: (action: (pin?: string) => void, opts: unknown) => { pinPrompt.calls.push({ opts, action }); },
    dialog: null,
  }),
}));

// Stable objects per role, like the real auth context (new objects each render would loop effects).
const auth = vi.hoisted(() => {
  const user = { id: "u1" }; const session = { access_token: "t" };
  const values = { true: { user, session, profile: { is_admin: true } }, false: { user, session, profile: { is_admin: false } } };
  const a = { isAdmin: false, value: () => values[String(a.isAdmin) as "true" | "false"] };
  return a;
});
const callFn = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => auth.value(),
  callFn,
}));
vi.mock("@/hooks/useCourseAccess", () => ({
  useCourseAccess: () => ({ paywallActive: false, isPreview: true, hasAccess: true }),
  notifyCourseAccessChanged: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => {
  const builder: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq", "is"]) builder[m] = () => builder;
  builder.maybeSingle = () => Promise.resolve({ data: null, error: null });
  builder.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res);
  return { supabase: builder };
});

import { WarriorPassGate } from "@/components/course/WarriorPassGate";
import { WarriorPassStatusCard } from "@/components/pass/WarriorPassStatusCard";
import { FamilyLibraryCard } from "@/components/pass/FamilyLibraryCard";
import { PURCHASE_IDLE_MS } from "./usePurchaseLock";

const QUOTE = {
  payments_configured: true, has_pass: false, has_book: false,
  price: { family_pass_cents: 14900, launch: true, kit_cents: 9900, extra_kit_cents: 9900, delivery_locker_cents: 6500, delivery_door_cents: 11000, book_cents: 9700, currency: "ZAR" },
  kits_sold_out: false, kit_stock: 50,
  children: [{ id: "c1", first_name: "Ayo", has_kit: false }],
  delivery: null,
};

const flush = async () => { await (React as unknown as { act: (cb: () => Promise<void>) => Promise<void> }).act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const click = (el: Element | null | undefined) => act(() => { (el as HTMLElement).click(); });
const button = (root: HTMLElement, text: string) => Array.from(root.querySelectorAll("button")).find((b) => b.textContent?.includes(text));
const PRICE = /R\s?\d/;

let cleanup: (() => void) | null = null;
beforeEach(() => {
  pinPrompt.calls = [];
  callFn.mockReset();
  callFn.mockImplementation(async (_name: string, body: { action?: string }) => {
    if (body.action === "quote") return { ok: true, status: 200, data: QUOTE };
    return { ok: false, status: 400, data: { error: "test_stop" } };
  });
});
afterEach(() => { cleanup?.(); cleanup = null; vi.useRealTimers(); });

function renderGate() {
  const m = mount(<MemoryRouter><WarriorPassGate learnerName="Ayo" earnedPieces={[]} returnPath="/course" onBack={() => {}} /></MemoryRouter>);
  cleanup = m.unmount;
  return m.container;
}

describe.each([["parent", false], ["admin", true]])("Warrior Pass gate for a %s", (_label, isAdmin) => {
  beforeEach(() => { auth.isAdmin = isAdmin; });

  it("asks for the PIN first and shows no prices or kit choices before it", async () => {
    const c = renderGate();
    click(button(c, "Ask a parent"));
    await flush();
    expect(pinPrompt.calls).toHaveLength(1);
    expect(pinPrompt.calls[0].opts).toMatchObject({ requirePin: true });
    expect(c.textContent).not.toMatch(PRICE);
    expect(c.textContent).not.toContain("Armour Kit for");
    expect(callFn).not.toHaveBeenCalledWith("create-checkout", expect.anything(), expect.anything());
    act(() => pinPrompt.enter("1234"));
    await flush();
    expect(c.textContent).toContain("Armour Kit for Ayo");
    expect(c.textContent).toMatch(PRICE);
  });
});

describe("one PIN entry", () => {
  it("is reused for checkout without asking again", async () => {
    auth.isAdmin = false;
    const c = renderGate();
    click(button(c, "Ask a parent"));
    act(() => pinPrompt.enter("4321"));
    await flush();
    click(Array.from(c.querySelectorAll('button[role="checkbox"]')).pop());
    click(button(c, "Pay securely"));
    await flush();
    expect(callFn).toHaveBeenCalledWith("create-checkout", expect.objectContaining({ action: "checkout", pin: "4321" }), "t");
    expect(pinPrompt.calls).toHaveLength(1);
  });

  it("asks again only when the server says the PIN failed", async () => {
    auth.isAdmin = false;
    callFn.mockImplementation(async (_n: string, body: { action?: string }) =>
      body.action === "quote" ? { ok: true, status: 200, data: QUOTE } : { ok: false, status: 403, data: { error: "pin_required" } });
    const c = renderGate();
    click(button(c, "Ask a parent"));
    act(() => pinPrompt.enter("1111"));
    await flush();
    click(Array.from(c.querySelectorAll('button[role="checkbox"]')).pop());
    click(button(c, "Pay securely"));
    await flush();
    expect(pinPrompt.calls).toHaveLength(2);
  });
});

describe("re-locking", () => {
  it("closes the parent panel after 2 minutes idle", async () => {
    vi.useFakeTimers();
    const c = renderGate();
    click(button(c, "Ask a parent"));
    act(() => pinPrompt.enter("1234"));
    await flush();
    expect(button(c, "Close")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(PURCHASE_IDLE_MS - 1000); });
    expect(button(c, "Close")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1500); });
    expect(button(c, "Close")).toBeFalsy();
    expect(button(c, "Ask a parent")).toBeTruthy();
    expect(c.textContent).not.toMatch(PRICE);
  });

  it("closes the parent panel when the tab is hidden", async () => {
    const c = renderGate();
    click(button(c, "Ask a parent"));
    act(() => pinPrompt.enter("1234"));
    await flush();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    expect(button(c, "Ask a parent")).toBeTruthy();
  });
});

describe("parent dashboard cards before the PIN", () => {
  it.each([false, true])("Warrior Pass card shows only the title and unlock button (admin=%s)", async (isAdmin) => {
    auth.isAdmin = isAdmin;
    const m = mount(<MemoryRouter><WarriorPassStatusCard children={[{ id: "c1", first_name: "Ayo" }]} /></MemoryRouter>);
    cleanup = m.unmount;
    await flush(); await flush();
    const c = m.container;
    expect(c.textContent).toContain("Warrior Pass");
    expect(button(c, "Unlock as a parent")).toBeTruthy();
    expect(c.textContent).not.toMatch(PRICE);
    expect(c.textContent).not.toContain("school, church or club");
    expect(c.textContent).not.toContain("Ayo");
    click(button(c, "Unlock as a parent"));
    expect(pinPrompt.calls[0].opts).toMatchObject({ requirePin: true });
    act(() => pinPrompt.enter("1234"));
    await flush();
    expect(c.textContent).toContain("school, church or club");
  });

  it.each([false, true])("family library hides the price and Buy button (admin=%s)", async (isAdmin) => {
    auth.isAdmin = isAdmin;
    const m = mount(<MemoryRouter><FamilyLibraryCard /></MemoryRouter>);
    cleanup = m.unmount;
    await flush(); await flush();
    const c = m.container;
    expect(button(c, "Buy for")).toBeFalsy();
    expect(c.textContent).not.toContain("R97");
    click(button(c, "Unlock as a parent"));
    act(() => pinPrompt.enter("1234"));
    await flush();
    expect(button(c, "Buy for")).toBeTruthy();
  });
});
