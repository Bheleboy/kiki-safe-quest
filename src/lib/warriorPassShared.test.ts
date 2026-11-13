import { describe, expect, it } from "vitest";
import {
  computeCheckout,
  parsePrices,
  quotePrices,
  sameOrderContents,
  signWebhook,
  verifyWebhookSignature,
  type CheckoutContext,
} from "../../supabase/functions/_shared/warrior-pass";

const prices = parsePrices({
  family_pass_cents: 29900,
  launch_family_pass_cents: 24900,
  launch_limit: 100,
  extra_kit_cents: 9900,
  currency: "ZAR",
})!;

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
  ...over,
});

describe("Warrior Pass pricing", () => {
  it("charges the Founding Family price R249 while fewer than 100 passes are paid", () => {
    const r = computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [] }, ctx({ paidFamilyPassCount: 99 }));
    expect(r.ok && r.amount_cents).toBe(24900);
    expect(r.ok && r.launch).toBe(true);
  });

  it("charges the standard price R299 once 100 passes are paid", () => {
    const r = computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [] }, ctx({ paidFamilyPassCount: 100 }));
    expect(r.ok && r.amount_cents).toBe(29900);
    expect(r.ok && r.launch).toBe(false);
    expect(quotePrices(prices, 100).family_pass_cents).toBe(29900);
  });

  it("adds R99 per extra Armour Kit bought with the pass", () => {
    const r = computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [B, C] }, ctx());
    expect(r.ok && r.amount_cents).toBe(24900 + 2 * 9900);
    expect(r.ok && r.kind).toBe("family_pass");
  });

  it("charges R99 per kit for an extra kit order when the family already has a pass", () => {
    const r = computeCheckout({ kind: "extra_kit", includedKitChildId: null, extraKitChildIds: [B] }, ctx({ hasActivePass: true, childrenWithKits: [A] }));
    expect(r.ok && r.amount_cents).toBe(9900);
    expect(r.ok && r.kind).toBe("extra_kit");
  });

  it("refuses a second family pass", () => {
    const r = computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [] }, ctx({ hasActivePass: true }));
    expect(r).toEqual({ ok: false, error: "already_has_pass" });
  });

  it("requires a child for the included Armour Kit", () => {
    const r = computeCheckout({ kind: "family_pass", includedKitChildId: null, extraKitChildIds: [] }, ctx());
    expect(r).toEqual({ ok: false, error: "included_child_required" });
  });

  it("refuses extra kits without a family pass", () => {
    const r = computeCheckout({ kind: "extra_kit", includedKitChildId: null, extraKitChildIds: [B] }, ctx());
    expect(r).toEqual({ ok: false, error: "pass_required" });
  });

  it("refuses children that belong to another family", () => {
    expect(computeCheckout({ kind: "family_pass", includedKitChildId: STRANGER, extraKitChildIds: [] }, ctx()))
      .toEqual({ ok: false, error: "invalid_child" });
    expect(computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [STRANGER] }, ctx()))
      .toEqual({ ok: false, error: "invalid_child" });
  });

  it("refuses children who already have an Armour Kit", () => {
    const r = computeCheckout({ kind: "extra_kit", includedKitChildId: null, extraKitChildIds: [A] }, ctx({ hasActivePass: true, childrenWithKits: [A] }));
    expect(r).toEqual({ ok: false, error: "kit_exists" });
  });

  it("refuses the same child twice and empty extra kit orders", () => {
    expect(computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [A] }, ctx()))
      .toEqual({ ok: false, error: "duplicate_child" });
    expect(computeCheckout({ kind: "extra_kit", includedKitChildId: null, extraKitChildIds: [] }, ctx({ hasActivePass: true })))
      .toEqual({ ok: false, error: "empty_order" });
  });

  it("refuses when prices are missing or malformed", () => {
    expect(parsePrices({ family_pass_cents: "299" })).toBeNull();
    expect(computeCheckout({ kind: "family_pass", includedKitChildId: A, extraKitChildIds: [] }, ctx({ prices: null })))
      .toEqual({ ok: false, error: "prices_unavailable" });
  });

  it("matches an identical pending order regardless of kit order", () => {
    const a = { kind: "family_pass", amount_cents: 44700, included_kit_child_id: A, extra_kit_child_ids: [C, B] };
    expect(sameOrderContents(a, { ...a, extra_kit_child_ids: [B, C] })).toBe(true);
    expect(sameOrderContents(a, { ...a, extra_kit_child_ids: [B] })).toBe(false);
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
