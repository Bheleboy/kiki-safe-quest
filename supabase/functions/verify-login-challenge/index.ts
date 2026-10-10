import {
  admin, anonClient, clientIp, cors, decodeJwt, deviceHashFrom, json, logEvent, nowText, randomCode, randomToken,
  registerSession, sendCodeEmail, sendSecurityEmail, sha256, trustDevice, userAgent,
} from '../_shared/security.ts'

const MAX_ATTEMPTS = 5
const MAX_RESENDS = 3
const RESEND_GAP_MS = 60_000
const SITE = 'https://kikiwarrior.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_request' }, 400) }
  const action = body?.action === 'resend' ? 'resend' : 'verify'
  const challengeId = typeof body?.challenge_id === 'string' ? body.challenge_id : ''
  if (!/^[0-9a-f-]{36}$/i.test(challengeId)) return json({ error: 'invalid_challenge' }, 400)
  const deviceHash = await deviceHashFrom(body?.device_secret)
  if (!deviceHash) return json({ error: 'invalid_device' }, 400)

  const ip = clientIp(req)
  const ua = userAgent(req)

  const { data: ch } = await admin.from('login_challenges').select('*').eq('id', challengeId).maybeSingle()
  if (!ch || ch.consumed_at || new Date(ch.expires_at).getTime() < Date.now() || ch.attempts >= MAX_ATTEMPTS) {
    return json({ error: 'challenge_invalid', message: 'This code has expired. Please sign in again.' }, 400)
  }
  if (ch.device_hash !== deviceHash) {
    await logEvent({ user_id: ch.user_id, ip, user_agent: ua, event_type: 'stepup_device_mismatch', details: { challenge_id: ch.id } })
    return json({ error: 'device_mismatch', message: 'Please enter the code on the same device where you started signing in.' }, 403)
  }

  if (action === 'resend') {
    if (ch.resend_count >= MAX_RESENDS) return json({ error: 'resend_limit', message: 'No more codes can be sent. Please sign in again.' }, 429)
    const since = Date.now() - new Date(ch.last_sent_at).getTime()
    if (since < RESEND_GAP_MS) return json({ error: 'resend_wait', retry_after_seconds: Math.ceil((RESEND_GAP_MS - since) / 1000) }, 429)
    const code = randomCode()
    await admin.from('login_challenges').update({
      code_hash: await sha256(code + ch.id),
      resend_count: ch.resend_count + 1,
      last_sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    }).eq('id', ch.id)
    await sendCodeEmail(ch.email, code)
    await logEvent({ user_id: ch.user_id, ip, user_agent: ua, event_type: 'stepup_resent', details: { challenge_id: ch.id } })
    return json({ ok: true })
  }

  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  if (!/^\d{6}$/.test(code)) return json({ error: 'invalid_code', message: 'Enter the 6-digit code.' }, 400)

  const expected = await sha256(code + ch.id)
  if (expected !== ch.code_hash) {
    await admin.from('login_challenges').update({ attempts: ch.attempts + 1 }).eq('id', ch.id)
    await logEvent({ user_id: ch.user_id, ip, user_agent: ua, event_type: 'stepup_wrong_code', details: { challenge_id: ch.id, attempts: ch.attempts + 1 } })
    const left = MAX_ATTEMPTS - ch.attempts - 1
    return json({ error: 'wrong_code', message: left > 0 ? `That code is not right. ${left} tries left.` : 'Too many wrong codes. Please sign in again.' }, 400)
  }

  // Consume atomically (only if still unconsumed)
  const { data: consumed } = await admin
    .from('login_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', ch.id)
    .is('consumed_at', null)
    .select('id')
  if (!consumed?.length) return json({ error: 'challenge_invalid', message: 'This code was already used.' }, 400)

  await trustDevice(ch.user_id, deviceHash, ua)

  let tokens: { access_token: string; refresh_token: string } | null = null
  let sessionId: string | null = null

  if (ch.existing_session_id) {
    // OAuth flow: register the caller's existing session.
    const auth = req.headers.get('Authorization') ?? ''
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const { data: cl, error } = await anonClient().auth.getClaims(jwt)
    const claims = cl?.claims as Record<string, any> | undefined
    if (error || !claims || claims.sub !== ch.user_id || claims.session_id !== ch.existing_session_id) {
      return json({ error: 'session_mismatch', message: 'Please sign in again.' }, 401)
    }
    sessionId = ch.existing_session_id
  } else {
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: ch.email })
    const hashed = link?.properties?.hashed_token
    if (linkErr || !hashed) { console.error('generateLink failed', linkErr); return json({ error: 'server_error' }, 500) }
    const { data: v, error: vErr } = await anonClient().auth.verifyOtp({ token_hash: hashed, type: 'magiclink' })
    if (vErr || !v.session) { console.error('verifyOtp failed', vErr); return json({ error: 'server_error' }, 500) }
    tokens = { access_token: v.session.access_token, refresh_token: v.session.refresh_token }
    sessionId = decodeJwt(v.session.access_token)?.session_id ?? null
    if (!sessionId) return json({ error: 'server_error' }, 500)
  }

  await registerSession({ sessionId: sessionId!, userId: ch.user_id, email: ch.email, deviceHash, ip, ua })
  await logEvent({ user_id: ch.user_id, ip, user_agent: ua, event_type: 'stepup_verified', details: { challenge_id: ch.id } })

  // One-time "This wasn't me" token (endpoint arrives in part 2)
  const rawToken = randomToken(32)
  await admin.from('security_tokens').insert({
    user_id: ch.user_id,
    token_hash: await sha256(rawToken),
    purpose: 'revoke_all',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
  })
  await sendSecurityEmail({
    to: ch.email,
    subject: 'New sign-in to your Kiki Warrior account',
    heading: 'New sign-in',
    paragraphs: [
      'There was a new sign-in to your Kiki Warrior account.',
      `When: ${nowText()}. Device: ${ua}.`,
      'If this was you, there is nothing to do. If it was not you, tap the button below to sign out everywhere.',
    ],
    button: { label: "This wasn't me", url: `${SITE}/security/revoke?token=${rawToken}` },
    label: 'security_new_signin',
  })

  return json(tokens ? { ...tokens } : { ok: true, registered: true })
})
