import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { mount } from "@/test/mount";

// Signed-in parent by default; each test sets the switch, preview and admin state.
const state = vi.hoisted(() => {
  const user = { id: "u1" }; const session = { access_token: "t" };
  const values = { parent: { user, session, profile: { is_admin: false } }, admin: { user, session, profile: { is_admin: true } } };
  return { role: "parent" as "parent" | "admin", paywallActive: false, isPreview: false, publicPaywall: false, owned: false, values };
});
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => state.values[state.role],
  callFn: async (_n: string, body: { action?: string }) => body.action === "quote"
    ? { ok: true, status: 200, data: { payments_configured: true, has_book: false, price: { book_cents: 9700 } } }
    : { ok: false, status: 400, data: { error: "test_stop" } },
}));
vi.mock("@/hooks/useCourseAccess", () => ({
  useCourseAccess: () => ({ paywallActive: state.paywallActive, isPreview: state.isPreview, hasAccess: true }),
  notifyCourseAccessChanged: vi.fn(),
}));
vi.mock("@/hooks/usePublicSettings", () => ({
  usePublicSettings: () => ({ settings: { maintenance_mode: false, paywall_enabled: state.publicPaywall, prices: { book_cents: 9700 }, receipt_business_name: null, support_email: null }, loaded: true }),
}));
vi.mock("@/components/security/ParentGate", () => ({ useParentPin: () => ({ guard: () => {}, dialog: null }) }));
vi.mock("@/integrations/supabase/client", () => {
  const b: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq", "is", "order", "insert"]) b[m] = () => b;
  b.maybeSingle = () => Promise.resolve({ data: state.owned ? { id: "e1" } : null, error: null });
  b.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [{ store_name: "Amazon" }], error: null }).then(res);
  return { supabase: b };
});
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/ui/editorial", async (orig) => ({
  ...(await orig<typeof import("@/components/ui/editorial")>()),
  PublicPage: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { BOOK_STORES } from "@/data/bookStores";
import BookArmourOfGod from "@/pages/BookArmourOfGod";
import PricingDelivery from "@/pages/PricingDelivery";
import { FamilyLibraryCard } from "@/components/pass/FamilyLibraryCard";
import { AskGrownUpBookCard } from "@/components/pass/AskGrownUpBookCard";

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

const flush = async () => { await (React as unknown as { act: (cb: () => Promise<void>) => Promise<void> }).act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); }); };
let cleanup: (() => void) | null = null;
async function render(ui: React.ReactElement) {
  const m = mount(<MemoryRouter>{ui}</MemoryRouter>);
  cleanup = m.unmount;
  await flush();
  return m.container;
}

/** No store link, store button, store name or "Prefer a store" heading anywhere in the output. */
function expectNoStoreLinks(c: HTMLElement) {
  const hosts = BOOK_STORES.map((s) => new URL(s.url).host);
  for (const a of Array.from(c.querySelectorAll("a[href]"))) {
    const href = a.getAttribute("href") ?? "";
    for (const h of hosts) expect(href).not.toContain(h);
  }
  const text = c.textContent ?? "";
  for (const s of BOOK_STORES) expect(text).not.toContain(s.name);
  expect(text).not.toMatch(/Prefer a store|Buy it from a store|Buy Now|Get Your Copy/i);
}

beforeEach(() => { Object.assign(state, { role: "parent", paywallActive: false, isPreview: false, publicPaywall: false, owned: false }); });
afterEach(() => { cleanup?.(); cleanup = null; });

describe("book page with store links switched off", () => {
  it("shows no store links and the Launching soon card while payments are off for a non-admin", async () => {
    const c = await render(<BookArmourOfGod />);
    expectNoStoreLinks(c);
    expect(c.textContent).toContain("Launching soon");
    expect(c.textContent).toContain("Premium Edition");
    expect(c.textContent).toContain("will be available here as a printable PDF very soon. One purchase covers every child in your family.");
    expect(c.textContent).not.toContain("Get the printable PDF from Kiki Warrior");
    expect(c.textContent).not.toContain("R97");
  });

  it("shows only the direct purchase for an admin in preview", async () => {
    Object.assign(state, { role: "admin", isPreview: true });
    const c = await render(<BookArmourOfGod />);
    expectNoStoreLinks(c);
    expect(c.textContent).toContain("Get the printable PDF from Kiki Warrior");
    expect(c.textContent).toContain("R97");
    expect(c.textContent).toContain("Buy and download");
    expect(c.textContent).not.toContain("Launching soon");
  });

  it("shows only the direct purchase once payments are switched on", async () => {
    state.publicPaywall = true;
    const c = await render(<BookArmourOfGod />);
    expectNoStoreLinks(c);
    expect(c.textContent).toContain("Buy and download");
    expect(c.textContent).not.toContain("Launching soon");
  });
});

describe("family library card with store links switched off", () => {
  it("says Launching soon with no buttons or store links while payments are off for a non-admin", async () => {
    const c = await render(<FamilyLibraryCard />);
    expectNoStoreLinks(c);
    expect(c.textContent).toContain("Launching soon");
    expect(c.querySelectorAll("button").length).toBe(0);
    expect(c.textContent).not.toMatch(/R\s?\d/);
  });

  it("offers the direct purchase (behind the parent PIN) for an admin in preview", async () => {
    Object.assign(state, { role: "admin", isPreview: true });
    const c = await render(<FamilyLibraryCard />);
    expectNoStoreLinks(c);
    expect(c.textContent).not.toContain("Launching soon");
    expect(c.textContent).toContain("Unlock as a parent");
  });

  it("still offers the download when the family owns the book", async () => {
    state.owned = true;
    const c = await render(<FamilyLibraryCard />);
    expectNoStoreLinks(c);
    expect(c.textContent).toContain("Download");
    expect(c.textContent).not.toContain("Launching soon");
  });
});

describe("learner Ask a grown-up card", () => {
  it("renders no store links", async () => {
    const c = await render(<AskGrownUpBookCard onAsk={() => {}} />);
    expectNoStoreLinks(c);
    expect(c.textContent).toContain("Ask a grown-up");
  });
});

describe("pricing page book line", () => {
  it("adds (launching soon) while payments are off", async () => {
    const c = await render(<PricingDelivery />);
    expect(c.textContent).toContain("Premium Edition PDF: R97 (launching soon)");
  });

  it("drops (launching soon) once payments are on", async () => {
    state.publicPaywall = true;
    const c = await render(<PricingDelivery />);
    expect(c.textContent).toContain("Premium Edition PDF: R97");
    expect(c.textContent).not.toContain("launching soon");
  });
});
