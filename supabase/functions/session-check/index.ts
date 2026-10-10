import {
  admin, anonClient, clientIp, cors, createChallenge, deviceHashFrom, isTrusted, json, logEvent, maskEmail,
  registerSession, revokeSession, sendNewSigninEmail, trustDevice, trustedCount, userAgent,
} from '../_shared/security.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json({ valid: false, reason: 'no_token' }, 401)
  const jwt = auth.slice(7)
  const { data: cl, error } = await anonClient().auth.getClaims(jwt)
  const claims = cl?.claims as Record<string, any> | undefined
  if (error || !claims?.sub || !claims.session_id) return json({ valid: false, reason: 'invalid_token' }, 401)

  let body: any
  try { body = await req.json() } catch { body = {} }
  const deviceHash = await deviceHashFrom(body?.device_secret)
  if (!deviceHash) return json({ valid: false, reason: 'invalid_device' }, 400)

  const userId = claims.sub as string
  const sessionId = claims.session_id as string
  const ip = clientIp(req)
  const ua = userAgent(req)

  const { data: row } = await admin.from('user_sessions').select('*').eq('session_id', sessionId).maybeSingle()

  if (body?.action === 'revoke_self') {
    if (row && row.user_id === userId) {
      await revokeSession(sessionId, typeof body?.reason === 'string' ? body.reason.slice(0, 40) : 'sign_out')
    } else {
      await admin.rpc('revoke_auth_session', { _session_id: sessionId })
    }
    await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'session_revoked_self', details: { reason: body?.reason ?? 'sign_out' } })
    return json({ ok: true })
  }

  if (body?.action === 'register') {
    if (row) {
      if (row.revoked_at || row.device_hash !== deviceHash || row.user_id !== userId) return json({ valid: false, reason: 'revoked' })
      return json({ valid: true, registered: true })
    }
    // Only OAuth sign-ins may self-register; password sign-ins must use secure-login.
    const amr = Array.isArray(claims.amr) ? claims.amr : []
    const isOauth = amr.some((a: any) => a?.method === 'oauth')
    if (!isOauth) {
      await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'register_rejected_not_oauth' })
      return json({ valid: false, reason: 'not_registered' })
    }
    const email = (claims.email as string) || ''
    const [count, trustedHere] = await Promise.all([trustedCount(userId), isTrusted(userId, deviceHash)])
    if (count === 0 || trustedHere) {
      await Promise.all([
        trustDevice(userId, deviceHash, ua),
        registerSession({ sessionId, userId, email: email || null, deviceHash, ip, ua }),
      ])
      await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'login_success_oauth' })
      if (count === 0 && email) sendNewSigninEmail(userId, email, ua)
      return json({ valid: true, registered: true })
    }
    if (!email) return json({ valid: false, reason: 'no_email' })
    const challengeId = await createChallenge({ userId, email, deviceHash, existingSessionId: sessionId, ip, ua })
    return json({ valid: false, step_up: true, challenge_id: challengeId, masked_email: maskEmail(email) })
  }

  if (!row) return json({ valid: false, reason: 'not_registered' })
  if (row.revoked_at) return json({ valid: false, reason: row.revoke_reason || 'revoked' })
  if (row.user_id !== userId || row.device_hash !== deviceHash) {
    await logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'session_device_mismatch', details: { session_id: sessionId } })
    return json({ valid: false, reason: 'device_mismatch' })
  }
  await admin.from('user_sessions').update({ last_seen_at: new Date().toISOString(), ip }).eq('session_id', sessionId)
  return json({ valid: true })
})
