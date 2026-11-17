// Warrior Pass pure helpers. No Deno or Node APIs beyond Web Crypto, so the
// same file runs in edge functions and in the app's Vitest suite.

export interface OrgTier {
  min: number
  /** Null means no upper limit. */
  max: number | null
  /** Price per learner, Armour Kit included, delivery extra. */
  cents: number
}

export interface Prices {
  family_pass_cents: number
  launch_family_pass_cents: number
  launch_limit: number
  /** One Armour Kit for one child, delivery not included. */
  kit_cents: number
  /** Old name for kit_cents. Always equal to kit_cents; kept so older readers keep working. */
  extra_kit_cents: number
  /** Family library book price. Null until app_settings.prices.book_cents is set. */
  book_cents: number | null
  /** Flat delivery fee per parcel. Null means kit delivery is not available yet. */
  delivery_locker_cents: number | null
  delivery_door_cents: number | null
  org_tiers: OrgTier[]
  currency: string
}

const isCents = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0

/** Parses org tiers. Returns an empty list when the value is missing or malformed. */
export function parseOrgTiers(value: unknown): OrgTier[] {
  if (!Array.isArray(value) || value.length > 20) return []
  const out: OrgTier[] = []
  for (const t of value) {
    if (!t || typeof t !== 'object') return []
    const { min, max, cents } = t as Record<string, unknown>
    if (!isCents(min) || !isCents(cents)) return []
    if (max !== null && (!isCents(max) || max < min)) return []
    out.push({ min, max: max as number | null, cents })
  }
  return out.sort((a, b) => a.min - b.min)
}

/** Parses app_settings.prices. Returns null when anything required is missing or malformed. */
export function parsePrices(value: unknown): Prices | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  // kit_cents is the current name; extra_kit_cents is still accepted as an alias.
  const kit = isCents(v.kit_cents) ? v.kit_cents : isCents(v.extra_kit_cents) ? v.extra_kit_cents : null
  if (!isCents(v.family_pass_cents) || !isCents(v.launch_family_pass_cents) || kit === null) return null
  if (!isCount(v.launch_limit)) return null
  const currency = v.currency === undefined ? 'ZAR' : v.currency
  if (currency !== 'ZAR') return null
  return {
    family_pass_cents: v.family_pass_cents,
    launch_family_pass_cents: v.launch_family_pass_cents,
    launch_limit: v.launch_limit,
    kit_cents: kit,
    extra_kit_cents: kit,
    book_cents: isCents(v.book_cents) ? v.book_cents : null,
    delivery_locker_cents: isCents(v.delivery_locker_cents) ? v.delivery_locker_cents : null,
    delivery_door_cents: isCents(v.delivery_door_cents) ? v.delivery_door_cents : null,
    org_tiers: parseOrgTiers(v.org_tiers),
    currency: 'ZAR',
  }
}

export interface Quote {
  family_pass_cents: number
  launch: boolean
  kit_cents: number
  /** Alias of kit_cents for older clients. */
  extra_kit_cents: number
  book_cents: number | null
  delivery_locker_cents: number | null
  delivery_door_cents: number | null
  org_tiers: OrgTier[]
  currency: string
}

/** Founding Family price applies while fewer than launch_limit family passes have been paid for. */
export function quotePrices(prices: Prices, paidFamilyPassCount: number): Quote {
  const launch = paidFamilyPassCount < prices.launch_limit
  return {
    family_pass_cents: launch ? prices.launch_family_pass_cents : prices.family_pass_cents,
    launch,
    kit_cents: prices.kit_cents,
    extra_kit_cents: prices.kit_cents,
    book_cents: prices.book_cents,
    delivery_locker_cents: prices.delivery_locker_cents,
    delivery_door_cents: prices.delivery_door_cents,
    org_tiers: prices.org_tiers,
    currency: prices.currency,
  }
}

/** Organisation price per learner for a given number of learners, or null when no tier covers it. */
export function orgPricePerLearner(tiers: OrgTier[], learners: number): number | null {
  if (!Number.isInteger(learners) || learners < 1) return null
  const tier = tiers.find((t) => learners >= t.min && (t.max === null || learners <= t.max))
  return tier ? tier.cents : null
}

