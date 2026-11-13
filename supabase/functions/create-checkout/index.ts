// Warrior Pass checkout. action "quote" returns server prices and eligibility,
// action "checkout" verifies the parent PIN, creates or reuses a pending order
// and opens a Yoco hosted checkout. Prices are only ever computed here.
import { admin, clientIp, cors, getClaimsFrom, hitLimit, isRegisteredSession, json, logEvent, userAgent } from '../_shared/security.ts'
import { computeCheckout, parsePrices, quotePrices, sameOrderContents, type CheckoutKind } from '../_shared/warrior-pass.ts'
import { allowedReturnOrigin, isAdminUser, verifyParentPin, yocoConfig } from '../_shared/warrior-pass-server.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REUSE_MS = 15 * 60_000

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

type Delivery = {
  delivery_method: 'door' | 'locker'
  recipient_name: string
  phone: string
  address_line1: string | null
  address_line2: string | null
  suburb: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  locker_code: string | null
}

function parseDelivery(d: any): { ok: true; value: Delivery } | { ok: false; field: string } {
  if (!d || typeof d !== 'object') return { ok: false, field: 'delivery' }
  const method = d.method
  if (method !== 'door' && method !== 'locker') return { ok: false, field: 'method' }
  const recipient_name = str(d.recipient_name, 100)
  if (recipient_name.length < 2) return { ok: false, field: 'recipient_name' }
  const phone = str(d.phone, 30).replace(/[\s()-]/g, '')
  if (!/^\+?\d{9,15}$/.test(phone)) return { ok: false, field: 'phone' }
  if (method === 'locker') {
    const locker_code = str(d.locker_code, 40)
    if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,39}$/.test(locker_code)) return { ok: false, field: 'locker_code' }
    return { ok: true, value: { delivery_method: 'locker', recipient_name, phone, locker_code, address_line1: null, address_line2: null, suburb: null, city: null, province: null, postal_code: null } }
  }
  const address_line1 = str(d.address_line1, 200)
  const city = str(d.city, 100)
  const province = str(d.province, 60)
  const postal_code = str(d.postal_code, 10)
  if (address_line1.length < 3) return { ok: false, field: 'address_line1' }
  if (city.length < 2) return { ok: false, field: 'city' }
  if (province.length < 2) return { ok: false, field: 'province' }
  if (!/^\d{4}$/.test(postal_code)) return { ok: false, field: 'postal_code' }
  return {
    ok: true,
    value: {
      delivery_method: 'door', recipient_name, phone, address_line1, city, province, postal_code,
      address_line2: str(d.address_line2, 200) || null, suburb: str(d.suburb, 100) || null, locker_code: null,
    },
  }
}

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
  const action = body?.action
  if (action !== 'quote' && action !== 'checkout') return json({ error: 'invalid_action' }, 400)

  const [isAdmin, settingsRes] = await Promise.all([
    isAdminUser(userId),
    admin.from('app_settings').select('key, value').in('key', ['paywall_enabled', 'prices']),
  ])
  const settings = new Map((settingsRes.data ?? []).map((r) => [r.key, r.value]))
  // Shipped switched off: only admins (preview) can use checkout until the paywall is enabled.
  if (settings.get('paywall_enabled') !== true && !isAdmin) return json({ error: 'not_available' }, 403)

  const limit = action === 'quote'
    ? await hitLimit(`wp_quote:${userId}`, 60, 15 * 60_000)
    : await hitLimit(`wp_checkout:${userId}`, 10, 15 * 60_000)
  if (limit.blocked) return json({ error: 'too_many', message: 'Too many attempts. Please wait a few minutes and try again.' }, 429)

  const prices = parsePrices(settings.get('prices'))
  const [childrenRes, passRes, paidRes] = await Promise.all([
    admin.from('children').select('id, first_name').eq('parent_id', userId).order('created_at'),
    admin.from('entitlements').select('id, granted_at').eq('user_id', userId).eq('kind', 'family_pass').is('revoked_at', null).maybeSingle(),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('kind', 'family_pass').eq('status', 'paid'),
  ])
  if (childrenRes.error || passRes.error || paidRes.error) return json({ error: 'server_error' }, 500)
  const children = childrenRes.data ?? []
  const childIds = children.map((c) => c.id)
  const kitsRes = childIds.length
    ? await admin.from('armour_kits').select('child_id').in('child_id', childIds)
    : { data: [] as { child_id: string }[], error: null }
  if (kitsRes.error) return json({ error: 'server_error' }, 500)
  const withKits = (kitsRes.data ?? []).map((k) => k.child_id)
  const hasPass = !!passRes.data
  const paidCount = paidRes.count ?? 0
  const { configured, secretKey } = yocoConfig()

  if (action === 'quote') {
    if (!prices) return json({ error: 'prices_unavailable' }, 503)
    const { data: delivery } = await admin.from('delivery_profiles')
      .select('recipient_name, phone, delivery_method, address_line1, address_line2, suburb, city, province, postal_code, locker_code')
      .eq('user_id', userId).maybeSingle()
    return json({
      payments_configured: configured,
      has_pass: hasPass,
      pass_since: passRes.data?.granted_at ?? null,
      price: quotePrices(prices, paidCount),
      children: children.map((c) => ({ id: c.id, first_name: c.first_name, has_kit: withKits.includes(c.id) })),
      delivery: delivery ?? null,
    })
  }

  // ---------- checkout ----------
  if (!configured) return json({ error: 'payments_not_configured' }, 503)

  const kind = body?.kind as CheckoutKind
  const included = body?.included_kit_child_id ?? null
  const extras = Array.isArray(body?.extra_kit_child_ids) ? body.extra_kit_child_ids : []
  if ((included !== null && (typeof included !== 'string' || !UUID.test(included))) ||
      extras.length > 20 || !extras.every((x: unknown) => typeof x === 'string' && UUID.test(x))) {
    return json({ error: 'invalid_child' }, 400)
  }
  if (body?.consent !== true) return json({ error: 'consent_required' }, 400)
  const delivery = parseDelivery(body?.delivery)
  if (!delivery.ok) return json({ error: 'invalid_delivery', field: delivery.field }, 400)

  // Paying always needs a fresh parent PIN, admin accounts included.
  const pin = await verifyParentPin(userId, email, body?.pin, { ip, ua })
  if (!pin.ok) return json({ error: pin.error, message: pin.message }, pin.status)

  const result = computeCheckout(
    { kind, includedKitChildId: included, extraKitChildIds: extras },
    { prices, paidFamilyPassCount: paidCount, hasActivePass: hasPass, ownedChildIds: childIds, childrenWithKits: withKits },
  )
  if (!result.ok) return json({ error: result.error }, result.error === 'prices_unavailable' ? 503 : 400)

  const now = new Date().toISOString()
  const { error: dpError } = await admin.from('delivery_profiles').upsert(
    { user_id: userId, ...delivery.value, consent_at: now, updated_at: now },
    { onConflict: 'user_id' },
  )
  if (dpError) return json({ error: 'server_error' }, 500)

  // Double click protection: reuse a matching pending order from the last 15 minutes.
  const { data: recent } = await admin.from('orders')
    .select('id, kind, amount_cents, included_kit_child_id, extra_kit_child_ids, provider_checkout_id, metadata')
    .eq('user_id', userId).eq('status', 'pending')
    .gte('created_at', new Date(Date.now() - REUSE_MS).toISOString())
    .order('created_at', { ascending: false })
  const wanted = { kind: result.kind, amount_cents: result.amount_cents, included_kit_child_id: result.included_kit_child_id, extra_kit_child_ids: result.extra_kit_child_ids }
  const existing = (recent ?? []).find((o) => sameOrderContents(o, wanted))
  if (existing?.provider_checkout_id && typeof (existing.metadata as any)?.redirect_url === 'string') {
    return json({ redirectUrl: (existing.metadata as any).redirect_url, order_id: existing.id })
  }

  let orderId: string
  let metadata: Record<string, any>
  if (existing) {
    orderId = existing.id
    metadata = (existing.metadata as Record<string, any>) ?? {}
  } else {
    metadata = { lines: result.lines, launch_price: result.launch, return_origin: allowedReturnOrigin(req) }
    const { data: order, error } = await admin.from('orders').insert({
      user_id: userId,
      kind: result.kind,
      amount_cents: result.amount_cents,
      currency: result.currency,
      status: 'pending',
      provider: 'yoco',
      child_id: result.included_kit_child_id,
      included_kit_child_id: result.included_kit_child_id,
      extra_kit_child_ids: result.extra_kit_child_ids,
      metadata,
    }).select('id').single()
    if (error || !order) return json({ error: 'server_error' }, 500)
    orderId = order.id
  }

  const origin = typeof metadata.return_origin === 'string' ? metadata.return_origin : allowedReturnOrigin(req)
  const back = (state: string) => `${origin}/pass/return?order=${orderId}&state=${state}`
  const lines = Array.isArray(metadata.lines) ? metadata.lines : result.lines
  let yoco: Response
  try {
    yoco = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': orderId },
      body: JSON.stringify({
        amount: result.amount_cents,
        currency: 'ZAR',
        successUrl: back('success'),
        cancelUrl: back('cancelled'),
        failureUrl: back('failed'),
        metadata: { order_id: orderId, user_id: userId },
        externalId: orderId,
        lineItems: lines.map((l: any) => ({
          displayName: l.type === 'family_pass' ? 'Family Warrior Pass' : 'Extra Armour Kit',
          quantity: 1,
          pricingDetails: { price: l.amount_cents },
        })),
      }),
    })
  } catch (e) {
    console.error('yoco checkout request failed', e)
    return json({ error: 'checkout_failed', message: 'We could not open secure checkout. Please try again.' }, 502)
  }
  const text = await yoco.text()
  let data: any = {}
  try { data = JSON.parse(text) } catch { /* ignore */ }
  if (!yoco.ok || typeof data?.redirectUrl !== 'string' || typeof data?.id !== 'string') {
    console.error('yoco checkout error', yoco.status, text.slice(0, 500))
    return json({ error: 'checkout_failed', message: 'We could not open secure checkout. Please try again.' }, yoco.status === 409 ? 409 : 502)
  }

  await admin.from('orders').update({
    provider_checkout_id: data.id,
    metadata: { ...metadata, redirect_url: data.redirectUrl, processing_mode: data.processingMode ?? null },
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)
  logEvent({ user_id: userId, ip, user_agent: ua, event_type: 'checkout_created', details: { order_id: orderId, amount_cents: result.amount_cents } })

  return json({ redirectUrl: data.redirectUrl, order_id: orderId })
})
