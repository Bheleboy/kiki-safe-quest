import { describe, expect, it } from "vitest";
import {
  BATCH_CSV_HEADER, CODE_ALPHABET, CODE_PATTERN, SHIPMENT_CSV_HEADER, batchCsv, decideRedeem, generateCode,
  generateUniqueCodes, normalizeCode, parseBatchInput, pendingShipmentsCsv, planPaywallChange, referenceRange,
  validateSettings, type RewardRow,
} from "../../supabase/functions/_shared/warrior-admin";

describe("bulk code generator", () => {
  it("uses the KW-XXXX-XXXX format", () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^KW-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("never uses 0, O, 1, I or L", () => {
    for (const ch of "0O1IL") expect(CODE_ALPHABET).not.toContain(ch);
    const body = Array.from({ length: 500 }, () => generateCode().slice(3).replace("-", "")).join("");
    expect(body).not.toMatch(/[0O1IL]/);
    for (const ch of body) expect(CODE_ALPHABET).toContain(ch);
  });

  it("generates 2000 unique codes and skips codes already taken", () => {
    const codes = generateUniqueCodes(2000);
    expect(new Set(codes).size).toBe(2000);
    expect(codes.every((c) => CODE_PATTERN.test(c))).toBe(true);
    const taken = codes.slice(0, 10);
    const more = generateUniqueCodes(50, taken);
    expect(more.some((c) => taken.includes(c))).toBe(false);
  });

  it("retries when the random source would produce a duplicate", () => {
    let call = 0;
    // First two codes come out identical, the third is different.
    const seq = [0, 0, 1];
    const fake = (buf: Uint8Array<ArrayBuffer>) => { buf.fill(seq[Math.min(Math.floor(call++ / 1), 2)]); return buf; };
    const codes = generateUniqueCodes(2, [], fake);
    expect(new Set(codes).size).toBe(2);
  });

  it("normalises what a parent types", () => {
    expect(normalizeCode("kw-abcd-efgh")).toBe("KW-ABCD-EFGH");
    expect(normalizeCode(" abcd efgh ")).toBe("KW-ABCD-EFGH");
    expect(normalizeCode("KWABCDEFGH")).toBe("KW-ABCD-EFGH");
    expect(normalizeCode("KW-ABC0-EFGH")).toBeNull();
    expect(normalizeCode("KW-ABCD-EFG")).toBeNull();
    expect(normalizeCode(42)).toBeNull();
  });

  it("validates batch seats between 1 and 2000", () => {
    expect(parseBatchInput({ name: "St Marks", seats: 0 })).toEqual({ ok: false, error: "invalid_seats" });
    expect(parseBatchInput({ name: "St Marks", seats: 2001 })).toEqual({ ok: false, error: "invalid_seats" });
    expect(parseBatchInput({ name: "St Marks", seats: 1.5 })).toEqual({ ok: false, error: "invalid_seats" });
    expect(parseBatchInput({ name: "St Marks", seats: 2000 }).ok).toBe(true);
    expect(parseBatchInput({ name: "St Marks", seats: 10, expires_at: "2020-01-01" })).toEqual({ ok: false, error: "invalid_expiry" });
  });
});

const goodSettings = () => ({
  gate_lessons: { young: "young-m1-l5", teen: "teen-m1-l5" },
  always_free_lessons: ["young-m2-l1"],
  prices: { family_pass_cents: 29900, launch_family_pass_cents: 24900, launch_limit: 100, extra_kit_cents: 9900, book_cents: null, currency: "ZAR" },
  library_book_path: null,
});

describe("settings validation", () => {
  it("accepts valid settings", () => {
    const r = validateSettings(goodSettings());
    expect(r.ok).toBe(true);
  });

  it("requires each gate lesson to be a real lesson in its own stream", () => {
    expect(validateSettings({ ...goodSettings(), gate_lessons: { young: "teen-m1-l5", teen: "teen-m1-l5" } }))
      .toMatchObject({ ok: false, field: "gate_lessons.young" });
    expect(validateSettings({ ...goodSettings(), gate_lessons: { young: "young-m1-l5", teen: "teen-m9-l1" } }))
      .toMatchObject({ ok: false, field: "gate_lessons.teen" });
  });

  it("requires always-free lessons to be real lesson ids", () => {
    expect(validateSettings({ ...goodSettings(), always_free_lessons: ["young-m1-l9"] }))
      .toMatchObject({ ok: false, field: "always_free_lessons" });
  });

  it("requires prices to be positive whole cents, book price may be null", () => {
    const s = goodSettings();
    expect(validateSettings({ ...s, prices: { ...s.prices, family_pass_cents: 0 } })).toMatchObject({ ok: false, field: "prices.family_pass_cents" });
    expect(validateSettings({ ...s, prices: { ...s.prices, extra_kit_cents: 99.5 } })).toMatchObject({ ok: false, field: "prices.extra_kit_cents" });
    expect(validateSettings({ ...s, prices: { ...s.prices, book_cents: -1 } })).toMatchObject({ ok: false, field: "prices.book_cents" });
    const withBook = validateSettings({ ...s, prices: { ...s.prices, book_cents: 14900 } });
    expect(withBook.ok && withBook.value.prices.book_cents).toBe(14900);
  });

  it("requires a non-negative launch limit", () => {
    const s = goodSettings();
    expect(validateSettings({ ...s, prices: { ...s.prices, launch_limit: -1 } })).toMatchObject({ ok: false, field: "prices.launch_limit" });
    expect(validateSettings({ ...s, prices: { ...s.prices, launch_limit: 0 } }).ok).toBe(true);
  });

  it("accepts a book file path as text or null and rejects unsafe paths", () => {
    expect(validateSettings({ ...goodSettings(), library_book_path: "books/kiki-armour.pdf" }).ok).toBe(true);
    expect(validateSettings({ ...goodSettings(), library_book_path: "" })).toMatchObject({ ok: true });
    expect(validateSettings({ ...goodSettings(), library_book_path: "../secret.pdf" })).toMatchObject({ ok: false, field: "library_book_path" });
    expect(validateSettings({ ...goodSettings(), library_book_path: 5 })).toMatchObject({ ok: false, field: "library_book_path" });
  });
});

describe("set_paywall grandfather rule", () => {
  const now = new Date("2026-12-01T08:00:00.000Z");

  it("turning ON with no cutoff sets grandfather_before to now", () => {
    expect(planPaywallChange(true, null, now)).toEqual({ paywall_enabled: true, grandfather_before: now.toISOString(), set_grandfather: true });
  });

  it("turning ON again never moves an existing cutoff", () => {
    const set = "2026-11-20T10:00:00.000Z";
    expect(planPaywallChange(true, set, now)).toEqual({ paywall_enabled: true, grandfather_before: set, set_grandfather: false });
  });

  it("turning OFF only switches the paywall off and keeps the cutoff", () => {
    const set = "2026-11-20T10:00:00.000Z";
    expect(planPaywallChange(false, set, now)).toEqual({ paywall_enabled: false, grandfather_before: set, set_grandfather: false });
    expect(planPaywallChange(false, null, now)).toEqual({ paywall_enabled: false, grandfather_before: null, set_grandfather: false });
  });
});

describe("redeem decision", () => {
  const now = new Date("2026-12-01T08:00:00Z");
  it("valid unused code redeems", () => {
    expect(decideRedeem({ hasActivePass: false, code: { redeemed_by: null }, batchExpiresAt: null, now })).toBe("ok");
    expect(decideRedeem({ hasActivePass: false, code: { redeemed_by: null }, batchExpiresAt: "2027-01-01T00:00:00Z", now })).toBe("ok");
  });
  it("used, unknown and expired codes all give the same generic result", () => {
    expect(decideRedeem({ hasActivePass: false, code: { redeemed_by: "someone" }, batchExpiresAt: null, now })).toBe("invalid");
    expect(decideRedeem({ hasActivePass: false, code: null, batchExpiresAt: null, now })).toBe("invalid");
    expect(decideRedeem({ hasActivePass: false, code: { redeemed_by: null }, batchExpiresAt: "2026-11-30T00:00:00Z", now })).toBe("invalid");
  });
  it("a family that already has a pass is refused before the code is checked", () => {
    expect(decideRedeem({ hasActivePass: true, code: { redeemed_by: null }, batchExpiresAt: null, now })).toBe("already_has_pass");
    expect(decideRedeem({ hasActivePass: true, code: null, batchExpiresAt: null, now })).toBe("already_has_pass");
  });
});

describe("CSV exports", () => {
  it("batch export has code, redeemed and date only", () => {
    const csv = batchCsv([
      { code: "KW-ABCD-EFGH", redeemed_at: null, redeemed_by: null },
      { code: "KW-JKMN-PQRS", redeemed_at: "2026-12-02T09:30:00Z", redeemed_by: "11111111-1111-4111-8111-111111111111" },
    ]);
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe(BATCH_CSV_HEADER.join(","));
    expect(lines[1]).toBe("KW-ABCD-EFGH,no,");
    expect(lines[2]).toBe("KW-JKMN-PQRS,yes,2026-12-02");
    expect(csv).not.toContain("11111111");
  });

  it("pending shipments export only lists parcels still to send, quoting commas and blocking formulas", () => {
    const base: RewardRow = {
      group_id: "abcdef12-0000-4000-8000-000000000000", parent_name: "Nandi", parent_email: "n@example.com", child_name: "Thandi",
      recipient_name: "Nandi, Mom", phone: "0821234567", delivery_method: "door", locker_code: null, address_line1: "=1 Main Rd",
      address_line2: null, suburb: "Parkhurst", city: "Johannesburg", province: "Gauteng", postal_code: "2193",
      shipment_status: "draft", kit_status: "ready_to_ship",
    };
    const csv = pendingShipmentsCsv([base, { ...base, child_name: "Sipho", shipment_status: "in_transit" }, { ...base, shipment_status: null }]);
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe(SHIPMENT_CSV_HEADER.join(","));
    expect(lines).toHaveLength(2);
    expect(lines[1].split(",")[0]).toBe("abcdef12");
    expect(lines[1]).toContain('"Nandi, Mom"');
    expect(lines[1]).toContain("'=1 Main Rd");
  });
});

describe("order reference search", () => {
  it("turns KW-XXXXXXXX into an id range", () => {
    expect(referenceRange("KW-1A2B3C4D")).toEqual({ from: "1a2b3c4d-0000-0000-0000-000000000000", to: "1a2b3c4d-ffff-ffff-ffff-ffffffffffff" });
    expect(referenceRange("hello")).toBeNull();
  });
});
