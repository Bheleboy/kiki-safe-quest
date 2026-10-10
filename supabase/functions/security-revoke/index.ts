import {
  admin, anonClient, clientIp, cors, json, logEvent, revokeAllSessions, setPasswordResetRequired, sha256, SITE_URL, userAgent, hitLimit,
} from '../_shared/security.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const ip = clientIp(req)
  const ua = userAgent(req)
  const limit = await hitLimit(`revoke_ip:${ip}`, 20, 60 * 60_000)
  if (limit.blocked) return json({ ok: false, error: 'invalid' }, 429)

  let body: any
  try { body = await req.json() } catch { return json({ ok: false, error: 'invalid' }, 400) }
  const token = typeof body?.token === 'string' ? body.token : ''
  if (token.length < 20 || token.length > 200) return json({ ok: false, error: 'invalid' }, 400)

  const hash = await sha256(token)
  const { data: used } = await admin
    .from('security_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', hash)
    .eq('purpose', 'revoke_all')
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('user_id')
  const row = used?.[0]
  if (!row) return json({ ok: false, error: 'invalid' }, 400)

  const userId = row.user_id as string
  await setPasswordResetRequired(userId, 'user_reported')
  await revokeAllSessions(userId, 'user_reported')
  await admin.from('trusted_devices').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).is('revoked_at', null)

  const { data: u } = await admin.auth.admin.getUserById(userId)
  const email = u?.user?.email
  if (email) {
    const { error } = await anonClient().auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset-password` })
    if (error) console.error('recovery email failed', error)
  }
  await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'user_reported_signin' })
  return json({ ok: true })
})
