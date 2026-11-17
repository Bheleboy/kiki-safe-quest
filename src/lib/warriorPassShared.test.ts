import { describe, expect, it } from "vitest";
import {
  computeCheckout,
  hasKitStock,
  isLowStock,
  orgPricePerLearner,
  parsePrices,
  parseStock,
  quotePrices,
  sameOrderContents,
  signWebhook,
  stockAfterSale,
  verifyWebhookSignature,
  type CheckoutContext,
} from "../../supabase/functions/_shared/warrior-pass";

// The client-approved price list (Phase 5a), exactly as stored in app_settings.prices.
const APPROVED = {
  family_pass_cents: 19900,
  launch_family_pass_cents: 14900,
  launch_limit: 100,
  kit_cents: 9900,
  extra_kit_cents: 9900,
  book_cents: 9700,
  org_tiers: [{ min: 1, max: 99, cents: 12900 }, { min: 100, max: 299, cents: 10900 }, { min: 300, max: null, cents: 8900 }],
  delivery_locker_cents: 6500,
  delivery_door_cents: 11000,
  currency: "ZAR",
};
const prices = parsePrices(APPROVED)!;

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const STRANGER = "99999999-9999-4999-8999-999999999999";

const ctx = (over: Partial<CheckoutContext> = {}): CheckoutContext => ({
  prices,
  paidFamilyPassCount: 0,
  hasActivePass: false,
  ownedChildIds: [A, B, C],
  childrenWithKits: [],
  kitsInStock: 50,
  ...over,
});

