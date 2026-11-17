import { describe, expect, it } from "vitest";
import {
  SHIPMENT_CSV_HEADER, codeSheetPages, decideRedeem, orgBatchPrice, orgTierPrice, parseOrgBatchInput, pendingShipmentsCsv,
  planBatchStock, planRedeem, stockAfterPacking, type OrgShipmentRow,
} from "../../supabase/functions/_shared/warrior-admin";
import { pickWebhookSecret, yocoKeyMode } from "../../supabase/functions/_shared/warrior-pass";
import { parseNotifyMe } from "../../supabase/functions/_shared/notify-me";
import { maintenanceView, parsePublicSettings } from "./maintenance";

// Client-approved organisation tiers: price per learner, kit included, delivery extra.
const TIERS = [{ min: 1, max: 99, cents: 12900 }, { min: 100, max: 299, cents: 10900 }, { min: 300, max: null, cents: 8900 }];

describe("organisation price per learner", () => {
  it("picks the tier for each learner count", () => {
    expect(orgTierPrice(TIERS, 1)).toBe(12900);
    expect(orgTierPrice(TIERS, 99)).toBe(12900);
    expect(orgTierPrice(TIERS, 100)).toBe(10900);
    expect(orgTierPrice(TIERS, 299)).toBe(10900);
    expect(orgTierPrice(TIERS, 300)).toBe(8900);
    expect(orgTierPrice(TIERS, 2000)).toBe(8900);
  });

  it("totals the batch and lets the admin override with a reason only", () => {
    expect(orgBatchPrice(TIERS, 120)).toEqual({ ok: true, per_learner_cents: 10900, amount_cents: 120 * 10900, overridden: false });
    expect(orgBatchPrice(TIERS, 50, 10000, "Church partner discount")).toEqual({ ok: true, per_learner_cents: 10000, amount_cents: 500000, overridden: true });
    expect(orgBatchPrice(TIERS, 50, 10000, "")).toEqual({ ok: false, error: "override_reason_required" });
    expect(parseOrgBatchInput({ name: "St Mark's", seats: 30, price_override_cents: 9000 })).toEqual({ ok: false, error: "override_reason_required" });
  });
});

describe("organisation batch stock", () => {
  it("takes the kits off stock straight away when there are enough", () => {
    expect(planBatchStock(50, 30, false)).toEqual({ ok: true, takeNow: true, waiting: false, short: 0 });
    expect(planBatchStock(30, 30, false)).toEqual({ ok: true, takeNow: true, waiting: false, short: 0 });
  });

  it("refuses when short unless the admin ticks ship after restock", () => {
    expect(planBatchStock(20, 30, false)).toEqual({ ok: false, error: "kits_short", short: 10 });
    expect(planBatchStock(20, 30, true)).toEqual({ ok: true, takeNow: false, waiting: true, short: 10 });
  });

  it("a waiting parcel takes stock only when packed, and cannot be packed while short", () => {
    expect(stockAfterPacking(20, 30, false)).toEqual({ ok: false, short: 10 });
    expect(stockAfterPacking(40, 30, false)).toEqual({ ok: true, stock: 10 });
    expect(stockAfterPacking(40, 30, true)).toEqual({ ok: true, stock: 40 });
  });

  it("includes organisation parcels in the packing export", () => {
    const org: OrgShipmentRow = {
      id: "abcdef12-0000-4000-8000-000000000000", organisation: "St Mark's", batch_name: "Grade 4", contact_email: "office@stmarks.example",
      quantity: 30, pendant_sets: 0, recipient_name: "Mrs Dlamini", phone: "0821234567", address_line1: "1 School Rd", address_line2: null,
      suburb: null, city: "Durban", province: "KwaZulu-Natal", postal_code: "4001", status: "draft",
    };
    const lines = pendingShipmentsCsv([], [org, { ...org, id: "x", status: "delivered" }]).trim().split("\r\n");
    expect(lines[0]).toBe(SHIPMENT_CSV_HEADER.join(","));
    expect(lines).toHaveLength(2);
    expect(lines[1].split(",").at(-1)).toBe("30");
  });

  it("prints 10 codes per page", () => {
    const codes = Array.from({ length: 23 }, (_, i) => `KW-AAAA-${String(i).padStart(4, "2")}`);
    expect(codeSheetPages(codes).map((p) => p.length)).toEqual([10, 10, 3]);
  });
});

