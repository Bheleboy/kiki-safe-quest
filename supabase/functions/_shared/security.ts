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

// ---------- Email (uses the existing branded email queue) ----------
const SENDER_DOMAIN = 'notify.kikiwarrior.com'
const FROM = 'Kiki Warrior <noreply@kikiwarrior.com>'

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export async function sendSecurityEmail(opts: {
  to: string
  subject: string
  heading: string
  paragraphs: string[]
  button?: { label: string; url: string }
  label: string
}) {
  const p = opts.paragraphs
    .map((t) => `<p style="font-size:15px;color:#636b75;line-height:1.6;margin:0 0 20px">${esc(t)}</p>`)
    .join('')
  const btn = opts.button
    ? `<a href="${esc(opts.button.url)}" style="display:inline-block;background:#d97b2a;color:#ffffff;font-size:14px;font-weight:bold;font-family:'Oswald',Arial,sans-serif;border-radius:12px;padding:14px 28px;text-decoration:none;text-transform:uppercase;letter-spacing:1px">${esc(opts.button.label)}</a>`
    : ''
  const html = `<!doctype html><html lang="en"><body style="background:#ffffff;font-family:'DM Sans',Arial,sans-serif"><div style="padding:32px 28px"><h1 style="font-size:24px;font-weight:bold;font-family:'Oswald',Arial,sans-serif;color:#2b3440;margin:0 0 20px;text-transform:uppercase;letter-spacing:0.5px">${esc(opts.heading)}</h1>${p}${btn}<p style="font-size:12px;color:#999999;margin:32px 0 0">This is a security notice from Kiki Warrior.</p></div></body></html>`
  const text = [opts.heading, '', ...opts.paragraphs, opts.button ? `${opts.button.label}: ${opts.button.url}` : ''].join('\n')
  const messageId = crypto.randomUUID()
  await admin.from('email_send_log').insert({ message_id: messageId, template_name: opts.label, recipient_email: opts.to, status: 'pending' })
  const { error } = await admin.rpc('enqueue_email', {
    queue_name: 'auth_emails',
    payload: {
      run_id: crypto.randomUUID(),
      message_id: messageId,
      to: opts.to,
      from: FROM,
      sender_domain: SENDER_DOMAIN,
      subject: opts.subject,
      html,
      text,
      purpose: 'transactional',
      label: opts.label,
      queued_at: new Date().toISOString(),
    },
  })
  if (error) console.error('enqueue security email failed', error)
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
    await sendSecurityEmail({
      to: opts.email,
      subject: 'You were signed out on another device',
      heading: 'Signed out on another device',
      paragraphs: [
        'You were signed out on another device because your account was signed in on a new one.',
        `New sign-in: ${nowText()} on ${opts.ua}.`,
        'If this was not you, change your password straight away.',
      ],
      label: 'security_session_limit',
    })
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
  await sendSecurityEmail({
    to: email,
    subject: 'Your Kiki Warrior sign-in code',
    heading: `Sign-in code: ${code}`,
    paragraphs: [
      `Your Kiki Warrior sign-in code is ${code}. It expires in 10 minutes.`,
      'If you did not try to sign in, change your password.',
    ],
    label: 'security_stepup_code',
  })
}
