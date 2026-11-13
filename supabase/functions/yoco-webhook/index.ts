// Yoco payment webhook. Public endpoint, no JWT: every request must carry a
// valid Standard Webhooks signature made with YOCO_WEBHOOK_SECRET.
// Idempotent through webhook_events. Fulfilment runs in one database transaction.
import { admin, json, logEvent } from '../_shared/security.ts'
import { verifyWebhookSignature } from '../_shared/warrior-pass.ts'
import { sendAppEmail, yocoConfig } from '../_shared/warrior-pass-server.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const rand = (cents: number) => `R${(cents / 100).toFixed(2)}`

async function findOrder(meta: Record<string, unknown>) {
  const cols = 'id, user_id, kind, amount_cents, currency, status, provider_checkout_id, included_kit_child_id, extra_kit_child_ids, metadata'
  if (typeof meta.order_id === 'string' && UUID.test(meta.order_id)) {
    const { data, error } = await admin.from('orders').select(cols).eq('id', meta.order_id).maybeSingle()
    if (error) throw error
    if (data) return data
  }
  if (typeof meta.checkoutId === 'string' && meta.checkoutId) {
    const { data, error } = await admin.from('orders').select(cols).eq('provider_checkout_id', meta.checkoutId).maybeSingle()
    if (error) throw error
    if (data) return data
  }
  return null
}

async function sendReceipt(order: any) {
  const [{ data: userRes }, { data: kids }] = await Promise.all([
    admin.auth.admin.getUserById(order.user_id),
    admin.from('children').select('id, first_name').eq('parent_id', order.user_id),
  ])
  const to = userRes?.user?.email
  if (!to) return
  const names = new Map((kids ?? []).map((k) => [k.id, k.first_name]))
  const lines: any[] = Array.isArray(order.metadata?.lines) ? order.metadata.lines : []
  const items = lines.map((l) => {
    const who = l.child_id ? names.get(l.child_id) : null
    const label = l.type === 'family_pass'
      ? `Family Warrior Pass${order.metadata?.launch_price ? ' (Founding Family price)' : ''}${who ? `, Armour Kit for ${who}` : ''}`
      : l.type === 'book'
        ? "Kiki's Armour of God, family library PDF"
        : `Extra Armour Kit${who ? ` for ${who}` : ''}`
    return { label, amount: rand(l.amount_cents) }
  })
  sendAppEmail({
    to,
    template: 'warrior-pass-receipt',
    idempotencyKey: `warrior-pass-receipt-${order.id}`,
    data: {
      orderNumber: `KW-${String(order.id).slice(0, 8).toUpperCase()}`,
      kind: order.kind,
      items,
      amount: rand(order.amount_cents),
      date: new Date().toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'long', year: 'numeric' }),
    },
  })
}

async function handleSucceeded(event: any) {
  const p = event?.payload ?? {}
  const meta = (p.metadata && typeof p.metadata === 'object') ? p.metadata : {}
  const order = await findOrder(meta)
  if (!order) {
    console.error('yoco webhook: order not found', event?.id)
    logEvent({ event_type: 'payment_order_not_found', details: { event_id: event?.id, payment_id: p.id ?? null } })
    return
  }
  const checkoutMismatch = typeof meta.checkoutId === 'string' && order.provider_checkout_id && meta.checkoutId !== order.provider_checkout_id
  if (checkoutMismatch || p.amount !== order.amount_cents || p.currency !== order.currency) {
    console.error('yoco webhook: amount, currency or checkout mismatch', order.id)
    logEvent({
      user_id: order.user_id, event_type: 'payment_mismatch',
      details: { order_id: order.id, event_id: event?.id, amount: p.amount ?? null, currency: p.currency ?? null },
    })
    return
  }
  const paymentId = typeof p.id === 'string' ? p.id : null
  const { data: newlyPaid, error } = await admin.rpc('fulfill_warrior_pass_order', { _order_id: order.id, _payment_id: paymentId })
  if (error) throw error
  if (newlyPaid === true) {
    logEvent({ user_id: order.user_id, event_type: 'payment_succeeded', details: { order_id: order.id, mode: p.mode ?? null } })
    await sendReceipt(order)
  }
}

async function handleFailed(event: any) {
  const p = event?.payload ?? {}
  const order = await findOrder((p.metadata && typeof p.metadata === 'object') ? p.metadata : {})
  if (!order) return
  const { error } = await admin.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', order.id).eq('status', 'pending')
  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const { configured, webhookSecret } = yocoConfig()
  if (!configured) return json({ error: 'payments_not_configured' }, 503)

  const raw = await req.text()
  const valid = await verifyWebhookSignature({
    secret: webhookSecret,
    id: req.headers.get('webhook-id'),
    timestamp: req.headers.get('webhook-timestamp'),
    signatureHeader: req.headers.get('webhook-signature'),
    body: raw,
  })
  if (!valid) return json({ error: 'invalid_signature' }, 401)

  let event: any
  try { event = JSON.parse(raw) } catch { return json({ error: 'invalid_body' }, 400) }
  const eventId = (typeof event?.id === 'string' && event.id) || req.headers.get('webhook-id')!
  const type = typeof event?.type === 'string' ? event.type : null

  const { error: insertError } = await admin.from('webhook_events').insert({ id: eventId, provider: 'yoco', type, payload: event })
  if (insertError) {
    if (insertError.code === '23505') return json({ ok: true, duplicate: true })
    console.error('webhook_events insert failed', insertError)
    return json({ error: 'server_error' }, 500)
  }

  try {
    if (type === 'payment.succeeded') await handleSucceeded(event)
    else if (type === 'payment.failed') await handleFailed(event)
    return json({ ok: true })
  } catch (e) {
    console.error('yoco webhook processing failed', e)
    // Let Yoco retry: forget the event so the retry is processed.
    await admin.from('webhook_events').delete().eq('id', eventId)
    return json({ error: 'server_error' }, 500)
  }
})
