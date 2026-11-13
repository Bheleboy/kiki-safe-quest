// Warrior Pass pure helpers. No Deno or Node APIs beyond Web Crypto, so the
// same file runs in edge functions and in the app's Vitest suite.

export interface Prices {
  family_pass_cents: number
  launch_family_pass_cents: number
  launch_limit: number
  extra_kit_cents: number
  currency: string
}

const isCents = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0

/** Parses app_settings.prices. Returns null when anything is missing or malformed. */
export function parsePrices(value: unknown): Prices | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  if (!isCents(v.family_pass_cents) || !isCents(v.launch_family_pass_cents) || !isCents(v.extra_kit_cents)) return null
  if (typeof v.launch_limit !== 'number' || !Number.isInteger(v.launch_limit) || v.launch_limit < 0) return null
  const currency = v.currency === undefined ? 'ZAR' : v.currency
  if (currency !== 'ZAR') return null
  return {
    family_pass_cents: v.family_pass_cents,
    launch_family_pass_cents: v.launch_family_pass_cents,
    launch_limit: v.launch_limit,
    extra_kit_cents: v.extra_kit_cents,
    currency: 'ZAR',
  }
}

export interface Quote {
  family_pass_cents: number
  launch: boolean
  extra_kit_cents: number
  currency: string
}

/** Founding Family price applies while fewer than launch_limit family passes have been paid for. */
export function quotePrices(prices: Prices, paidFamilyPassCount: number): Quote {
  const launch = paidFamilyPassCount < prices.launch_limit
  return {
    family_pass_cents: launch ? prices.launch_family_pass_cents : prices.family_pass_cents,
    launch,
    extra_kit_cents: prices.extra_kit_cents,
    currency: prices.currency,
  }
}

export type CheckoutKind = 'family_pass' | 'extra_kit'

export interface CheckoutInput {
  kind: CheckoutKind
  includedKitChildId: string | null
  extraKitChildIds: string[]
}

export interface CheckoutContext {
  prices: Prices | null
  paidFamilyPassCount: number
  hasActivePass: boolean
  ownedChildIds: string[]
  childrenWithKits: string[]
}

export interface PriceLine {
  type: 'family_pass' | 'extra_kit'
  child_id: string | null
  amount_cents: number
}

export type CheckoutError =
  | 'prices_unavailable' | 'invalid_kind' | 'already_has_pass' | 'included_child_required'
  | 'pass_required' | 'invalid_child' | 'kit_exists' | 'duplicate_child' | 'empty_order'

export type CheckoutResult =
  | {
    ok: true
    kind: CheckoutKind
    amount_cents: number
    currency: string
    launch: boolean
    included_kit_child_id: string | null
    extra_kit_child_ids: string[]
    lines: PriceLine[]
  }
  | { ok: false; error: CheckoutError }

/** Server-side price and eligibility check. The client never computes prices. */
export function computeCheckout(input: CheckoutInput, ctx: CheckoutContext): CheckoutResult {
  if (!ctx.prices) return { ok: false, error: 'prices_unavailable' }
  if (input.kind !== 'family_pass' && input.kind !== 'extra_kit') return { ok: false, error: 'invalid_kind' }
  const owned = new Set(ctx.ownedChildIds)
  const withKits = new Set(ctx.childrenWithKits)
  const extras = Array.from(new Set(input.extraKitChildIds)).sort()
  if (extras.length !== input.extraKitChildIds.length) return { ok: false, error: 'duplicate_child' }
  const quote = quotePrices(ctx.prices, ctx.paidFamilyPassCount)
  const lines: PriceLine[] = []
  let included: string | null = null

  if (input.kind === 'family_pass') {
    if (ctx.hasActivePass) return { ok: false, error: 'already_has_pass' }
    if (!input.includedKitChildId) return { ok: false, error: 'included_child_required' }
    if (!owned.has(input.includedKitChildId)) return { ok: false, error: 'invalid_child' }
    if (withKits.has(input.includedKitChildId)) return { ok: false, error: 'kit_exists' }
    if (extras.includes(input.includedKitChildId)) return { ok: false, error: 'duplicate_child' }
    included = input.includedKitChildId
    lines.push({ type: 'family_pass', child_id: included, amount_cents: quote.family_pass_cents })
  } else {
    if (!ctx.hasActivePass) return { ok: false, error: 'pass_required' }
    if (input.includedKitChildId) return { ok: false, error: 'invalid_kind' }
    if (extras.length === 0) return { ok: false, error: 'empty_order' }
  }

  for (const id of extras) {
    if (!owned.has(id)) return { ok: false, error: 'invalid_child' }
    if (withKits.has(id)) return { ok: false, error: 'kit_exists' }
    lines.push({ type: 'extra_kit', child_id: id, amount_cents: quote.extra_kit_cents })
  }

  return {
    ok: true,
    kind: input.kind,
    amount_cents: lines.reduce((sum, l) => sum + l.amount_cents, 0),
    currency: quote.currency,
    launch: input.kind === 'family_pass' && quote.launch,
    included_kit_child_id: included,
    extra_kit_child_ids: extras,
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
