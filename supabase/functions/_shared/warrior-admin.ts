// Warrior Pass admin and bulk code helpers. Pure, no Deno or Node APIs beyond Web Crypto,
// so the same file runs in edge functions and in the app's Vitest suite.
import { COURSE_STRUCTURE, streamLessonIds } from './warrior-rewards.ts'

// ---------- Bulk codes ----------

/** Unambiguous alphabet: no 0, O, 1, I or L. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_PATTERN = /^KW-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/
export const MAX_BATCH_SEATS = 2000

type RandomFill = (buf: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>

const defaultRandom: RandomFill = (buf) => crypto.getRandomValues(buf)

/** One code in the format KW-XXXX-XXXX. Uses rejection sampling so every character is equally likely. */
export function generateCode(random: RandomFill = defaultRandom): string {
  const n = CODE_ALPHABET.length
  const limit = 256 - (256 % n)
  const chars: string[] = []
  while (chars.length < 8) {
    const buf = random(new Uint8Array(16))
    for (const b of buf) {
      if (b < limit && chars.length < 8) chars.push(CODE_ALPHABET[b % n])
    }
  }
  return `KW-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

/** `count` distinct codes that are not in `taken`. */
export function generateUniqueCodes(count: number, taken: Iterable<string> = [], random: RandomFill = defaultRandom): string[] {
  const seen = new Set(taken)
  const out: string[] = []
  let guard = 0
  while (out.length < count) {
    if (++guard > count * 50 + 1000) throw new Error('code_generation_failed')
    const c = generateCode(random)
    if (seen.has(c)) continue
    seen.add(c)
    out.push(c)
  }
  return out
}

/** Accepts what a parent types (lower case, spaces, missing dashes) and returns KW-XXXX-XXXX or null. */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 40) return null
  let s = input.toUpperCase().replace(/[\s-]/g, '')
  if (s.startsWith('KW')) s = s.slice(2)
  if (s.length !== 8) return null
  const code = `KW-${s.slice(0, 4)}-${s.slice(4)}`
  return CODE_PATTERN.test(code) ? code : null
}

export type BatchInput = { name: string; organisation: string | null; seats: number; expires_at: string | null; notes: string | null }

export function parseBatchInput(b: any, now: Date = new Date()): { ok: true; value: BatchInput } | { ok: false; error: string } {
  const name = typeof b?.name === 'string' ? b.name.trim().slice(0, 120) : ''
  if (name.length < 2) return { ok: false, error: 'invalid_name' }
  const seats = b?.seats
  if (typeof seats !== 'number' || !Number.isInteger(seats) || seats < 1 || seats > MAX_BATCH_SEATS) return { ok: false, error: 'invalid_seats' }
  let expires_at: string | null = null
  if (b?.expires_at !== undefined && b?.expires_at !== null && b?.expires_at !== '') {
    const d = new Date(String(b.expires_at))
    if (Number.isNaN(d.getTime()) || d.getTime() <= now.getTime()) return { ok: false, error: 'invalid_expiry' }
    expires_at = d.toISOString()
  }
  const opt = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
  return { ok: true, value: { name, organisation: opt(b?.organisation, 120), seats, expires_at, notes: opt(b?.notes, 1000) } }
}

// ---------- Redeem decision ----------

/** 'ok' unlocks the family, 'recorded' means the family already had a pass and the code is simply recorded. */
export type RedeemDecision = 'ok' | 'recorded' | 'invalid'

/**
 * Mirrors public.redeem_org_code. One code = one learner. Used, expired, unknown and malformed
 * codes all give the same generic 'invalid'. A family that already has a pass may still use a
 * code for another child: it is recorded against the family and changes nothing else.
 */
export function decideRedeem(input: {
  hasActivePass: boolean
  code: { redeemed_by: string | null } | null
  batchExpiresAt: string | null
  now: Date
}): RedeemDecision {
  if (!input.code) return 'invalid'
  if (input.code.redeemed_by) return 'invalid'
  if (input.batchExpiresAt && new Date(input.batchExpiresAt).getTime() <= input.now.getTime()) return 'invalid'
  return input.hasActivePass ? 'recorded' : 'ok'
}

/** What a redemption changes. Codes never create Armour Kits: the organisation gets its kits up front. */
export function planRedeem(decision: RedeemDecision): { grantPass: boolean; kitsToCreate: 0 } {
  return { grantPass: decision === 'ok', kitsToCreate: 0 }
}

// ---------- Organisation batches ----------

export type OrgTier = { min: number; max: number | null; cents: number }

/** Price per learner from the tier that covers the learner count, or null when none does. */
export function orgTierPrice(tiers: OrgTier[], learners: number): number | null {
  if (!Array.isArray(tiers) || !Number.isInteger(learners) || learners < 1) return null
  const t = tiers.find((x) => learners >= x.min && (x.max === null || learners <= x.max))
  return t ? t.cents : null
}

/** Final price: the tier price, or the admin's override when given with a reason. */
export function orgBatchPrice(tiers: OrgTier[], learners: number, overrideCents?: number | null, reason?: string | null):
  { ok: true; per_learner_cents: number | null; amount_cents: number | null; overridden: boolean } | { ok: false; error: string } {
  if (overrideCents !== undefined && overrideCents !== null) {
    if (!Number.isInteger(overrideCents) || overrideCents <= 0) return { ok: false, error: 'invalid_price' }
    if (!reason || reason.trim().length < 3) return { ok: false, error: 'override_reason_required' }
    return { ok: true, per_learner_cents: overrideCents, amount_cents: overrideCents * learners, overridden: true }
  }
  const per = orgTierPrice(tiers, learners)
  return { ok: true, per_learner_cents: per, amount_cents: per === null ? null : per * learners, overridden: false }
}

/**
 * Stock decision when a batch is created. Enough stock: take it now. Not enough: refuse unless the
 * admin ticked "Kits will ship after restock", then the parcel waits and takes stock when packed.
 * A stock of null means stock is not tracked.
 */
export function planBatchStock(stock: number | null, quantity: number, allowBackorder: boolean):
  { ok: true; takeNow: boolean; waiting: boolean; short: number } | { ok: false; error: 'kits_short'; short: number } {
  if (stock === null || stock >= quantity) return { ok: true, takeNow: true, waiting: false, short: 0 }
  const short = quantity - stock
  if (!allowBackorder) return { ok: false, error: 'kits_short', short }
  return { ok: true, takeNow: false, waiting: true, short }
}

/** Stock after packing a waiting parcel. Mirrors public.take_org_shipment_stock: refuses when short. */
export function stockAfterPacking(stock: number | null, quantity: number, alreadyTaken: boolean): { ok: true; stock: number | null } | { ok: false; short: number } {
  if (alreadyTaken || stock === null) return { ok: true, stock }
  if (stock < quantity) return { ok: false, short: quantity - stock }
  return { ok: true, stock: stock - quantity }
}

export type OrgBatchInput = BatchInput & {
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  payment_reference: string | null
  price_override_cents: number | null
  price_override_reason: string | null
  allow_backorder: boolean
  kits_included: boolean
}

/** Batch form validation for organisation codes. Seats = number of learners. */
export function parseOrgBatchInput(b: any, now: Date = new Date()): { ok: true; value: OrgBatchInput } | { ok: false; error: string } {
  const base = parseBatchInput(b, now)
  if (!base.ok) return { ok: false, error: (base as { error: string }).error }
  const opt = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
  const email = opt(b?.contact_email, 254)
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_contact_email' }
  const phone = opt(b?.contact_phone, 30)
  if (phone && !/^\+?[\d\s()-]{9,20}$/.test(phone)) return { ok: false, error: 'invalid_contact_phone' }
  const override = b?.price_override_cents === undefined || b?.price_override_cents === null || b?.price_override_cents === '' ? null : b.price_override_cents
  if (override !== null && (typeof override !== 'number' || !Number.isInteger(override) || override <= 0)) return { ok: false, error: 'invalid_price' }
  const reason = opt(b?.price_override_reason, 300)
  if (override !== null && (!reason || reason.length < 3)) return { ok: false, error: 'override_reason_required' }
  return {
    ok: true,
    value: {
      ...base.value,
      contact_name: opt(b?.contact_name, 120),
      contact_email: email ? email.toLowerCase() : null,
      contact_phone: phone,
      payment_reference: opt(b?.payment_reference, 120),
      price_override_cents: override,
      price_override_reason: override !== null ? reason : null,
      allow_backorder: b?.allow_backorder === true,
      kits_included: b?.kits_included !== false,
    },
  }
}

/** Splits codes into printable pages, 10 codes per page by default. */
export function codeSheetPages(codes: string[], perPage = 10): string[][] {
  const pages: string[][] = []
  for (let i = 0; i < codes.length; i += perPage) pages.push(codes.slice(i, i + perPage))
  return pages
}

// ---------- Settings ----------

export const STREAM_KEYS = { young: '6-9', teen: '10-13' } as const
export type GateKey = keyof typeof STREAM_KEYS

export interface EditableSettings {
  gate_lessons: { young: string; teen: string }
  always_free_lessons: string[]
  prices: {
    family_pass_cents: number
    launch_family_pass_cents: number
    launch_limit: number
    kit_cents: number
    /** Alias of kit_cents, written so older readers keep working. */
    extra_kit_cents: number
    book_cents: number | null
    delivery_locker_cents: number | null
    delivery_door_cents: number | null
    org_tiers: { min: number; max: number | null; cents: number }[]
    currency: 'ZAR'
  }
  library_book_path: string | null
  receipt_business_name: string
  support_email: string | null
  /** Only present when the admin changed it, so a stale form never overwrites a sale. */
  kits_in_stock?: number
  pendant_sets_in_stock?: number
}

const posInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0
const countInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1_000_000
const optCents = (v: unknown) => v === null || v === undefined || posInt(v)

export const DEFAULT_BUSINESS_NAME = 'Boss Moves Media'
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/

export function allLessonIds(): Set<string> {
  return new Set([...streamLessonIds('6-9'), ...streamLessonIds('10-13')])
}

/** Validates org tiers: whole learner counts, sorted, no gaps or overlaps, only the last open-ended. */
export function validOrgTiers(v: unknown): v is { min: number; max: number | null; cents: number }[] {
  if (!Array.isArray(v) || v.length > 10) return false
  let next = 1
  for (let i = 0; i < v.length; i++) {
    const t = v[i]
    if (!t || typeof t !== 'object' || !posInt(t.min) || !posInt(t.cents)) return false
    if (t.min !== next) return false
    const last = i === v.length - 1
    if (t.max === null) { if (!last) return false; next = Infinity; continue }
    if (!posInt(t.max) || t.max < t.min) return false
    next = t.max + 1
  }
  return true
}

/** Validates the editable Warrior Pass settings. Returns the cleaned value or the first problem. */
export function validateSettings(input: any): { ok: true; value: EditableSettings } | { ok: false; error: string; field: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'invalid_settings', field: 'settings' }
  const g = input.gate_lessons
  if (!g || typeof g !== 'object') return { ok: false, error: 'invalid_gate', field: 'gate_lessons' }
  for (const key of Object.keys(STREAM_KEYS) as GateKey[]) {
    const id = g[key]
    if (typeof id !== 'string' || !streamLessonIds(STREAM_KEYS[key]).includes(id)) {
      return { ok: false, error: 'invalid_gate', field: `gate_lessons.${key}` }
    }
  }
  const known = allLessonIds()
  const free = input.always_free_lessons
  if (!Array.isArray(free) || free.length > known.size || !free.every((id) => typeof id === 'string' && known.has(id))) {
    return { ok: false, error: 'invalid_free_lessons', field: 'always_free_lessons' }
  }
  const p = input.prices
  if (!p || typeof p !== 'object') return { ok: false, error: 'invalid_prices', field: 'prices' }
  // Older forms send extra_kit_cents only; it is the same price.
  const kit = p.kit_cents ?? p.extra_kit_cents
  for (const [k, v] of [['family_pass_cents', p.family_pass_cents], ['launch_family_pass_cents', p.launch_family_pass_cents], ['kit_cents', kit]] as const) {
    if (!posInt(v)) return { ok: false, error: 'invalid_price', field: `prices.${k}` }
  }
  for (const k of ['book_cents', 'delivery_locker_cents', 'delivery_door_cents'] as const) {
    if (!optCents(p[k])) return { ok: false, error: 'invalid_price', field: `prices.${k}` }
  }
  if (typeof p.launch_limit !== 'number' || !Number.isInteger(p.launch_limit) || p.launch_limit < 0) {
    return { ok: false, error: 'invalid_launch_limit', field: 'prices.launch_limit' }
  }
  const tiers = p.org_tiers === undefined || p.org_tiers === null ? [] : p.org_tiers
  if (!validOrgTiers(tiers)) return { ok: false, error: 'invalid_org_tiers', field: 'prices.org_tiers' }
  let path: string | null = null
  if (input.library_book_path !== null && input.library_book_path !== undefined && input.library_book_path !== '') {
    if (typeof input.library_book_path !== 'string') return { ok: false, error: 'invalid_path', field: 'library_book_path' }
    path = input.library_book_path.trim()
    if (!path || path.length > 300 || path.startsWith('/') || path.includes('..') || !/^[A-Za-z0-9._\/ -]+$/.test(path)) {
      return { ok: false, error: 'invalid_path', field: 'library_book_path' }
    }
  }
  const nameRaw = input.receipt_business_name === undefined ? DEFAULT_BUSINESS_NAME : input.receipt_business_name
  const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
  if (name.length < 2 || name.length > 80 || /[<>{}]/.test(name)) return { ok: false, error: 'invalid_business_name', field: 'receipt_business_name' }
  let support: string | null = null
  if (input.support_email !== null && input.support_email !== undefined && input.support_email !== '') {
    const email: string = typeof input.support_email === 'string' ? input.support_email.trim().toLowerCase() : ''
    if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email', field: 'support_email' }
    support = email
  }
  const value: EditableSettings = {
    gate_lessons: { young: g.young, teen: g.teen },
    always_free_lessons: Array.from(new Set(free as string[])),
    prices: {
      family_pass_cents: p.family_pass_cents,
      launch_family_pass_cents: p.launch_family_pass_cents,
      launch_limit: p.launch_limit,
      kit_cents: kit,
      extra_kit_cents: kit,
      book_cents: posInt(p.book_cents) ? p.book_cents : null,
      delivery_locker_cents: posInt(p.delivery_locker_cents) ? p.delivery_locker_cents : null,
      delivery_door_cents: posInt(p.delivery_door_cents) ? p.delivery_door_cents : null,
      org_tiers: tiers.map((t) => ({ min: t.min, max: t.max, cents: t.cents })),
      currency: 'ZAR',
    },
    library_book_path: path,
    receipt_business_name: name,
    support_email: support,
  }
  for (const k of ['kits_in_stock', 'pendant_sets_in_stock'] as const) {
    if (input[k] === undefined) continue
    if (!countInt(input[k])) return { ok: false, error: 'invalid_stock', field: k }
    value[k] = input[k]
  }
  return { ok: true, value }
}

// ---------- Bonus pendant sets ----------

export type BonusDecision = 'ok' | 'sold_out'

/** Mirrors public.award_bonus_pendant: an award needs at least one pendant set in stock. */
export function decideBonusAward(stock: unknown): BonusDecision {
  return typeof stock === 'number' && Number.isInteger(stock) && stock > 0 ? 'ok' : 'sold_out'
}

export const BONUS_STATUSES = ['owed', 'added_to_shipment', 'handed_over'] as const

/**
 * Master switch rule. Turning ON when grandfather_before is still null sets it to now, so every
 * account that already exists keeps full access. Once set it is never cleared or moved.
 * Turning OFF only sets paywall_enabled to false.
 */
export function planPaywallChange(enabled: boolean, currentGrandfather: string | null | undefined, now: Date): {
  paywall_enabled: boolean
  grandfather_before: string | null
  set_grandfather: boolean
} {
  const existing = typeof currentGrandfather === 'string' && currentGrandfather ? currentGrandfather : null
  if (enabled && !existing) return { paywall_enabled: true, grandfather_before: now.toISOString(), set_grandfather: true }
  return { paywall_enabled: enabled, grandfather_before: existing, set_grandfather: false }
}

// ---------- CSV ----------

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  // Stop spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export const BATCH_CSV_HEADER = ['code', 'redeemed', 'redeemed_date']

/** Batch export: code, redeemed yes or no, redeemed date. Never any parent personal details. */
export function batchCsv(codes: { code: string; redeemed_at: string | null; redeemed_by?: string | null }[]): string {
  return toCsv(BATCH_CSV_HEADER, codes.map((c) => [
    c.code,
    c.redeemed_at || c.redeemed_by ? 'yes' : 'no',
    c.redeemed_at ? c.redeemed_at.slice(0, 10) : '',
  ]))
}

export const SHIPMENT_CSV_HEADER = [
  'group', 'parent', 'email', 'child', 'recipient', 'phone', 'method', 'locker_code',
  'address_line1', 'address_line2', 'suburb', 'city', 'province', 'postal_code', 'status', 'bonus_pendant_sets', 'kits',
]

export interface RewardRow {
  group_id: string
  parent_name: string | null
  parent_email: string | null
  child_name: string | null
  recipient_name: string | null
  phone: string | null
  delivery_method: string | null
  locker_code: string | null
  address_line1: string | null
  address_line2: string | null
  suburb: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  shipment_status: string | null
  kit_status: string
  /** Bonus pendant sets attached to this shipment, for the packer. */
  bonus_pendants?: number
  /** Kits in this line. Family lines are one kit; organisation parcels carry the whole batch. */
  quantity?: number
}

export interface OrgShipmentRow {
  id: string
  organisation: string | null
  batch_name: string | null
  contact_email: string | null
  quantity: number
  pendant_sets: number
  recipient_name: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  suburb: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  status: string
}

/** Organisation parcels still to send (draft or packed), as packing lines. */
export function orgPackingRows(rows: OrgShipmentRow[]): RewardRow[] {
  return rows.filter((r) => r.status === 'draft' || r.status === 'packed').map((r) => ({
    group_id: `org-${r.id}`,
    parent_name: r.organisation ?? r.batch_name,
    parent_email: r.contact_email,
    child_name: `Organisation: ${r.batch_name ?? ''}`.trim(),
    recipient_name: r.recipient_name, phone: r.phone, delivery_method: 'door', locker_code: null,
    address_line1: r.address_line1, address_line2: r.address_line2, suburb: r.suburb, city: r.city,
    province: r.province, postal_code: r.postal_code,
    shipment_status: r.status, kit_status: r.status, bonus_pendants: r.pendant_sets, quantity: r.quantity,
  }))
}

/** Statuses that still need packing and sending. */
export const PENDING_SHIPMENT_STATUSES = ['draft', 'submitted', 'booked']

export function pendingShipmentsCsv(rows: RewardRow[], orgRows: OrgShipmentRow[] = []): string {
  const pending = [
    ...rows.filter((r) => r.shipment_status && PENDING_SHIPMENT_STATUSES.includes(r.shipment_status)),
    ...orgPackingRows(orgRows),
  ]
  return toCsv(SHIPMENT_CSV_HEADER, pending.map((r) => [
    r.group_id.slice(0, 8), r.parent_name, r.parent_email, r.child_name, r.recipient_name, r.phone,
    r.delivery_method, r.locker_code, r.address_line1, r.address_line2, r.suburb, r.city, r.province,
    r.postal_code, r.shipment_status, r.bonus_pendants ?? 0, r.quantity ?? 1,
  ]))
}

// ---------- Misc ----------

/** Short order reference shown to parents and admins: KW- plus the first 8 characters of the id. */
export function orderReference(id: string): string {
  return `KW-${String(id).slice(0, 8).toUpperCase()}`
}

/** UUID range that matches a KW-XXXXXXXX reference, for searching orders by reference. */
export function referenceRange(input: string): { from: string; to: string } | null {
  const m = /^(?:KW-)?([0-9a-f]{8})$/i.exec(input.trim())
  if (!m) return null
  const p = m[1].toLowerCase()
  return { from: `${p}-0000-0000-0000-000000000000`, to: `${p}-ffff-ffff-ffff-ffffffffffff` }
}

export const SHIPPABLE_STATUSES = ['draft', 'submitted', 'booked', 'collected']

export function cleanTrackingUrl(v: unknown): string | null | false {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || v.length > 500) return false
  try {
    const u = new URL(v.trim())
    return u.protocol === 'https:' ? u.toString() : false
  } catch {
    return false
  }
}

export { COURSE_STRUCTURE }
