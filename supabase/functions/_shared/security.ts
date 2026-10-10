import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
export const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
export const admin: SupabaseClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  )
}

export function userAgent(req: Request): string {
  return (req.headers.get('user-agent') || 'Unknown device').slice(0, 300)
}

export async function deviceHashFrom(secret: unknown): Promise<string | null> {
  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 200) return null
  return await sha256(secret)
}

export function decodeJwt(token: string): Record<string, any> | null {
  try {
    const p = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')
    return JSON.parse(atob(p.padEnd(Math.ceil(p.length / 4) * 4, '=')))
  } catch {
    return null
  }
}

export async function logEvent(e: {
  user_id?: string | null
  email_hash?: string | null
  ip?: string
  user_agent?: string
  event_type: string
  details?: Record<string, unknown>
}) {
  const { error } = await admin.from('security_events').insert(e)
  if (error) console.error('security_events insert failed', error)
}

export function randomCode(): string {
  const a = new Uint32Array(1)
  // Rejection sampling for uniform 6 digit code
  while (true) {
    crypto.getRandomValues(a)
    if (a[0] < 4294000000) return String(a[0] % 1000000).padStart(6, '0')
  }
}

export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return btoa(String.fromCharCode(...a)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function maskEmail(email: string): string {
  const [u, d] = email.split('@')
  if (!d) return email
  return `${u.slice(0, 1)}${'*'.repeat(Math.max(1, Math.min(u.length - 1, 5)))}@${d}`
}

// ---------- Email (platform app-email pipeline with fixed security templates) ----------
export type SecurityTemplate =
  | 'security-stepup-code' | 'security-new-signin' | 'security-account-locked'
  | 'security-session-limit' | 'security-password-changed' | 'security-pin-locked'

export async function sendSecurityEmail(opts: {
  to: string
  template: SecurityTemplate
  device?: string
  code?: string
  revokeUrl?: string
}) {
  try {
    const { data, error } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: opts.template,
        recipientEmail: opts.to,
        idempotencyKey: `${opts.template}-${crypto.randomUUID()}`,
        templateData: { device: opts.device, code: opts.code, revokeUrl: opts.revokeUrl, when: new Date().toUTCString() },
      },
    })
    if (error) console.error('security email send failed', opts.template, error)
    return data
  } catch (e) {
    console.error('security email send threw', opts.template, e)
  }
}

export function nowText() {
  return new Date().toUTCString()
}

// ---------- Devices & sessions ----------
export async function trustDevice(userId: string, deviceHash: string, ua: string) {
  await admin.from('trusted_devices').upsert(
    { user_id: userId, device_hash: deviceHash, user_agent: ua, last_seen_at: new Date().toISOString(), revoked_at: null },
    { onConflict: 'user_id,device_hash' },
  )
}

