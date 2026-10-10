import {
  admin, anonClient, clientIp, cors, createChallenge, decodeJwt, deviceHashFrom, isTrusted, json, logEvent,
  maskEmail, nowText, registerSession, sendNewSigninEmail, revokeSession, sendSecurityEmail, sha256, trustDevice, trustedCount, userAgent,
} from '../_shared/security.ts'

const WINDOW_MS = 15 * 60_000
const BASE_LOCK_MS = 15 * 60_000
const MAX_LOCK_MS = 24 * 60 * 60_000
const EMAIL_LIMIT = 5
const IP_LIMIT = 20
const GENERIC = 'Invalid email or password.'

type Throttle = { key: string; fail_count: number; window_start: string; lock_level: number; locked_until: string | null }

async function getThrottle(key: string): Promise<Throttle> {
  const { data } = await admin.from('login_throttle').select('*').eq('key', key).maybeSingle()
  return (data as Throttle) ?? { key, fail_count: 0, window_start: new Date().toISOString(), lock_level: 0, locked_until: null }
}

function lockedFor(t: Throttle): number {
  if (!t.locked_until) return 0
  const ms = new Date(t.locked_until).getTime() - Date.now()
  return ms > 0 ? Math.ceil(ms / 1000) : 0
}

/** Records a failure. Returns true if this failure triggered a lock. */
async function recordFailure(t: Throttle, limit: number): Promise<boolean> {
  const now = Date.now()
  let count = t.fail_count
  let windowStart = new Date(t.window_start).getTime()
  if (now - windowStart > WINDOW_MS) { count = 0; windowStart = now }
  count += 1
  let lockLevel = t.lock_level
  let lockedUntil = t.locked_until
  let locked = false
  if (count >= limit) {
    const dur = Math.min(BASE_LOCK_MS * 2 ** lockLevel, MAX_LOCK_MS)
    lockedUntil = new Date(now + dur).toISOString()
    lockLevel += 1
    count = 0
    windowStart = now
    locked = true
  }
  await admin.from('login_throttle').upsert({
    key: t.key, fail_count: count, window_start: new Date(windowStart).toISOString(),
    lock_level: lockLevel, locked_until: lockedUntil, updated_at: new Date().toISOString(),
  })
  return locked
}

async function verifyTurnstile(token: unknown, ip: string, secret: string) {
  if (typeof token !== 'string' || !token) return false
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip !== 'unknown') form.append('remoteip', ip)
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    const d = await r.json()
    return d.success === true
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_request' }, 400) }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || email.length > 255 || !email.includes('@') || !password || password.length > 128) {
    return json({ error: 'invalid_credentials', message: GENERIC }, 400)
  }
  const deviceHash = await deviceHashFrom(body?.device_secret)
  if (!deviceHash) return json({ error: 'invalid_device' }, 400)

  const ip = clientIp(req)
  const ua = userAgent(req)
  const emailHash = await sha256(email)
  const emailKey = `email:${emailHash}`
  const ipKey = `ip:${ip}`

  const [et, it] = await Promise.all([getThrottle(emailKey), getThrottle(ipKey)])
  const wait = Math.max(lockedFor(et), lockedFor(it))
  if (wait > 0) {
    await logEvent({ email_hash: emailHash, ip, user_agent: ua, event_type: 'login_blocked_locked', details: { retry_after_seconds: wait } })
    return json({ error: 'locked', retry_after_seconds: wait }, 429)
  }

  const tsSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  const windowActive = Date.now() - new Date(et.window_start).getTime() <= 15 * 60_000
  if (tsSecret && windowActive && et.fail_count >= 2) {
    if (!(await verifyTurnstile(body?.turnstile_token, ip, tsSecret))) {
      return json({ error: 'captcha_required' }, 400)
    }
  }

  const anon = anonClient()
  const { data, error } = await anon.auth.signInWithPassword({ email, password })

  if (error || !data.session || !data.user) {
    const emailLocked = await recordFailure(et, EMAIL_LIMIT)
    const ipLocked = await recordFailure(it, IP_LIMIT)
    await logEvent({ email_hash: emailHash, ip, user_agent: ua, event_type: 'login_failed', details: { reason: error?.message ?? 'no_session' } })
    if (emailLocked) {
      await logEvent({ email_hash: emailHash, ip, user_agent: ua, event_type: 'account_locked' })
      const { data: prof } = await admin.from('profiles').select('id, email').ilike('email', email).maybeSingle()
      if (prof?.email) {
        await sendSecurityEmail({
          to: prof.email,
          subject: 'Your Kiki Warrior account was paused',
          heading: 'Account paused',
          paragraphs: [
            'Your Kiki Warrior account was paused after several failed sign-in attempts.',
            `When: ${nowText()}. Approximate device: ${ua}.`,
            'If this was you, wait a little and try again. If it was not you, we recommend changing your password.',
          ],
          label: 'security_account_locked',
        })
      }
    }
    if (ipLocked) await logEvent({ ip, user_agent: ua, event_type: 'ip_locked' })
    // Confirmed-email errors are reported generically too, to avoid enumeration.
    return json({ error: 'invalid_credentials', message: GENERIC }, 401)
  }

  // Success: reset email counters and lock level.
  await admin.from('login_throttle').upsert({
    key: emailKey, fail_count: 0, window_start: new Date().toISOString(), lock_level: 0, locked_until: null, updated_at: new Date().toISOString(),
  })

  const user = data.user
  const session = data.session
  const claims = decodeJwt(session.access_token)
  const sessionId = claims?.session_id as string | undefined
  if (!sessionId) return json({ error: 'server_error' }, 500)

  const count = await trustedCount(user.id)
  if (count === 0) {
    await trustDevice(user.id, deviceHash, ua)
    await logEvent({ user_id: user.id, ip, user_agent: ua, event_type: 'device_trusted_first' })
  } else if (!(await isTrusted(user.id, deviceHash))) {
    await revokeSession(sessionId, 'step_up_required')
    const challengeId = await createChallenge({ userId: user.id, email: user.email ?? email, deviceHash, ip, ua })
    return json({ step_up: true, challenge_id: challengeId, masked_email: maskEmail(user.email ?? email) })
  } else {
    await trustDevice(user.id, deviceHash, ua)
  }

  await registerSession({ sessionId, userId: user.id, email: user.email ?? email, deviceHash, ip, ua })
  await logEvent({ user_id: user.id, ip, user_agent: ua, event_type: 'login_success' })
  if (count === 0) await sendNewSigninEmail(user.id, user.email ?? email, ua)
  return json({ access_token: session.access_token, refresh_token: session.refresh_token })
})