describe("one code per learner", () => {
  it("several codes in one family unlock once and never create kits", () => {
    const now = new Date("2026-12-01T08:00:00Z");
    const first = decideRedeem({ hasActivePass: false, code: { redeemed_by: null }, batchExpiresAt: null, now });
    const second = decideRedeem({ hasActivePass: true, code: { redeemed_by: null }, batchExpiresAt: null, now });
    const third = decideRedeem({ hasActivePass: true, code: { redeemed_by: null }, batchExpiresAt: null, now });
    expect([first, second, third]).toEqual(["ok", "recorded", "recorded"]);
    expect(planRedeem(first)).toEqual({ grantPass: true, kitsToCreate: 0 });
    expect(planRedeem(second)).toEqual({ grantPass: false, kitsToCreate: 0 });
    expect([first, second, third].reduce((n, d) => n + planRedeem(d).kitsToCreate, 0)).toBe(0);
  });
});

describe("notify-me validation", () => {
  it("accepts a valid email with consent and tidies it", () => {
    expect(parseNotifyMe({ email: "  Parent@Example.COM ", consent: true })).toEqual({ ok: true, email: "parent@example.com" });
  });
  it("refuses bad emails and missing consent", () => {
    expect(parseNotifyMe({ email: "not-an-email", consent: true })).toEqual({ ok: false, error: "invalid_email" });
    expect(parseNotifyMe({ email: "a@b.co", consent: false })).toEqual({ ok: false, error: "consent_required" });
    expect(parseNotifyMe({ email: "a@b.co" })).toEqual({ ok: false, error: "consent_required" });
    expect(parseNotifyMe(null)).toEqual({ ok: false, error: "invalid_email" });
  });
});

describe("maintenance mode", () => {
  const base = { path: "/course", authLoading: false, isKikiAdmin: false, isDashboardAdmin: false };
  it("fails open: unknown or unreadable settings show the normal site", () => {
    expect(maintenanceView({ ...base, maintenance: null })).toBe("site");
    expect(maintenanceView({ ...base, maintenance: false })).toBe("site");
    expect(parsePublicSettings(null)).toBeNull();
    expect(parsePublicSettings("oops")).toBeNull();
  });
  it("shows the upgrade page to families, signed in or not", () => {
    expect(maintenanceView({ ...base, maintenance: true })).toBe("upgrade");
    expect(maintenanceView({ ...base, maintenance: true, path: "/" })).toBe("upgrade");
  });
  it("keeps sign-in and admin reachable and lets admins browse", () => {
    expect(maintenanceView({ ...base, maintenance: true, path: "/auth" })).toBe("site");
    expect(maintenanceView({ ...base, maintenance: true, path: "/admin" })).toBe("site");
    expect(maintenanceView({ ...base, maintenance: true, isKikiAdmin: true })).toBe("site");
    expect(maintenanceView({ ...base, maintenance: true, isDashboardAdmin: true })).toBe("site");
    expect(maintenanceView({ ...base, maintenance: true, authLoading: true })).toBe("wait");
  });
});

describe("Yoco webhook secret lookup", () => {
  const stored = [
    { key: "yoco_webhook_secret:test", value: "whsec_stored_test", mode: "test" },
    { key: "yoco_webhook_secret:live", value: "whsec_stored_live", mode: "live" },
  ];
  it("uses the environment secret first", () => {
    expect(pickWebhookSecret("whsec_env", stored, "live")).toBe("whsec_env");
  });
  it("otherwise uses the stored secret for the key's mode only", () => {
    expect(pickWebhookSecret("", stored, "live")).toBe("whsec_stored_live");
    expect(pickWebhookSecret(undefined, stored, "test")).toBe("whsec_stored_test");
    expect(pickWebhookSecret("", [stored[0]], "live")).toBe("");
    expect(pickWebhookSecret("", stored, null)).toBe("");
  });
  it("reads the mode from the key prefix", () => {
    expect(yocoKeyMode("sk_live_abc")).toBe("live");
    expect(yocoKeyMode("sk_test_abc")).toBe("test");
    expect(yocoKeyMode("pk_test_abc")).toBeNull();
    expect(yocoKeyMode("")).toBeNull();
  });
});
