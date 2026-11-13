// Server-only Warrior Pass helpers (Deno edge runtime).
import { admin, background, logEvent, sendSecurityEmail, SITE_URL, SUPABASE_URL } from './security.ts'

// ---------- Parent PIN (same hashing and lockout rules as the parent-pin function) ----------
const MAX_FAILS = 5
const BASE_LOCK_MS = 15 * 60_000
const MAX_LOCK_MS = 24 * 60 * 60_000

function unb64(s: string): Uint8Array<ArrayBuffer> { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) }

async function pbkdf2(pin: string, salt: Uint8Array<ArrayBuffer>, iter: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256)
  return new Uint8Array(bits)
}

async function verifyPinHash(pin: string, stored: string) {
  const [, iter, salt, hash] = stored.split('$')
  const got = await pbkdf2(pin, unb64(salt), Number(iter))
  const want = unb64(hash)
  if (got.length !== want.length) return false
  let diff = 0
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i]
  return diff === 0
}

export type PinCheck =
  | { ok: true }
  | { ok: false; status: number; error: 'pin_required' | 'locked'; message: string }

/** Fresh server-side PIN check. Wrong PINs count toward the same lockout as the parent-pin function. */
export async function verifyParentPin(userId: string, email: string, pin: unknown, ctx: { ip: string; ua: string }): Promise<PinCheck> {
  const { data: row } = await admin.from('parent_pins').select('*').eq('user_id', userId).maybeSingle()
  if (!row) return { ok: false, status: 403, error: 'pin_required', message: 'Please set your parent PIN first.' }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    const secs = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000)
    return { ok: false, status: 429, error: 'locked', message: `Too many wrong PINs. Please wait ${Math.ceil(secs / 60)} minutes.` }
  }
  const value = typeof pin === 'string' ? pin : ''
  if (!/^\d{4}$/.test(value)) return { ok: false, status: 403, error: 'pin_required', message: 'Please enter your parent PIN.' }
  if (await verifyPinHash(value, row.pin_hash)) {
    if (row.failed_attempts || row.lock_level || row.locked_until) {
      await admin.from('parent_pins').update({ failed_attempts: 0, lock_level: 0, locked_until: null, updated_at: new Date().toISOString() }).eq('user_id', userId)
    }
    return { ok: true }
  }
  let fails = row.failed_attempts + 1
  let lockLevel = row.lock_level
  let lockedUntil: string | null = null
  if (fails >= MAX_FAILS) {
    lockedUntil = new Date(Date.now() + Math.min(BASE_LOCK_MS * 2 ** lockLevel, MAX_LOCK_MS)).toISOString()
    lockLevel += 1
    fails = 0
  }
  await admin.from('parent_pins').update({ failed_attempts: fails, lock_level: lockLevel, locked_until: lockedUntil, updated_at: new Date().toISOString() }).eq('user_id', userId)
  logEvent({ user_id: userId, ip: ctx.ip, user_agent: ctx.ua, event_type: lockedUntil ? 'pin_locked' : 'pin_wrong', details: { source: 'checkout' } })
  if (lockedUntil) {
    if (email) sendSecurityEmail({ to: email, template: 'security-pin-locked', device: ctx.ua })
    return { ok: false, status: 429, error: 'locked', message: 'Too many wrong PINs. Parent areas are locked for a while.' }
  }
  return { ok: false, status: 403, error: 'pin_required', message: `Wrong PIN. ${MAX_FAILS - fails} tries left.` }
}

// ---------- Misc ----------
export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await admin.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
  return data?.is_admin === true
}

/** Same origins the app allows for sign-in: the production domain (with or without www) and local development. */
export function allowedReturnOrigin(req: Request): string {
  const origin = req.headers.get('origin') || ''
  try {
    const u = new URL(origin)
    if (u.protocol === 'https:' && (u.hostname === 'kikiwarrior.com' || u.hostname === 'www.kikiwarrior.com')) return u.origin
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return u.origin
  } catch { /* fall through */ }
  return SITE_URL
}

export function yocoConfig() {
  const secretKey = Deno.env.get('YOCO_SECRET_KEY') || ''
  const webhookSecret = Deno.env.get('YOCO_WEBHOOK_SECRET') || ''
  return { secretKey, webhookSecret, configured: !!secretKey && !!webhookSecret }
}

/** Sends a fixed-copy app email through send-transactional-email with internal credentials. Never blocks the caller. */
export function sendAppEmail(opts: { to: string; template: string; idempotencyKey: string; data: Record<string, unknown> }): void {
  background((async () => {
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key, 'x-internal-key': key },
        body: JSON.stringify({ templateName: opts.template, recipientEmail: opts.to, idempotencyKey: opts.idempotencyKey, templateData: opts.data }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('app email send failed', opts.template, msg)
      await admin.from('email_send_log').insert({
        message_id: crypto.randomUUID(), template_name: opts.template, recipient_email: opts.to,
        status: 'failed', error_message: `app send: ${msg}`.slice(0, 1000),
      })
    }
  })())
}