export async function isTrusted(userId: string, deviceHash: string) {
  const { data } = await admin
    .from('trusted_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('device_hash', deviceHash)
    .is('revoked_at', null)
    .maybeSingle()
  return !!data
}

export async function trustedCount(userId: string) {
  const { count } = await admin
    .from('trusted_devices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('revoked_at', null)
  return count ?? 0
}

export async function revokeSession(sessionId: string, reason: string) {
  await admin.from('user_sessions').update({ revoked_at: new Date().toISOString(), revoke_reason: reason }).eq('session_id', sessionId)
  const { error } = await admin.rpc('revoke_auth_session', { _session_id: sessionId })
  if (error) console.error('revoke_auth_session failed', error)
}

const MAX_SESSIONS = 2

export async function registerSession(opts: {
  sessionId: string
  userId: string
  email: string | null
  deviceHash: string
  ip: string
  ua: string
}) {
  await admin.from('user_sessions').upsert({
    session_id: opts.sessionId,
    user_id: opts.userId,
    device_hash: opts.deviceHash,
    ip: opts.ip,
    user_agent: opts.ua,
    last_seen_at: new Date().toISOString(),
    revoked_at: null,
    revoke_reason: null,
  })
  const { data: active } = await admin
    .from('user_sessions')
    .select('session_id, created_at')
    .eq('user_id', opts.userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
  const extra = (active ?? []).filter((s) => s.session_id !== opts.sessionId).slice(MAX_SESSIONS - 1)
  for (const s of extra) {
    await revokeSession(s.session_id, 'session_limit')
    await logEvent({ user_id: opts.userId, ip: opts.ip, user_agent: opts.ua, event_type: 'session_revoked_limit', details: { session_id: s.session_id } })
  }
  if (extra.length && opts.email) {
    await sendSecurityEmail({ to: opts.email, template: 'security-session-limit' })
  }
  await logEvent({ user_id: opts.userId, ip: opts.ip, user_agent: opts.ua, event_type: 'session_registered', details: { session_id: opts.sessionId } })
}

export async function createChallenge(opts: {
  userId: string
  email: string
  deviceHash: string
  existingSessionId?: string | null
  ip: string
  ua: string
}) {
  const id = crypto.randomUUID()
  const code = randomCode()
  const { error } = await admin.from('login_challenges').insert({
    id,
    user_id: opts.userId,
    email: opts.email,
    device_hash: opts.deviceHash,
    code_hash: await sha256(code + id),
    existing_session_id: opts.existingSessionId ?? null,
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  })
  if (error) throw error
  await sendCodeEmail(opts.email, code)
  await logEvent({ user_id: opts.userId, ip: opts.ip, user_agent: opts.ua, event_type: 'stepup_sent', details: { challenge_id: id } })
  return id
}

export async function sendCodeEmail(email: string, code: string) {
  await sendSecurityEmail({ to: email, template: 'security-stepup-code', code: code })
}

// ---------- Part 2 helpers ----------
export const SITE_URL = 'https://kikiwarrior.com'

/** Simple fixed-window counter on login_throttle. Counts every call. */
export async function hitLimit(key: string, limit: number, windowMs: number): Promise<{ blocked: boolean; retryAfterSeconds: number }> {
  const { data } = await admin.from('login_throttle').select('fail_count, window_start').eq('key', key).maybeSingle()
  const now = Date.now()
  let count = data?.fail_count ?? 0
  let start = data ? new Date(data.window_start).getTime() : now
  if (now - start > windowMs) { count = 0; start = now }
  if (count >= limit) return { blocked: true, retryAfterSeconds: Math.ceil((start + windowMs - now) / 1000) }
  await admin.from('login_throttle').upsert({
    key, fail_count: count + 1, window_start: new Date(start).toISOString(), updated_at: new Date().toISOString(),
  })
  return { blocked: false, retryAfterSeconds: 0 }
}

export async function createRevokeLink(userId: string): Promise<string> {
  const raw = randomToken(32)
  await admin.from('security_tokens').insert({
    user_id: userId,
    token_hash: await sha256(raw),
    purpose: 'revoke_all',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
  })
  return `${SITE_URL}/security/revoke?token=${raw}`
}

export async function sendNewSigninEmail(userId: string, email: string, ua: string) {
  const url = await createRevokeLink(userId)
  await sendSecurityEmail({ to: email, template: 'security-new-signin', device: ua })
}

export async function revokeAllSessions(userId: string, reason: string) {
  const { data } = await admin.from('user_sessions').select('session_id').eq('user_id', userId).is('revoked_at', null)
  for (const s of data ?? []) await revokeSession(s.session_id, reason)
}

/** Validates a bearer JWT. Returns claims or null. */
export async function getClaimsFrom(req: Request): Promise<Record<string, any> | null> {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const { data, error } = await anonClient().auth.getClaims(auth.slice(7))
  const c = data?.claims as Record<string, any> | undefined
  if (error || !c?.sub) return null
  return c
}

export async function isRegisteredSession(claims: Record<string, any>): Promise<boolean> {
  if (!claims.session_id) return false
  const { data } = await admin.from('user_sessions').select('user_id, revoked_at').eq('session_id', claims.session_id).maybeSingle()
  return !!data && !data.revoked_at && data.user_id === claims.sub
}

/** Re-checks a password without leaving a usable session behind. */
export async function checkPassword(email: string, password: string): Promise<boolean> {
  const { data, error } = await anonClient().auth.signInWithPassword({ email, password })
  if (error || !data.session) return false
  const sid = decodeJwt(data.session.access_token)?.session_id
  if (sid) await admin.rpc('revoke_auth_session', { _session_id: sid })
  return true
}

async function sha1Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Returns an error message, or null when the password is acceptable. */
export async function passwordPolicy(password: string, email: string, ctx: { ip?: string; ua?: string } = {}): Promise<string | null> {
  if (typeof password !== 'string' || password.length < 10) return 'Password must be at least 10 characters.'
  if (password.length > 128) return 'Password must be 128 characters or fewer.'
  if (email && password.trim().toLowerCase() === email.trim().toLowerCase()) return 'Password must not be the same as your email.'
  try {
    const h = await sha1Hex(password)
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch(`https://api.pwnedpasswords.com/range/${h.slice(0, 5)}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'KikiWarrior-Security' },
      signal: ctrl.signal,
    })
    clearTimeout(t)
    if (!r.ok) throw new Error(`hibp ${r.status}`)
    const body = await r.text()
    const suffix = h.slice(5)
    for (const line of body.split('\n')) {
      const [suf, cnt] = line.trim().split(':')
      if (suf === suffix && Number(cnt) > 0) return 'This password has appeared in a data breach. Please choose a different one.'
    }
  } catch (e) {
    await logEvent({ ip: ctx.ip, user_agent: ctx.ua, event_type: 'hibp_unavailable', details: { error: String(e) } })
  }
  return null
}

export async function verifyTurnstileToken(token: unknown, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) return true
  if (typeof token !== 'string' || !token) return false
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip !== 'unknown') form.append('remoteip', ip)
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    return (await r.json()).success === true
  } catch {
    return false
  }
}
