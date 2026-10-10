import {
  admin, anonClient, clientIp, cors, deviceHashFrom, hitLimit, json, logEvent, sha256, SITE_URL, userAgent,
} from '../_shared/security.ts'

const GENERIC = { ok: true, message: 'If an account exists, we have sent a link.' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_request' }, 400) }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const deviceHash = await deviceHashFrom(body?.device_secret)
  if (!email || email.length > 255 || !email.includes('@') || !deviceHash) return json({ error: 'invalid_request' }, 400)

  const ip = clientIp(req)
  const ua = userAgent(req)
  const emailHash = await sha256(email)

  const ipLimit = await hitLimit(`reset_ip:${ip}`, 5, 60 * 60_000)
  const emLimit = await hitLimit(`reset_email:${emailHash}`, 3, 60 * 60_000)
  if (ipLimit.blocked || emLimit.blocked) {
    await logEvent({ email_hash: emailHash, ip, user_agent: ua, event_type: 'reset_throttled' })
    return json(GENERIC)
  }

  const { data: prof } = await admin.from('profiles').select('id, email').ilike('email', email).maybeSingle()
  if (!prof?.id) {
    await logEvent({ email_hash: emailHash, ip, user_agent: ua, event_type: 'reset_requested_unknown' })
    return json(GENERIC)
  }

  await admin.from('reset_requests').insert({
    user_id: prof.id,
    device_hash: deviceHash,
    expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
  })
  const { error } = await anonClient().auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset-password` })
  if (error) console.error('recovery email failed', error)
  await logEvent({ user_id: prof.id, email_hash: emailHash, ip, user_agent: ua, event_type: 'reset_requested' })
  return json(GENERIC)
})
