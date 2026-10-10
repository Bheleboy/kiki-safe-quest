import {
  anonClient, clientIp, cors, deviceHashFrom, hitLimit, json, logEvent, passwordPolicy, sha256, SITE_URL, userAgent,
  verifyTurnstileToken,
} from '../_shared/security.ts'

const GENERIC = { ok: true, message: 'Check your email for a verification link!' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_request' }, 400) }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const firstName = typeof body?.first_name === 'string' ? body.first_name.trim().slice(0, 50) : ''
  const ageBand = typeof body?.age_band === 'string' ? body.age_band.slice(0, 20) : 'parent'
  const password = body?.password
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !firstName) {
    return json({ error: 'invalid_request', message: 'Please check your name and email.' }, 400)
  }
  if (!(await deviceHashFrom(body?.device_secret))) return json({ error: 'invalid_request' }, 400)

  const ip = clientIp(req)
  const ua = userAgent(req)
  const lim = await hitLimit(`signup_ip:${ip}`, 5, 60 * 60_000)
  if (lim.blocked) {
    await logEvent({ ip, user_agent: ua, event_type: 'signup_throttled' })
    const mins = Math.max(1, Math.ceil(lim.retryAfterSeconds / 60))
    return json({ error: 'locked', retry_after_seconds: lim.retryAfterSeconds, message: `Too many attempts. Please wait ${mins} minutes and try again.` }, 429)
  }
  if (!(await verifyTurnstileToken(body?.turnstile_token, ip))) return json({ error: 'captcha_required' }, 400)

  const policyError = await passwordPolicy(password, email, { ip, ua })
  if (policyError) return json({ error: 'weak_password', message: policyError }, 400)

  const { error } = await anonClient().auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, age_band: ageBand }, emailRedirectTo: SITE_URL },
  })
  await logEvent({ email_hash: await sha256(email), ip, user_agent: ua, event_type: error ? 'signup_failed' : 'signup_requested', details: error ? { error: error.message } : undefined })
  return json(GENERIC)
})
