// Redeems a school or church bulk code for the signed-in parent. Needs a registered
// session and a fresh parent PIN (like checkout), is rate limited per user and per IP,
// and gives one generic error for any unknown, used or expired code. The code is marked
// redeemed and the family pass granted atomically by public.redeem_bulk_code.
// A bulk code unlocks lessons only; it never includes an Armour Kit.
import { admin, clientIp, cors, getClaimsFrom, hitLimit, isRegisteredSession, json, logEvent, userAgent } from '../_shared/security.ts'
import { isAdminUser, verifyParentPin } from '../_shared/warrior-pass-server.ts'
import { normalizeCode } from '../_shared/warrior-admin.ts'

const GENERIC = { error: 'invalid_code', message: 'That code did not work. Please check it and try again.' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const claims = await getClaimsFrom(req)
  if (!claims || !(await isRegisteredSession(claims))) return json({ error: 'unauthorized' }, 401)
  const userId = claims.sub as string
  const email = (claims.email as string) || ''
  const ip = clientIp(req)
  const ua = userAgent(req)

  let body: any
  try { body = await req.json() } catch { body = {} }

  const [isAdmin, paywallRes] = await Promise.all([
    isAdminUser(userId),
    admin.from('app_settings').select('value').eq('key', 'paywall_enabled').maybeSingle(),
  ])
  // Shipped switched off: only admins (preview) can redeem until the paywall is enabled.
  if (paywallRes.data?.value !== true && !isAdmin) return json({ error: 'not_available' }, 403)

  const [userLimit, ipLimit] = await Promise.all([
    hitLimit(`wp_redeem:${userId}`, 5, 15 * 60_000),
    hitLimit(`wp_redeem_ip:${ip}`, 20, 60 * 60_000),
  ])
  if (userLimit.blocked || ipLimit.blocked) {
    logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'code_redeem_throttled' })
    return json({ error: 'too_many', message: 'Too many attempts. Please wait a few minutes and try again.' }, 429)
  }

  const pin = await verifyParentPin(userId, email, body?.pin, { ip, ua })
  if (!pin.ok) return json({ error: pin.error, message: pin.message }, pin.status)

  const code = normalizeCode(body?.code)
  if (!code) {
    logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'code_redeem_failed' })
    return json(GENERIC, 400)
  }

  const { data: result, error } = await admin.rpc('redeem_bulk_code', { _user_id: userId, _code: code })
  if (error) {
    if (String(error.message).includes('already_has_pass')) return json({ error: 'already_has_pass' }, 409)
    console.error('redeem_bulk_code failed', error)
    return json({ error: 'server_error' }, 500)
  }
  if (result === 'already_has_pass') return json({ error: 'already_has_pass' }, 409)
  if (result !== 'ok') {
    logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'code_redeem_failed' })
    return json(GENERIC, 400)
  }

  await admin.from('notifications').insert({
    user_id: userId, type: 'warrior_pass_unlocked', title: 'Warrior Pass unlocked',
    message: 'Your code worked. Every lesson is now open for every child in your family.',
  })
  logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'code_redeemed' })
  return json({ ok: true })
})