/** Flat delivery fee for one parcel, or null when that method has no price yet. */
export function deliveryFee(prices: Prices, method: DeliveryMethod): number | null {
  return method === 'locker' ? prices.delivery_locker_cents : prices.delivery_door_cents
}

// ---------- Kit stock ----------

/** Parses app_settings.kits_in_stock. Null means stock is not tracked (never blocks a sale). */
export function parseStock(value: unknown): number | null {
  return isCount(value) ? value : null
}

/** True when a checkout with `kits` Armour Kits can go ahead with the current stock. */
export function hasKitStock(stock: number | null, kits: number): boolean {
  return kits <= 0 || stock === null || kits <= stock
}

/** Stock after a paid order. Mirrors the decrement in public.fulfill_warrior_pass_order: never below zero. */
export function stockAfterSale(stock: number | null, kits: number): number | null {
  return stock === null ? null : Math.max(0, stock - Math.max(0, kits))
}

export const LOW_STOCK_THRESHOLD = 10

export function isLowStock(stock: number | null): boolean {
  return stock !== null && stock <= LOW_STOCK_THRESHOLD
}

// ---------- Checkout ----------

export type CheckoutKind = 'family_pass' | 'extra_kit' | 'book'
export type DeliveryMethod = 'door' | 'locker'

export interface CheckoutInput {
  kind: CheckoutKind
  /** No longer used: the pass does not include a kit. Must be null or left out. */
  includedKitChildId?: string | null
  /** Children who get an Armour Kit in this checkout. */
  extraKitChildIds: string[]
  /** Needed when the checkout has at least one Armour Kit. */
  deliveryMethod?: DeliveryMethod | null
}

export interface CheckoutContext {
  prices: Prices | null
  paidFamilyPassCount: number
  hasActivePass: boolean
  ownedChildIds: string[]
  childrenWithKits: string[]
  /** Optional so older callers keep working; only used for book orders. */
  hasBook?: boolean
  /** Kits in stock. Null or missing means stock is not tracked. */
  kitsInStock?: number | null
}

export interface PriceLine {
  type: 'family_pass' | 'extra_kit' | 'delivery' | 'book'
  child_id: string | null
  amount_cents: number
  /** Only on delivery lines. */
  method?: DeliveryMethod
}

export type CheckoutError =
  | 'prices_unavailable' | 'invalid_kind' | 'already_has_pass'
  | 'pass_required' | 'invalid_child' | 'kit_exists' | 'duplicate_child' | 'empty_order'
  | 'book_not_available' | 'already_has_book' | 'kits_sold_out' | 'delivery_required' | 'delivery_unavailable'

export type CheckoutResult =
  | {
    ok: true
    kind: CheckoutKind
    amount_cents: number
    currency: string
    launch: boolean
    /** Always null for new orders; the column is kept for older orders. */
    included_kit_child_id: null
    extra_kit_child_ids: string[]
    delivery_method: DeliveryMethod | null
    delivery_cents: number
    lines: PriceLine[]
  }
  | { ok: false; error: CheckoutError }

/**
 * Server-side price and eligibility check. The client never computes prices.
 * The pass covers lessons only. Armour Kits are kit_cents per child plus ONE delivery
 * fee per checkout, and need a pass (already active, or bought in the same checkout).
 */
