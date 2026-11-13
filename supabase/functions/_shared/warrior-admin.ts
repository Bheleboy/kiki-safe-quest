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

export type RedeemDecision = 'ok' | 'invalid' | 'already_has_pass'

/**
 * Mirrors public.redeem_bulk_code. Used, expired, unknown and malformed codes all give the same
 * generic 'invalid' so a parent cannot tell them apart. An active pass is checked first, so
 * it never reveals anything about the code.
 */
export function decideRedeem(input: {
  hasActivePass: boolean
  code: { redeemed_by: string | null } | null
  batchExpiresAt: string | null
  now: Date
}): RedeemDecision {
  if (input.hasActivePass) return 'already_has_pass'
  if (!input.code) return 'invalid'
  if (input.code.redeemed_by) return 'invalid'
  if (input.batchExpiresAt && new Date(input.batchExpiresAt).getTime() <= input.now.getTime()) return 'invalid'
  return 'ok'
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
    extra_kit_cents: number
    book_cents: number | null
    currency: 'ZAR'
  }
  library_book_path: string | null
}

const posInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0

export function allLessonIds(): Set<string> {
  return new Set([...streamLessonIds('6-9'), ...streamLessonIds('10-13')])
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
  for (const k of ['family_pass_cents', 'launch_family_pass_cents', 'extra_kit_cents'] as const) {
    if (!posInt(p[k])) return { ok: false, error: 'invalid_price', field: `prices.${k}` }
  }
  if (p.book_cents !== null && p.book_cents !== undefined && !posInt(p.book_cents)) {
    return { ok: false, error: 'invalid_price', field: 'prices.book_cents' }
  }
  if (typeof p.launch_limit !== 'number' || !Number.isInteger(p.launch_limit) || p.launch_limit < 0) {
    return { ok: false, error: 'invalid_launch_limit', field: 'prices.launch_limit' }
  }
  let path: string | null = null
  if (input.library_book_path !== null && input.library_book_path !== undefined && input.library_book_path !== '') {
    if (typeof input.library_book_path !== 'string') return { ok: false, error: 'invalid_path', field: 'library_book_path' }
    path = input.library_book_path.trim()
    if (!path || path.length > 300 || path.startsWith('/') || path.includes('..') || !/^[A-Za-z0-9._\/ -]+$/.test(path)) {
      return { ok: false, error: 'invalid_path', field: 'library_book_path' }
    }
  }
  return {
    ok: true,
    value: {
      gate_lessons: { young: g.young, teen: g.teen },
      always_free_lessons: Array.from(new Set(free as string[])),
      prices: {
        family_pass_cents: p.family_pass_cents,
        launch_family_pass_cents: p.launch_family_pass_cents,
        launch_limit: p.launch_limit,
        extra_kit_cents: p.extra_kit_cents,
        book_cents: posInt(p.book_cents) ? p.book_cents : null,
        currency: 'ZAR',
      },
      library_book_path: path,
    },
  }
}

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
  'address_line1', 'address_line2', 'suburb', 'city', 'province', 'postal_code', 'status',
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
}

/** Statuses that still need packing and sending. */
export const PENDING_SHIPMENT_STATUSES = ['draft', 'submitted', 'booked']

export function pendingShipmentsCsv(rows: RewardRow[]): string {
  const pending = rows.filter((r) => r.shipment_status && PENDING_SHIPMENT_STATUSES.includes(r.shipment_status))
  return toCsv(SHIPMENT_CSV_HEADER, pending.map((r) => [
    r.group_id.slice(0, 8), r.parent_name, r.parent_email, r.child_name, r.recipient_name, r.phone,
    r.delivery_method, r.locker_code, r.address_line1, r.address_line2, r.suburb, r.city, r.province,
    r.postal_code, r.shipment_status,
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
