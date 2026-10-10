import {
  admin, clientIp, cors, createRevokeLink, checkPassword, getClaimsFrom, hitLimit, isRegisteredSession, json, logEvent,
  nowText, passwordPolicy, revokeSession, sendSecurityEmail, userAgent,
} from '../_shared/security.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const claims = await getClaimsFrom(req)
  if (!claims || !(await isRegisteredSession(claims))) return json({ error: 'unauthorized' }, 401)
  const ip = clientIp(req)
  const ua = userAgent(req)
  const userId = claims.sub as string
  const email = (claims.email as string) || ''

  const lim = await hitLimit(`pwchange:${userId}`, 5, 15 * 60_000)
  if (lim.blocked) return json({ error: 'too_many', message: 'Too many attempts. Please wait and try again.' }, 429)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_request' }, 400) }
  if (typeof body?.current_password !== 'string' || !(await checkPassword(email, body.current_password))) {
    await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'password_change_bad_current' })
    return json({ error: 'wrong_password', message: 'Your current password is not right.' }, 400)
  }
  const policyError = await passwordPolicy(body?.new_password, email, { ip, ua })
  if (policyError) return json({ error: 'weak_password', message: policyError }, 400)

  const { error } = await admin.auth.admin.updateUserById(userId, { password: body.new_password })
  if (error) return json({ error: 'server_error', message: 'Could not update the password.' }, 500)

  // Sign out every other session; keep this one.
  const { data: others } = await admin.from('user_sessions').select('session_id').eq('user_id', userId).is('revoked_at', null).neq('session_id', claims.session_id)
  for (const s of others ?? []) await revokeSession(s.session_id, 'password_changed')
  await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'password_changed' })
  await sendSecurityEmail({
    to: email,
    subject: 'Your Kiki Warrior password was changed',
    heading: 'Password changed',
    paragraphs: [
      'Your Kiki Warrior password was changed. Other devices have been signed out.',
      `When: ${nowText()}. Device: ${ua}.`,
      'If you did not do this, tap the button below straight away.',
    ],
    button: { label: "This wasn't me", url: await createRevokeLink(userId) },
    label: 'security_password_changed',
  })
  return json({ ok: true })
})
