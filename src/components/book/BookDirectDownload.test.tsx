import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { mount } from "@/test/mount";

const state = vi.hoisted(() => {
  const user = { id: "u1" };
  const s = {
    signedIn: true, isAdmin: false, paywallActive: false, isPreview: false, bookCents: 9700 as number | null, owned: false,
    authValue: { user, session: { access_token: "t" }, profile: { is_admin: false } } as Record<string, unknown>,
  };
  return s;
});
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => state.authValue }));
vi.mock("@/hooks/useCourseAccess", () => ({
  useCourseAccess: () => ({ paywallActive: state.paywallActive, isPreview: state.isPreview, hasAccess: true }),
}));
vi.mock("@/hooks/usePublicSettings", () => ({
  usePublicSettings: () => ({ settings: { maintenance_mode: false, prices: { book_cents: state.bookCents }, receipt_business_name: null, support_email: null }, loaded: true }),
}));
vi.mock("@/integrations/supabase/client", () => {
  const b: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq", "is"]) b[m] = () => b;
  b.maybeSingle = () => Promise.resolve({ data: state.owned ? { id: "e1" } : null, error: null });
  return { supabase: b };
});

import { BookDirectDownload, useBookDirectOption } from "./BookDirectDownload";

function Harness() {
  const opt = useBookDirectOption();
  return <BookDirectDownload option={opt} />;
}
const flush = async () => { await (React as unknown as { act: (cb: () => Promise<void>) => Promise<void> }).act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
let cleanup: (() => void) | null = null;
async function render() {
  const m = mount(<MemoryRouter><Harness /></MemoryRouter>);
  cleanup = m.unmount;
  await flush();
  return m.container;
}

beforeEach(() => {
  Object.assign(state, { paywallActive: false, isPreview: false, bookCents: 9700, owned: false });
  state.authValue = { user: { id: "u1" }, session: { access_token: "t" }, profile: { is_admin: false } };
});
afterEach(() => { cleanup?.(); cleanup = null; });

describe("book page direct PDF option", () => {
  it("renders nothing new with the switch off for a non-admin", async () => {
    const c = await render();
    expect(c.textContent).toBe("");
  });

  it("renders nothing for signed-out visitors (the switch cannot be read)", async () => {
    state.authValue = { user: null, session: null, profile: null };
    state.paywallActive = true;
    const c = await render();
    expect(c.textContent).toBe("");
  });

  it("shows the R97 option and Buy and download for an admin in preview", async () => {
    state.isPreview = true;
    state.authValue = { ...state.authValue, profile: { is_admin: true } };
    const c = await render();
    expect(c.textContent).toContain("Get the printable PDF from Kiki Warrior");
    expect(c.textContent).toContain("R97");
    expect(c.textContent).toContain("Buy and download");
  });

  it("shows when the Warrior Pass is live", async () => {
    state.paywallActive = true;
    const c = await render();
    expect(c.textContent).toContain("Buy and download");
  });

  it("shows nothing new when the book has no price", async () => {
    state.paywallActive = true;
    state.bookCents = null;
    const c = await render();
    expect(c.textContent).toBe("");
  });

  it("reads Download your copy when the family owns the book", async () => {
    state.paywallActive = true;
    state.owned = true;
    const c = await render();
    expect(c.textContent).toContain("Download your copy");
    expect(c.textContent).not.toContain("Buy and download");
    expect(c.textContent).not.toContain("R97");
  });
});