describe("Warrior Pass prices", () => {
  it("charges the Founding Family price R149 while fewer than 100 passes are paid", () => {
    const r = computeCheckout({ kind: "family_pass", extraKitChildIds: [] }, ctx({ paidFamilyPassCount: 99 }));
    expect(r.ok && r.amount_cents).toBe(14900);
    expect(r.ok && r.launch).toBe(true);
  });

  it("charges the standard price R199 once 100 passes are paid", () => {
    const r = computeCheckout({ kind: "family_pass", extraKitChildIds: [] }, ctx({ paidFamilyPassCount: 100 }));
    expect(r.ok && r.amount_cents).toBe(19900);
    expect(r.ok && r.launch).toBe(false);
    expect(quotePrices(prices, 100).family_pass_cents).toBe(19900);
  });

  it("sells the pass on its own with no Armour Kit and no delivery", () => {
    const r = computeCheckout({ kind: "family_pass", extraKitChildIds: [] }, ctx());
    expect(r.ok && r.lines).toEqual([{ type: "family_pass", child_id: null, amount_cents: 14900 }]);
    expect(r.ok && r.included_kit_child_id).toBeNull();
    expect(r.ok && r.delivery_cents).toBe(0);
  });

  it("refuses the old included-kit field", () => {
    expect(computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [] }, ctx()))
      .toEqual({ ok: false, error: "invalid_kind" });
  });

  it("charges R99 per kit plus one delivery fee for the whole checkout", () => {
    const locker = computeCheckout({ kind: "family_pass", extraKitChildIds: [A, B], deliveryMethod: "locker" }, ctx());
    expect(locker.ok && locker.amount_cents).toBe(14900 + 2 * 9900 + 6500);
    expect(locker.ok && locker.lines.filter((l) => l.type === "delivery")).toHaveLength(1);
    const door = computeCheckout({ kind: "extra_kit", extraKitChildIds: [A, B, C], deliveryMethod: "door" }, ctx({ hasActivePass: true }));
    expect(door.ok && door.amount_cents).toBe(3 * 9900 + 11000);
    expect(door.ok && door.delivery_method).toBe("door");
  });

  it("charges R99 for one kit bought later, plus delivery", () => {
    const r = computeCheckout({ kind: "extra_kit", extraKitChildIds: [B], deliveryMethod: "locker" }, ctx({ hasActivePass: true, childrenWithKits: [A] }));
    expect(r.ok && r.amount_cents).toBe(9900 + 6500);
    expect(r.ok && r.kind).toBe("extra_kit");
  });

  it("reads the old extra_kit_cents name as the kit price", () => {
    const old = parsePrices({ ...APPROVED, kit_cents: undefined, extra_kit_cents: 9900 })!;
    expect(old.kit_cents).toBe(9900);
  });

  it("needs a delivery choice and a delivery price when kits are bought", () => {
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [A] }, ctx())).toEqual({ ok: false, error: "delivery_required" });
    const noFee = parsePrices({ ...APPROVED, delivery_door_cents: null })!;
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [A], deliveryMethod: "door" }, ctx({ prices: noFee })))
      .toEqual({ ok: false, error: "delivery_unavailable" });
  });

  it("refuses kits when stock is too low but never blocks the pass", () => {
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [A, B], deliveryMethod: "door" }, ctx({ kitsInStock: 1 })))
      .toEqual({ ok: false, error: "kits_sold_out" });
    expect(computeCheckout({ kind: "extra_kit", extraKitChildIds: [A], deliveryMethod: "door" }, ctx({ hasActivePass: true, kitsInStock: 0 })))
      .toEqual({ ok: false, error: "kits_sold_out" });
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [] }, ctx({ kitsInStock: 0 })).ok).toBe(true);
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [A, B], deliveryMethod: "door" }, ctx({ kitsInStock: 2 })).ok).toBe(true);
  });

  it("sells the book for R97", () => {
    const r = computeCheckout({ kind: "book", extraKitChildIds: [] }, ctx());
    expect(r.ok && r.amount_cents).toBe(9700);
    expect(computeCheckout({ kind: "book", extraKitChildIds: [] }, ctx({ hasBook: true }))).toEqual({ ok: false, error: "already_has_book" });
    expect(computeCheckout({ kind: "book", extraKitChildIds: [] }, ctx({ prices: parsePrices({ ...APPROVED, book_cents: null }) })))
      .toEqual({ ok: false, error: "book_not_available" });
  });

  it("picks the organisation price per learner at the tier edges", () => {
    expect(orgPricePerLearner(prices.org_tiers, 1)).toBe(12900);
    expect(orgPricePerLearner(prices.org_tiers, 99)).toBe(12900);
    expect(orgPricePerLearner(prices.org_tiers, 100)).toBe(10900);
    expect(orgPricePerLearner(prices.org_tiers, 299)).toBe(10900);
    expect(orgPricePerLearner(prices.org_tiers, 300)).toBe(8900);
    expect(orgPricePerLearner(prices.org_tiers, 0)).toBeNull();
  });

  it("refuses a second family pass", () => {
    const r = computeCheckout({ kind: "family_pass", extraKitChildIds: [] }, ctx({ hasActivePass: true }));
    expect(r).toEqual({ ok: false, error: "already_has_pass" });
  });

  it("refuses kits without a family pass", () => {
    const r = computeCheckout({ kind: "extra_kit", extraKitChildIds: [B], deliveryMethod: "door" }, ctx());
    expect(r).toEqual({ ok: false, error: "pass_required" });
  });

  it("refuses children that belong to another family", () => {
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [STRANGER], deliveryMethod: "door" }, ctx()))
      .toEqual({ ok: false, error: "invalid_child" });
  });

  it("refuses children who already have an Armour Kit", () => {
    const r = computeCheckout({ kind: "extra_kit", extraKitChildIds: [A], deliveryMethod: "door" }, ctx({ hasActivePass: true, childrenWithKits: [A] }));
    expect(r).toEqual({ ok: false, error: "kit_exists" });
  });

  it("refuses the same child twice and empty kit orders", () => {
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [A, A], deliveryMethod: "door" }, ctx()))
      .toEqual({ ok: false, error: "duplicate_child" });
    expect(computeCheckout({ kind: "extra_kit", extraKitChildIds: [] }, ctx({ hasActivePass: true })))
      .toEqual({ ok: false, error: "empty_order" });
  });

  it("refuses when prices are missing or malformed", () => {
    expect(parsePrices({ family_pass_cents: "299" })).toBeNull();
    expect(computeCheckout({ kind: "family_pass", extraKitChildIds: [] }, ctx({ prices: null })))
      .toEqual({ ok: false, error: "prices_unavailable" });
  });

  it("matches an identical pending order regardless of kit order", () => {
    const a = { kind: "family_pass", amount_cents: 44700, included_kit_child_id: null, extra_kit_child_ids: [C, B] };
    expect(sameOrderContents(a, { ...a, extra_kit_child_ids: [B, C] })).toBe(true);
    expect(sameOrderContents(a, { ...a, extra_kit_child_ids: [B] })).toBe(false);
  });
});

