import {
  admin, clientIp, cors, createRevokeLink, deviceHashFrom, getClaimsFrom, json, logEvent, nowText, passwordPolicy,
  revokeAllSessions, clearPasswordResetRequired, sendSecurityEmail, userAgent, hitLimit,
} from '../_shared/security.ts'

const DEVICE_MSG = 'For your security, open this link on the same device and browser where you asked to reset your password.'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const ip = clientIp(req)
  const ua = userAgent(req)

  const claims = await getClaimsFrom(req)
  if (!claims) return json({ error: 'invalid_link', message: 'This password reset link is invalid or has expired.' }, 401)
  const amr = Array.isArray(claims.amr) ? claims.amr : []
  if (!amr.some((a: any) => a?.method === 'recovery' || a?.method === 'otp')) {
    return json({ error: 'invalid_link', message: 'This password reset link is invalid or has expired.' }, 401)
  }
  const userId = claims.sub as string
  const email = (claims.email as string) || ''

  const lim = await hitLimit(`reset_complete:${userId}`, 10, 60 * 60_000)
  if (lim.blocked) return json({ error: 'too_many', message: 'Too many attempts. Please try again later.' }, 429)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_request' }, 400) }
  const deviceHash = await deviceHashFrom(body?.device_secret)
  if (!deviceHash) return json({ error: 'device_mismatch', message: DEVICE_MSG }, 403)

  const { data: reqs } = await admin
    .from('reset_requests')
    .select('id, device_hash')
    .eq('user_id', userId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  const match = (reqs ?? []).find((r) => r.device_hash === deviceHash)
  if (!match) {
    await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'reset_device_mismatch' })
    return json({ error: 'device_mismatch', message: DEVICE_MSG }, 403)
  }

  const policyError = await passwordPolicy(body?.new_password, email, { ip, ua })
  if (policyError) return json({ error: 'weak_password', message: policyError }, 400)

  const { error } = await admin.auth.admin.updateUserById(userId, { password: body.new_password })
  if (error) { console.error('updateUserById failed', error); return json({ error: 'server_error', message: 'Could not update the password. Please try again.' }, 500) }

  await admin.from('reset_requests').update({ used_at: new Date().toISOString() }).eq('user_id', userId).is('used_at', null)
  await clearPasswordResetRequired(userId)
  await revokeAllSessions(userId, 'password_reset')
  if (claims.session_id) await admin.rpc('revoke_auth_session', { _session_id: claims.session_id })
  await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'password_reset_completed' })

  if (email) {
    await sendSecurityEmail({ to: email, template: 'security-password-changed', device: ua, revokeUrl: await createRevokeLink(userId) })
  }
  return json({ ok: true })
})
