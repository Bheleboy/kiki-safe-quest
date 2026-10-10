import {
  admin, checkPassword, clientIp, cors, getClaimsFrom, hitLimit, isRegisteredSession, json, logEvent, nowText,
  sendSecurityEmail, userAgent,
} from '../_shared/security.ts'

const ITER = 210_000
const UNLOCK_MS = 15 * 60_000
const MAX_FAILS = 5
const BASE_LOCK_MS = 15 * 60_000
const MAX_LOCK_MS = 24 * 60 * 60_000

function b64(a: Uint8Array) { return btoa(String.fromCharCode(...a)) }
function unb64(s: string) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) }

async function pbkdf2(pin: string, salt: Uint8Array, iter: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256)
  return new Uint8Array(bits)
}
async function hashPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await pbkdf2(pin, salt, ITER))}`
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

function trivial(pin: string) {
  if (/^(\d)\1{3}$/.test(pin)) return true
  const asc = '0123456789012', desc = '9876543210987'
  if (asc.includes(pin) || desc.includes(pin)) return true
  return ['1212', '6969', '1004', '2000', '4321', '1122'].includes(pin)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const claims = await getClaimsFrom(req)
  if (!claims || !(await isRegisteredSession(claims))) return json({ error: 'unauthorized' }, 401)
  const userId = claims.sub as string
  const email = (claims.email as string) || ''
  const ip = clientIp(req)
  const ua = userAgent(req)

  let body: any
  try { body = await req.json() } catch { body = {} }
  const action = body?.action
  const { data: row } = await admin.from('parent_pins').select('*').eq('user_id', userId).maybeSingle()

  if (action === 'status') {
    const wait = row?.locked_until ? Math.max(0, Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000)) : 0
    return json({ has_pin: !!row, locked_seconds: wait })
  }

  if (action === 'set') {
    const pin = typeof body?.pin === 'string' ? body.pin : ''
    if (!/^\d{4}$/.test(pin)) return json({ error: 'invalid_pin', message: 'Your PIN must be 4 digits.' }, 400)
    if (trivial(pin)) return json({ error: 'weak_pin', message: 'That PIN is too easy to guess. Please choose another.' }, 400)
    if (row) {
      const lim = await hitLimit(`pin_pw:${userId}`, 5, 15 * 60_000)
      if (lim.blocked) return json({ error: 'too_many', message: 'Too many attempts. Please wait and try again.' }, 429)
      if (typeof body?.password !== 'string' || !(await checkPassword(email, body.password))) {
        await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'pin_reset_bad_password' })
        return json({ error: 'wrong_password', message: 'Your account password is not right.' }, 400)
      }
    }
    await admin.from('parent_pins').upsert({
      user_id: userId, pin_hash: await hashPin(pin), failed_attempts: 0, lock_level: 0, locked_until: null, updated_at: new Date().toISOString(),
    })
    await logEvent({ user_id: userId, ip, user_agent: ua, event_type: row ? 'pin_reset' : 'pin_set' })
    return json({ ok: true, unlock_until: Date.now() + UNLOCK_MS })
  }

  if (action === 'verify') {
    if (!row) return json({ error: 'no_pin' }, 400)
    if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
      const secs = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000)
      return json({ error: 'locked', retry_after_seconds: secs, message: `Too many wrong PINs. Please wait ${Math.ceil(secs / 60)} minutes.` }, 429)
    }
    const pin = typeof body?.pin === 'string' ? body.pin : ''
    if (/^\d{4}$/.test(pin) && (await verifyPinHash(pin, row.pin_hash))) {
      await admin.from('parent_pins').update({ failed_attempts: 0, lock_level: 0, locked_until: null, updated_at: new Date().toISOString() }).eq('user_id', userId)
      return json({ ok: true, unlock_until: Date.now() + UNLOCK_MS })
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
    await logEvent({ user_id: userId, ip, user_agent: ua, event_type: lockedUntil ? 'pin_locked' : 'pin_wrong' })
    if (lockedUntil && email) {
      await sendSecurityEmail({
        to: email,
        subject: 'Your Kiki Warrior parent PIN was locked',
        heading: 'Parent PIN locked',
        paragraphs: [
          'Someone entered the wrong parent PIN several times, so parent areas are locked for a while.',
          `When: ${nowText()}. Device: ${ua}.`,
          'If this was not you or your family, sign in and change your password.',
        ],
        label: 'security_pin_locked',
      })
      return json({ error: 'locked', message: 'Too many wrong PINs. Parent areas are locked for a while.' }, 429)
    }
    return json({ error: 'wrong_pin', message: `Wrong PIN. ${MAX_FAILS - fails} tries left.` }, 400)
  }

  return json({ error: 'invalid_action' }, 400)
})