describe("Armour Kit stock", () => {
  it("takes paid kits off stock and never goes below zero", () => {
    expect(stockAfterSale(50, 2)).toBe(48);
    expect(stockAfterSale(1, 3)).toBe(0);
    expect(stockAfterSale(null, 2)).toBeNull();
  });

  it("treats a missing stock setting as not tracked", () => {
    expect(parseStock(null)).toBeNull();
    expect(parseStock("50")).toBeNull();
    expect(hasKitStock(null, 5)).toBe(true);
    expect(hasKitStock(0, 1)).toBe(false);
  });

  it("warns at 10 or fewer", () => {
    expect(isLowStock(10)).toBe(true);
    expect(isLowStock(11)).toBe(false);
    expect(isLowStock(null)).toBe(false);
  });
});

describe("Yoco webhook signature", () => {
  const secret = "whsec_" + btoa("kiki-warrior-test-secret-0123456789");
  const id = "msg_2abc";
  const ts = "1763000000";
  const body = JSON.stringify({ id: "evt_1", type: "payment.succeeded", payload: { amount: 24900, currency: "ZAR" } });

  it("accepts a valid signature", async () => {
    const sig = await signWebhook(secret, id, ts, body);
    expect(await verifyWebhookSignature({ secret, id, timestamp: ts, signatureHeader: `v1,${sig}`, body, nowSeconds: 1763000060 })).toBe(true);
    expect(await verifyWebhookSignature({ secret, id, timestamp: ts, signatureHeader: `v1,bm9wZQ== v1,${sig}`, body, nowSeconds: 1763000000 })).toBe(true);
  });

  it("rejects a signature made with the wrong secret", async () => {
    const sig = await signWebhook("whsec_" + btoa("someone-else"), id, ts, body);
    expect(await verifyWebhookSignature({ secret, id, timestamp: ts, signatureHeader: `v1,${sig}`, body, nowSeconds: 1763000000 })).toBe(false);
  });

  it("rejects a timestamp older than 3 minutes", async () => {
    const sig = await signWebhook(secret, id, ts, body);
    expect(await verifyWebhookSignature({ secret, id, timestamp: ts, signatureHeader: `v1,${sig}`, body, nowSeconds: 1763000181 })).toBe(false);
  });

  it("rejects a tampered body", async () => {
    const sig = await signWebhook(secret, id, ts, body);
    const tampered = body.replace("24900", "100");
    expect(await verifyWebhookSignature({ secret, id, timestamp: ts, signatureHeader: `v1,${sig}`, body: tampered, nowSeconds: 1763000000 })).toBe(false);
  });

  it("matches the published Standard Webhooks example signature", async () => {
    const ok = await verifyWebhookSignature({
      secret: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
      id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
      timestamp: "1614265330",
      signatureHeader: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
      body: '{"test": 2432232314}',
      nowSeconds: 1614265330,
    });
    expect(ok).toBe(true);
  });

  it("rejects missing headers", async () => {
    expect(await verifyWebhookSignature({ secret, id: null, timestamp: ts, signatureHeader: "v1,abc", body, nowSeconds: 1763000000 })).toBe(false);
  });
});