export function computeCheckout(input: CheckoutInput, ctx: CheckoutContext): CheckoutResult {
  if (!ctx.prices) return { ok: false, error: 'prices_unavailable' }
  const prices = ctx.prices
  if (input.kind !== 'family_pass' && input.kind !== 'extra_kit' && input.kind !== 'book') return { ok: false, error: 'invalid_kind' }
  if (input.includedKitChildId) return { ok: false, error: 'invalid_kind' }
  if (input.kind === 'book') {
    if (prices.book_cents === null) return { ok: false, error: 'book_not_available' }
    if (input.extraKitChildIds.length) return { ok: false, error: 'invalid_kind' }
    if (ctx.hasBook) return { ok: false, error: 'already_has_book' }
    return {
      ok: true, kind: 'book', amount_cents: prices.book_cents, currency: prices.currency, launch: false,
      included_kit_child_id: null, extra_kit_child_ids: [], delivery_method: null, delivery_cents: 0,
      lines: [{ type: 'book', child_id: null, amount_cents: prices.book_cents }],
    }
  }
  const owned = new Set(ctx.ownedChildIds)
  const withKits = new Set(ctx.childrenWithKits)
  const kits = Array.from(new Set(input.extraKitChildIds)).sort()
  if (kits.length !== input.extraKitChildIds.length) return { ok: false, error: 'duplicate_child' }
  const quote = quotePrices(prices, ctx.paidFamilyPassCount)
  const lines: PriceLine[] = []

  if (input.kind === 'family_pass') {
    if (ctx.hasActivePass) return { ok: false, error: 'already_has_pass' }
    lines.push({ type: 'family_pass', child_id: null, amount_cents: quote.family_pass_cents })
  } else {
    if (!ctx.hasActivePass) return { ok: false, error: 'pass_required' }
    if (kits.length === 0) return { ok: false, error: 'empty_order' }
  }

  for (const id of kits) {
    if (!owned.has(id)) return { ok: false, error: 'invalid_child' }
    if (withKits.has(id)) return { ok: false, error: 'kit_exists' }
    lines.push({ type: 'extra_kit', child_id: id, amount_cents: quote.kit_cents })
  }

  let deliveryMethod: DeliveryMethod | null = null
  let deliveryCents = 0
  if (kits.length > 0) {
    if (!hasKitStock(ctx.kitsInStock ?? null, kits.length)) return { ok: false, error: 'kits_sold_out' }
    if (input.deliveryMethod !== 'door' && input.deliveryMethod !== 'locker') return { ok: false, error: 'delivery_required' }
    const fee = deliveryFee(prices, input.deliveryMethod)
    if (fee === null) return { ok: false, error: 'delivery_unavailable' }
    deliveryMethod = input.deliveryMethod
    deliveryCents = fee
    lines.push({ type: 'delivery', child_id: null, amount_cents: fee, method: deliveryMethod })
  }

  return {
    ok: true,
    kind: input.kind,
    amount_cents: lines.reduce((sum, l) => sum + l.amount_cents, 0),
    currency: quote.currency,
    launch: input.kind === 'family_pass' && quote.launch,
    included_kit_child_id: null,
    extra_kit_child_ids: kits,
    delivery_method: deliveryMethod,
    delivery_cents: deliveryCents,
    lines,
  }
}

/** True when a pending order has exactly the same contents (double click protection). */
export function sameOrderContents(
  a: { kind: string; amount_cents: number; included_kit_child_id: string | null; extra_kit_child_ids: string[] | null },
  b: { kind: string; amount_cents: number; included_kit_child_id: string | null; extra_kit_child_ids: string[] },
): boolean {
  const ax = [...(a.extra_kit_child_ids ?? [])].sort()
  const bx = [...b.extra_kit_child_ids].sort()
  return a.kind === b.kind && a.amount_cents === b.amount_cents &&
    (a.included_kit_child_id ?? null) === (b.included_kit_child_id ?? null) &&
    ax.length === bx.length && ax.every((v, i) => v === bx[i])
}

/** Receipt and checkout label for one price line. */
export function lineLabel(line: { type: string; method?: string }, childName?: string | null, launch = false): string {
  if (line.type === 'family_pass') return `Family Warrior Pass${launch ? ' (Founding Family price)' : ''}`
  if (line.type === 'book') return "Kiki's Armour of God, Premium Edition (PDF)"
  if (line.type === 'delivery') return line.method === 'locker' ? 'Delivery to a Courier Guy locker' : 'Door delivery'
  return `Armour Kit${childName ? ` for ${childName}` : ''}`
}

// ---------- Delivery details ----------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export type Delivery = {
  delivery_method: DeliveryMethod
  recipient_name: string
  phone: string
  address_line1: string | null
  address_line2: string | null
  suburb: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  locker_code: string | null
}

