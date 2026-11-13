// Saves the family's delivery details (fresh parent PIN required), then ships every
// Armour Kit that was waiting for an address.
import { admin, clientIp, cors, getClaimsFrom, hitLimit, isRegisteredSession, json, logEvent, userAgent } from '../_shared/security.ts'
import { parseDelivery } from '../_shared/warrior-pass.ts'
import { verifyParentPin } from '../_shared/warrior-pass-server.ts'
import { shipWaitingKits } from '../_shared/warrior-rewards-server.ts'

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

  const limit = await hitLimit(`wp_delivery:${userId}`, 10, 15 * 60_000)
  if (limit.blocked) return json({ error: 'too_many', message: 'Too many attempts. Please wait a few minutes and try again.' }, 429)

  if (body?.consent !== true) return json({ error: 'consent_required' }, 400)
  const delivery = parseDelivery(body?.delivery)
  if (!delivery.ok) return json({ error: 'invalid_delivery', field: delivery.field }, 400)

  const pin = await verifyParentPin(userId, email, body?.pin, { ip, ua })
  if (!pin.ok) return json({ error: pin.error, message: pin.message }, pin.status)

  const now = new Date().toISOString()
  const { error } = await admin.from('delivery_profiles').upsert(
    { user_id: userId, ...delivery.value, consent_at: now, updated_at: now },
    { onConflict: 'user_id' },
  )
  if (error) return json({ error: 'server_error' }, 500)

  let shipped = 0
  try {
    shipped = await shipWaitingKits(userId)
  } catch (e) {
    console.error('shipWaitingKits failed', e)
    return json({ error: 'server_error' }, 500)
  }
  logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'delivery_saved', details: { kits_ready: shipped } })
  return json({ ok: true, kits_ready: shipped })
})