/** Validates delivery details from the browser. Returns the first bad field. */
export function parseDelivery(d: any): { ok: true; value: Delivery } | { ok: false; field: string } {
  if (!d || typeof d !== 'object') return { ok: false, field: 'delivery' }
  const method = d.method
  if (method !== 'door' && method !== 'locker') return { ok: false, field: 'method' }
  const recipient_name = str(d.recipient_name, 100)
  if (recipient_name.length < 2) return { ok: false, field: 'recipient_name' }
  const phone = str(d.phone, 30).replace(/[\s()-]/g, '')
  if (!/^\+?\d{9,15}$/.test(phone)) return { ok: false, field: 'phone' }
  if (method === 'locker') {
    const locker_code = str(d.locker_code, 40)
    if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,39}$/.test(locker_code)) return { ok: false, field: 'locker_code' }
    return { ok: true, value: { delivery_method: 'locker', recipient_name, phone, locker_code, address_line1: null, address_line2: null, suburb: null, city: null, province: null, postal_code: null } }
  }
  const address_line1 = str(d.address_line1, 200)
  const city = str(d.city, 100)
  const province = str(d.province, 60)
  const postal_code = str(d.postal_code, 10)
  if (address_line1.length < 3) return { ok: false, field: 'address_line1' }
  if (city.length < 2) return { ok: false, field: 'city' }
  if (province.length < 2) return { ok: false, field: 'province' }
  if (!/^\d{4}$/.test(postal_code)) return { ok: false, field: 'postal_code' }
  return {
    ok: true,
    value: {
      delivery_method: 'door', recipient_name, phone, address_line1, city, province, postal_code,
      address_line2: str(d.address_line2, 200) || null, suburb: str(d.suburb, 100) || null, locker_code: null,
    },
  }
}

// ---------- Webhook signatures (Standard Webhooks style, as documented by Yoco) ----------

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(b64)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function constantTimeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a)
  const eb = new TextEncoder().encode(b)
  let diff = ea.length ^ eb.length
  const n = Math.max(ea.length, eb.length)
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0)
  return diff === 0
}

export async function signWebhook(secret: string, id: string, timestamp: string, body: string): Promise<string | null> {
  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const keyBytes = base64ToBytes(raw)
  if (!keyBytes || keyBytes.length === 0) return null
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))
  return bytesToBase64(new Uint8Array(sig))
}

export const WEBHOOK_TOLERANCE_SECONDS = 180

/**
 * Verifies webhook-id, webhook-timestamp and webhook-signature headers against the raw body.
 * Rejects timestamps more than 3 minutes away from now. Compares every "v1,<sig>" entry in constant time.
 */
export async function verifyWebhookSignature(opts: {
  secret: string
  id: string | null
  timestamp: string | null
  signatureHeader: string | null
  body: string
  nowSeconds?: number
  toleranceSeconds?: number
}): Promise<boolean> {
  const { secret, id, timestamp, signatureHeader, body } = opts
  if (!secret || !id || !timestamp || !signatureHeader) return false
  if (!/^\d{1,12}$/.test(timestamp)) return false
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000)
  const tolerance = opts.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS
  if (Math.abs(now - Number(timestamp)) > tolerance) return false
  const expected = await signWebhook(secret, id, timestamp, body)
  if (!expected) return false
  let match = false
  for (const part of signatureHeader.split(' ')) {
    const [version, sig] = part.split(',', 2)
    if (version !== 'v1' || !sig) continue
    if (constantTimeEqual(sig, expected)) match = true
  }
  return match
}

// ---------- Yoco configuration ----------

export type YocoMode = 'test' | 'live'

/** Mode from the secret key prefix. Never exposes the key itself. */
export function yocoKeyMode(secretKey: string | null | undefined): YocoMode | null {
  if (!secretKey) return null
  if (secretKey.startsWith('sk_live_')) return 'live'
  if (secretKey.startsWith('sk_test_')) return 'test'
  return null
}

export const webhookSecretKeyName = (mode: YocoMode) => `yoco_webhook_secret:${mode}`
export const webhookIdKeyName = (mode: YocoMode) => `yoco_webhook_id:${mode}`

/**
 * Webhook signing secret lookup order: YOCO_WEBHOOK_SECRET from the environment first,
 * otherwise the secret stored by register_yoco_webhook for the current key mode. Never a secret for the other mode.
 */
export function pickWebhookSecret(
  envSecret: string | null | undefined,
  stored: { key: string; value: string; mode: string | null }[],
  mode: YocoMode | null,
): string {
  if (envSecret) return envSecret
  if (!mode) return ''
  const row = stored.find((r) => r.key === webhookSecretKeyName(mode) && r.mode === mode)
  return row?.value ?? ''
}
