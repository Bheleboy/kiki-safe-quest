// Warrior Pass admin actions. Built on the same pattern as admin-parent-reviews and
// admin-security: the caller's admin dashboard (SiteChecker) session is verified
// server-side, then every read and write uses the service role. Writes are audit logged.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { hitLimit } from '../_shared/security.ts'
import { sendAppEmail, yocoConfig } from '../_shared/warrior-pass-server.ts'
import { deliveryPointText } from '../_shared/warrior-rewards.ts'
import {
  batchCsv, cleanTrackingUrl, generateUniqueCodes, orderReference, parseBatchInput, planPaywallChange,
  referenceRange, SHIPPABLE_STATUSES, validateSettings, DEFAULT_BUSINESS_NAME, type RewardRow,
  orgBatchPrice, parseOrgBatchInput, planBatchStock, toCsv,
} from '../_shared/warrior-admin.ts'
import { isLowStock, parseDelivery, parseOrgTiers, parseStock, webhookIdKeyName, webhookSecretKeyName, yocoKeyMode } from '../_shared/warrior-pass.ts'
import { yocoPaymentsConfig } from '../_shared/warrior-pass-server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SITECHECKER_URL = 'https://cisoexddcgwkjzgacify.supabase.co'
const SITECHECKER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc29leGRkY2d3a2p6Z2FjaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjQ0MjMsImV4cCI6MjA5OTMwMDQyM30.c78uc4a8V03yztcuJ099eXb6eHtkQbyA8kg0vpk2rvo'
const KIKI_CLIENT_ID = '7a197200-b63e-4a04-80b7-6c3bdcfd93d7'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAGE_SIZE = 25
const ORDER_STATUSES = ['pending', 'paid', 'failed', 'cancelled', 'refunded']
const ORDER_KINDS = ['family_pass', 'extra_kit', 'book']
const EDITABLE_KEYS = ['gate_lessons', 'always_free_lessons', 'prices', 'library_book_path', 'receipt_business_name', 'support_email'] as const
// Stock is only written when the admin changed it, so a form loaded before a sale never puts sold kits back.
const STOCK_KEYS = ['kits_in_stock', 'pendant_sets_in_stock'] as const
const LIBRARY_BUCKET = 'family-library'
const BOOK_MAX_BYTES = 50 * 1024 * 1024
const BOOK_PATH = /^books\/kikis-armour-of-god-premium-edition-\d{14}\.pdf$/
const PENDING_SHIPMENT_STATUSES = ['draft', 'submitted', 'booked']

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const rand = (cents: number) => `R${(cents / 100).toFixed(2)}`
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const uuidList = (v: unknown, max = 200): string[] | null =>
  Array.isArray(v) && v.length <= max && v.every((x) => typeof x === 'string' && UUID.test(x)) ? (v as string[]) : null

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const token = req.headers.get('x-admin-token')
    if (!token) return json({ error: 'Missing admin token' }, 401)

    const sc = createClient(SITECHECKER_URL, SITECHECKER_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: userData, error: userErr } = await sc.auth.getUser(token)
    if (userErr || !userData?.user) return json({ error: 'Invalid admin token' }, 401)

    const { data: membership } = await sc
      .from('dashboard_user_clients')
      .select('client_id')
      .eq('user_id', userData.user.id)
      .eq('client_id', KIKI_CLIENT_ID)
      .maybeSingle()
    if (!membership) return json({ error: 'Forbidden' }, 403)
    const adminEmail = userData.user.email ?? 'unknown'

    let body: Record<string, any>
    try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    })

    const limit = await hitLimit(`admin_orders:${userData.user.id}`, 600, 15 * 60_000)
    if (limit.blocked) return json({ error: 'too_many', message: 'Too many requests. Please wait a few minutes.' }, 429)

    const log = (event_type: string, details: Record<string, unknown>, user_id: string | null = null) =>
      db.from('security_events').insert({ event_type, user_id, details: { ...details, admin_email: adminEmail } })

    /** Kiki profile of the signed-in admin, if they also have a Kiki account. Used for updated_by and created_by. */
    const adminProfileId = async (): Promise<string | null> => {
      if (!adminEmail.includes('@')) return null
      const { data } = await db.from('profiles').select('id').ilike('email', adminEmail).maybeSingle()
      return data?.id ?? null
    }

    const findUser = async (emailRaw: unknown) => {
      const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : ''
      if (!email || email.length > 255 || !email.includes('@')) return null
      const { data } = await db.from('profiles').select('id, email, first_name').ilike('email', email).maybeSingle()
      return data
    }

    /** Fetches rows by id in chunks so long id lists never hit URL limits. */
    const byIds = async (table: string, cols: string, col: string, ids: string[]): Promise<any[]> => {
      const unique = Array.from(new Set(ids.filter(Boolean)))
      const out: any[] = []
      for (let i = 0; i < unique.length; i += 150) {
        const { data, error } = await db.from(table).select(cols).in(col, unique.slice(i, i + 150))
        if (error) throw error
        out.push(...(data ?? []))
      }
      return out
    }

    const profilesMap = async (ids: string[]) =>
      new Map((await byIds('profiles', 'id, first_name, email', 'id', ids)).map((p) => [p.id, p]))

    const readSettings = async () => {
      const { data, error } = await db.from('app_settings').select('key, value, updated_at, updated_by')
      if (error) throw error
      return new Map((data ?? []).map((r) => [r.key, r]))
    }

    const paidPassCount = async () => {
      const { count, error } = await db.from('orders').select('id', { count: 'exact', head: true }).eq('kind', 'family_pass').eq('status', 'paid')
      if (error) throw error
      return count ?? 0
    }

    const action = body.action

    // ================= Orders =================
    if (action === 'list_orders') {
      let q = db.from('orders')
        .select('id, user_id, kind, amount_cents, currency, status, provider_checkout_id, created_at, paid_at', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (body.status) {
        if (!ORDER_STATUSES.includes(body.status)) return json({ error: 'Invalid status' }, 400)
        q = q.eq('status', body.status)
      }
      if (body.kind) {
        if (!ORDER_KINDS.includes(body.kind)) return json({ error: 'Invalid kind' }, 400)
        q = q.eq('kind', body.kind)
      }
      if (body.from) {
        if (!isDate(body.from)) return json({ error: 'Invalid date' }, 400)
        q = q.gte('created_at', `${body.from}T00:00:00Z`)
      }
      if (body.to) {
        if (!isDate(body.to)) return json({ error: 'Invalid date' }, 400)
        q = q.lt('created_at', new Date(Date.parse(`${body.to}T00:00:00Z`) + 864e5).toISOString())
      }
      const search = typeof body.search === 'string' ? body.search.trim().slice(0, 200) : ''
      if (search) {
        const range = referenceRange(search)
        if (UUID.test(search)) q = q.eq('id', search.toLowerCase())
        else if (range) q = q.gte('id', range.from).lte('id', range.to)
        else {
          const term = search.replace(/[%_,()\\]/g, '')
          if (term.length < 2) return json({ rows: [], total: 0, page: 0, page_size: PAGE_SIZE })
          const { data: matches } = await db.from('profiles').select('id').ilike('email', `%${term}%`).limit(100)
          const ids = (matches ?? []).map((m) => m.id)
          if (!ids.length) return json({ rows: [], total: 0, page: 0, page_size: PAGE_SIZE })
          q = q.in('user_id', ids)
        }
      }
      const page = Number.isInteger(body.page) && body.page >= 0 && body.page < 10000 ? body.page : 0
      const { data, count, error } = await q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      if (error) return json({ error: 'Query failed' }, 500)
      const people = await profilesMap((data ?? []).map((o) => o.user_id))
      const rows = (data ?? []).map((o) => ({
        ...o,
        reference: orderReference(o.id),
        parent_name: people.get(o.user_id)?.first_name ?? null,
        parent_email: people.get(o.user_id)?.email ?? null,
      }))
      return json({ rows, total: count ?? 0, page, page_size: PAGE_SIZE })
    }

    if (action === 'order_detail') {
      if (typeof body.order_id !== 'string' || !UUID.test(body.order_id)) return json({ error: 'Invalid input' }, 400)
      const { data: order } = await db.from('orders').select('*').eq('id', body.order_id).maybeSingle()
      if (!order) return json({ error: 'Not found' }, 404)
      const checkoutId = typeof order.provider_checkout_id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(order.provider_checkout_id)
        ? order.provider_checkout_id : null
      const eventFilter = [`payload->payload->metadata->>order_id.eq.${order.id}`]
      if (checkoutId) eventFilter.push(`payload->payload->metadata->>checkoutId.eq.${checkoutId}`)
      const [{ data: profile }, { data: kids }, { data: ents }, { data: kits }, { data: events }] = await Promise.all([
        db.from('profiles').select('first_name, email').eq('id', order.user_id).maybeSingle(),
        db.from('children').select('id, first_name').eq('parent_id', order.user_id),
        db.from('entitlements').select('id, kind, source, granted_at, revoked_at').eq('order_id', order.id),
        db.from('armour_kits').select('id, child_id, status, included_in_pass').eq('order_id', order.id),
        db.from('webhook_events').select('id, type, received_at, payload').or(eventFilter.join(',')).order('received_at', { ascending: true }).limit(50),
      ])
      const names = new Map((kids ?? []).map((k) => [k.id, k.first_name]))
      const { secretKey } = yocoConfig()
      return json({
        order: { ...order, reference: orderReference(order.id) },
        parent: profile ?? null,
        entitlements: ents ?? [],
        kits: (kits ?? []).map((k) => ({ ...k, child_name: names.get(k.child_id) ?? null })),
        events: (events ?? []).map((e) => ({
          id: e.id, type: e.type, received_at: e.received_at,
          amount: (e.payload as any)?.payload?.amount ?? null,
          status: (e.payload as any)?.payload?.status ?? null,
          mode: (e.payload as any)?.payload?.mode ?? null,
        })),
        refunds_available: secretKey.startsWith('sk_live_'),
      })
    }

    if (action === 'refund_order') {
      if (typeof body.order_id !== 'string' || !UUID.test(body.order_id)) return json({ error: 'Invalid input' }, 400)
      const { secretKey } = yocoConfig()
      if (!secretKey.startsWith('sk_live_')) {
        return json({ error: 'refunds_not_available', message: 'Refunds are only available once a live Yoco key is set up. Test payments cannot be refunded here.' }, 409)
      }
      const { data: order } = await db.from('orders').select('*').eq('id', body.order_id).maybeSingle()
      if (!order) return json({ error: 'Not found' }, 404)
      const ref = orderReference(order.id)
      if (body.confirm !== ref) return json({ error: 'confirmation_mismatch', message: `Type ${ref} to confirm the refund.` }, 400)
      if (order.status !== 'paid' || !order.provider_checkout_id) return json({ error: 'not_refundable', message: 'Only paid orders can be refunded.' }, 409)
      const refundLimit = await hitLimit(`admin_refund:${userData.user.id}`, 10, 60 * 60_000)
      if (refundLimit.blocked) return json({ error: 'too_many', message: 'Too many refunds in a short time. Please wait.' }, 429)

      let res: Response
      try {
        res = await fetch(`https://payments.yoco.com/api/checkouts/${encodeURIComponent(order.provider_checkout_id)}/refund`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `refund-${order.id}` },
          body: JSON.stringify({ metadata: { order_id: order.id } }),
        })
      } catch (e) {
        console.error('yoco refund request failed', e)
        return json({ error: 'refund_failed', message: 'Could not reach Yoco. Please try again.' }, 502)
      }
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch { /* ignore */ }
      if (!res.ok || (data?.status && data.status !== 'successful')) {
        console.error('yoco refund error', res.status, text.slice(0, 500))
        await log('admin_wp_refund_failed', { order_id: order.id, http_status: res.status }, order.user_id)
        return json({ error: 'refund_failed', message: typeof data?.message === 'string' ? data.message.slice(0, 200) : 'Yoco did not accept the refund.' }, 502)
      }
      const nowIso = new Date().toISOString()
      await db.from('orders').update({
        status: 'refunded', updated_at: nowIso,
        metadata: { ...(order.metadata ?? {}), refund: { id: data?.refundId ?? data?.id ?? null, at: nowIso, by: adminEmail } },
      }).eq('id', order.id).eq('status', 'paid')
      await db.from('entitlements').update({ revoked_at: nowIso }).eq('order_id', order.id).is('revoked_at', null)
      await db.from('notifications').insert({
        user_id: order.user_id, type: 'warrior_pass_refunded', title: 'Refund processed',
        message: `We have refunded order ${ref}. Card refunds usually reach your account within 5 to 10 working days.`,
        related_id: order.id,
      })
      const { data: u } = await db.auth.admin.getUserById(order.user_id)
      if (u?.user?.email) {
        sendAppEmail({
          to: u.user.email, template: 'order-refunded', idempotencyKey: `order-refunded-${order.id}`,
          data: { orderNumber: ref, amount: rand(order.amount_cents), kind: order.kind },
        })
      }
      await log('admin_wp_refund', { order_id: order.id, amount_cents: order.amount_cents }, order.user_id)
      return json({ ok: true })
    }

    // ================= Rewards =================
    if (action === 'list_rewards') {
      const { data: kits, error } = await db.from('armour_kits')
        .select('id, user_id, child_id, order_id, included_in_pass, status, earned_at, created_at')
        .neq('status', 'locked').order('earned_at', { ascending: false, nullsFirst: false }).limit(2000)
      if (error) return json({ error: 'Query failed' }, 500)
      const { count: lockedCount } = await db.from('armour_kits').select('id', { count: 'exact', head: true }).eq('status', 'locked')
      const list = kits ?? []
      const [ships, kids, people, deliveries, orders] = await Promise.all([
        byIds('shipments', '*', 'kit_id', list.map((k) => k.id)),
        byIds('children', 'id, first_name', 'id', list.map((k) => k.child_id)),
        profilesMap(list.map((k) => k.user_id)),
        byIds('delivery_profiles', 'user_id, recipient_name, phone, delivery_method, address_line1, address_line2, suburb, city, province, postal_code, locker_code', 'user_id', list.map((k) => k.user_id)),
        byIds('orders', 'id, status', 'id', list.map((k) => k.order_id).filter(Boolean)),
      ])
      const shipFor = new Map(ships.map((s) => [s.kit_id, s]))
      const bonuses = await byIds('bonus_awards', 'id, shipment_id, status', 'shipment_id', ships.map((s) => s.id))
      const bonusCount = new Map<string, number>()
      for (const b of bonuses) if (b.status === 'added_to_shipment') bonusCount.set(b.shipment_id, (bonusCount.get(b.shipment_id) ?? 0) + 1)
      const kidName = new Map(kids.map((c) => [c.id, c.first_name]))
      const dpFor = new Map(deliveries.map((d) => [d.user_id, d]))
      const orderStatus = new Map(orders.map((o) => [o.id, o.status]))
      const rows = list.map((k) => {
        const s = shipFor.get(k.id)
        const d = s ?? dpFor.get(k.user_id) ?? null
        const p = people.get(k.user_id)
        return {
          group_id: s?.shipment_group_id ?? `kit-${k.id}`,
          kit_id: k.id,
          shipment_id: s?.id ?? null,
          user_id: k.user_id,
          parent_name: p?.first_name ?? null,
          parent_email: p?.email ?? null,
          child_name: kidName.get(k.child_id) ?? null,
          recipient_name: d?.recipient_name ?? null,
          phone: d?.phone ?? null,
          delivery_method: d?.delivery_method ?? null,
          locker_code: d?.locker_code ?? null,
          address_line1: d?.address_line1 ?? null,
          address_line2: d?.address_line2 ?? null,
          suburb: d?.suburb ?? null,
          city: d?.city ?? null,
          province: d?.province ?? null,
          postal_code: d?.postal_code ?? null,
          delivery_point: deliveryPointText(d),
          shipment_status: s?.status ?? null,
          kit_status: k.status,
          courier: s?.courier ?? null,
          waybill: s?.waybill ?? null,
          tracking_url: s?.tracking_url ?? null,
          shipped_at: s?.shipped_at ?? null,
          delivered_at: s?.delivered_at ?? null,
          earned_at: k.earned_at,
          order_status: k.order_id ? orderStatus.get(k.order_id) ?? null : null,
          bonus_pendants: s ? bonusCount.get(s.id) ?? 0 : 0,
        } satisfies RewardRow & Record<string, unknown>
      })
      const groups = new Map<string, typeof rows>()
      for (const r of rows) groups.set(r.group_id, [...(groups.get(r.group_id) ?? []), r])
      return json({ groups: Array.from(groups.entries()).map(([group_id, items]) => ({ group_id, items })), locked_count: lockedCount ?? 0 })
    }

    if (action === 'mark_shipped' || action === 'mark_delivered') {
      const ids = body.shipment_ids === undefined ? [] : uuidList(body.shipment_ids)
      const groupId = typeof body.group_id === 'string' && UUID.test(body.group_id) ? body.group_id : null
      if (ids === null || (!ids.length && !groupId)) return json({ error: 'Invalid input' }, 400)
      const allowed = action === 'mark_shipped' ? SHIPPABLE_STATUSES : [...SHIPPABLE_STATUSES, 'in_transit']
      let sel = db.from('shipments').select('id, kit_id, user_id, shipment_group_id, status').in('status', allowed)
      sel = groupId && ids.length ? sel.or(`shipment_group_id.eq.${groupId},id.in.(${ids.join(',')})`)
        : groupId ? sel.eq('shipment_group_id', groupId) : sel.in('id', ids)
      const { data: targets, error: tErr } = await sel
      if (tErr) return json({ error: 'Query failed' }, 500)
      if (!targets?.length) return json({ error: 'nothing_to_update', message: 'No shipments in this group can be updated.' }, 404)
      const nowIso = new Date().toISOString()
      const shipmentIds = targets.map((t) => t.id)
      const kitIds = targets.map((t) => t.kit_id)

      let patch: Record<string, unknown>
      let courier = '', waybill = '', trackingUrl: string | null = null
      if (action === 'mark_shipped') {
        courier = typeof body.courier === 'string' ? body.courier.trim().slice(0, 60) : ''
        waybill = typeof body.waybill === 'string' ? body.waybill.trim().slice(0, 60) : ''
        const url = cleanTrackingUrl(body.tracking_url)
        if (courier.length < 2) return json({ error: 'invalid_courier', message: 'Enter the courier name.' }, 400)
        if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,59}$/.test(waybill)) return json({ error: 'invalid_waybill', message: 'Enter a valid waybill number.' }, 400)
        if (url === false) return json({ error: 'invalid_tracking_url', message: 'The tracking link must start with https://' }, 400)
        trackingUrl = url

        // EXTENSION POINT (Courier Guy): automatic booking will plug in here later. A future
        // bookCourierGuyShipment(targets) would create the booking, return the waybill and
        // tracking link, and set shipments.status to 'booked' before this update runs.
        // No courier API calls are made yet; admins enter courier, waybill and link by hand.

        // shipments.status has no 'shipped' value, so a sent parcel is stored as 'in_transit' with shipped_at.
        patch = { status: 'in_transit', courier, waybill, tracking_url: trackingUrl, shipped_at: nowIso, updated_at: nowIso }
      } else {
        patch = { status: 'delivered', delivered_at: nowIso, updated_at: nowIso }
      }
      const { data: updated, error: uErr } = await db.from('shipments').update(patch).in('id', shipmentIds).in('status', allowed).select('id, kit_id, user_id')
      if (uErr) return json({ error: 'Update failed' }, 500)
      const done = updated ?? []
      const kitStatus = action === 'mark_shipped' ? 'shipped' : 'delivered'
      const fromKit = action === 'mark_shipped' ? ['earned', 'address_needed', 'ready_to_ship'] : ['earned', 'address_needed', 'ready_to_ship', 'shipped']
      await db.from('armour_kits').update({ status: kitStatus }).in('id', done.map((d) => d.kit_id)).in('status', fromKit)

      const kitRows = await byIds('armour_kits', 'id, child_id', 'id', kitIds)
      const kids = new Map((await byIds('children', 'id, first_name', 'id', kitRows.map((k) => k.child_id))).map((c) => [c.id, c.first_name]))
      const childOfKit = new Map(kitRows.map((k) => [k.id, { id: k.child_id, name: kids.get(k.child_id) ?? 'Your child' }]))
      if (done.length) {
        await db.from('notifications').insert(done.map((d) => {
          const c = childOfKit.get(d.kit_id)
          return action === 'mark_shipped'
            ? { user_id: d.user_id, child_id: c?.id ?? null, related_id: d.kit_id, type: 'armour_kit_shipped',
                title: `${c?.name ?? 'Your child'}'s Armour Kit has shipped`,
                message: `It is on its way with ${courier}. Tracking number: ${waybill}.` }
            : { user_id: d.user_id, child_id: c?.id ?? null, related_id: d.kit_id, type: 'armour_kit_delivered',
                title: `${c?.name ?? 'Your child'}'s Armour Kit was delivered`,
                message: 'The courier has marked the parcel as delivered. Enjoy it together.' }
        }))
      }
      if (action === 'mark_shipped') {
        const byParent = new Map<string, string[]>()
        for (const d of done) byParent.set(d.user_id, [...(byParent.get(d.user_id) ?? []), childOfKit.get(d.kit_id)?.name ?? 'Your child'])
        for (const [userId, childNames] of byParent) {
          const { data: u } = await db.auth.admin.getUserById(userId)
          if (!u?.user?.email) continue
          sendAppEmail({
            to: u.user.email, template: 'reward-shipped',
            idempotencyKey: `reward-shipped-${userId.slice(0, 8)}-${waybill.replace(/\s/g, '')}`,
            data: { childNames, courier, waybill, trackingUrl },
          })
        }
      }
      await log(action === 'mark_shipped' ? 'admin_wp_shipped' : 'admin_wp_delivered', { shipment_ids: done.map((d) => d.id), group_id: groupId, waybill: waybill || undefined })
      return json({ ok: true, updated: done.length })
    }

    // ================= Settings =================
    if (action === 'get_settings') {
      const s = await readSettings()
      const v = (k: string) => s.get(k)?.value ?? null
      const updated = Object.fromEntries(Array.from(s.entries()).map(([k, r]) => [k, { updated_at: r.updated_at, updated_by: r.updated_by }]))
      return json({
        settings: {
          paywall_enabled: v('paywall_enabled') === true,
          grandfather_before: typeof v('grandfather_before') === 'string' ? v('grandfather_before') : null,
          gate_lessons: v('gate_lessons'),
          always_free_lessons: v('always_free_lessons') ?? [],
          prices: v('prices'),
          library_book_path: typeof v('library_book_path') === 'string' ? v('library_book_path') : null,
          receipt_business_name: typeof v('receipt_business_name') === 'string' ? v('receipt_business_name') : DEFAULT_BUSINESS_NAME,
          support_email: typeof v('support_email') === 'string' ? v('support_email') : null,
          kits_in_stock: parseStock(v('kits_in_stock')),
          pendant_sets_in_stock: parseStock(v('pendant_sets_in_stock')),
          maintenance_mode: v('maintenance_mode') === true,
        },
        maintenance_signups: (await db.from('maintenance_signups').select('id', { count: 'exact', head: true })).count ?? 0,
        low_stock: {
          kits: isLowStock(parseStock(v('kits_in_stock'))),
          pendants: isLowStock(parseStock(v('pendant_sets_in_stock'))),
        },
        updated,
        paid_family_passes: await paidPassCount(),
      })
    }

    if (action === 'update_settings') {
      const result = validateSettings(body.settings)
      if (!result.ok) return json({ error: result.error, field: result.field }, 400)
      const current = await readSettings()
      const by = await adminProfileId()
      const nowIso = new Date().toISOString()
      const changed: string[] = []
      const keys = [...EDITABLE_KEYS, ...STOCK_KEYS.filter((k) => result.value[k] !== undefined)]
      for (const key of keys) {
        const value = result.value[key]
        if (JSON.stringify(current.get(key)?.value ?? null) === JSON.stringify(value)) continue
        const { error } = await db.from('app_settings').upsert({ key, value, updated_at: nowIso, updated_by: by }, { onConflict: 'key' })
        if (error) return json({ error: 'Update failed' }, 500)
        changed.push(key)
      }
      if (changed.length) await log('admin_wp_settings', { changed, values: Object.fromEntries(changed.map((k) => [k, (result.value as unknown as Record<string, unknown>)[k]])) })
      return json({ ok: true, changed })
    }

    if (action === 'set_paywall') {
      if (typeof body.enabled !== 'boolean') return json({ error: 'Invalid input' }, 400)
      const expected = body.enabled ? 'TURN ON' : 'TURN OFF'
      if (body.confirm !== expected) return json({ error: 'confirmation_mismatch', message: `Type ${expected} to confirm.` }, 400)
      const s = await readSettings()
      const gfRow = s.get('grandfather_before')
      const current = typeof gfRow?.value === 'string' ? gfRow.value : null
      const plan = planPaywallChange(body.enabled, current, new Date())
      const by = await adminProfileId()
      const nowIso = new Date().toISOString()
      let grandfather = plan.grandfather_before
      if (plan.set_grandfather) {
        // Set it only if nobody set it in the meantime, so it can never move once set.
        let q = db.from('app_settings').update({ value: plan.grandfather_before, updated_at: nowIso, updated_by: by }).eq('key', 'grandfather_before')
        if (gfRow?.updated_at) q = q.eq('updated_at', gfRow.updated_at)
        const { data: setRows, error } = gfRow
          ? await q.select('key')
          : await db.from('app_settings').insert({ key: 'grandfather_before', value: plan.grandfather_before, updated_at: nowIso, updated_by: by }).select('key')
        if (error && error.code !== '23505') return json({ error: 'Update failed' }, 500)
        if (!setRows?.length) {
          const again = await readSettings()
          grandfather = typeof again.get('grandfather_before')?.value === 'string' ? again.get('grandfather_before')!.value : null
          if (!grandfather) return json({ error: 'Update failed' }, 500)
        }
      }
      const { error: pErr } = await db.from('app_settings').upsert({ key: 'paywall_enabled', value: plan.paywall_enabled, updated_at: nowIso, updated_by: by }, { onConflict: 'key' })
      if (pErr) return json({ error: 'Update failed' }, 500)
      await log('admin_wp_paywall', { enabled: plan.paywall_enabled, grandfather_before: grandfather, grandfather_set_now: plan.set_grandfather })
      return json({ ok: true, paywall_enabled: plan.paywall_enabled, grandfather_before: grandfather })
    }

    // ================= Support =================
    if (action === 'grant_pass') {
      const p = await findUser(body.email)
      if (!p) return json({ error: 'Account not found' }, 404)
      const { data: existing } = await db.from('entitlements').select('id, revoked_at').eq('user_id', p.id).eq('kind', 'family_pass').maybeSingle()
      const nowIso = new Date().toISOString()
      if (existing && !existing.revoked_at) return json({ error: 'already_has_pass', message: 'This family already has an active Warrior Pass.' }, 409)
      const { error } = existing
        ? await db.from('entitlements').update({ source: 'admin_grant', revoked_at: null, granted_at: nowIso, order_id: null, bulk_code_id: null }).eq('id', existing.id)
        : await db.from('entitlements').insert({ user_id: p.id, kind: 'family_pass', source: 'admin_grant' })
      if (error) return json({ error: 'Update failed' }, 500)
      await db.from('notifications').insert({
        user_id: p.id, type: 'warrior_pass_unlocked', title: 'Warrior Pass unlocked',
        message: 'Every lesson is now open for every child in your family.',
      })
      await log('admin_wp_grant_pass', {}, p.id)
      return json({ ok: true, email: p.email })
    }

    if (action === 'revoke_pass') {
      const p = await findUser(body.email)
      if (!p) return json({ error: 'Account not found' }, 404)
      const { data: existing } = await db.from('entitlements').select('id, source').eq('user_id', p.id).eq('kind', 'family_pass').is('revoked_at', null).maybeSingle()
      if (!existing) return json({ error: 'no_pass', message: 'This family has no active Warrior Pass.' }, 404)
      // Paid passes are only taken away through a refund, never silently.
      if (existing.source === 'purchase') return json({ error: 'purchased_pass', message: 'This pass was paid for. Use a refund on the Orders tab instead.' }, 409)
      const { error } = await db.from('entitlements').update({ revoked_at: new Date().toISOString() }).eq('id', existing.id)
      if (error) return json({ error: 'Update failed' }, 500)
      await log('admin_wp_revoke_pass', { source: existing.source }, p.id)
      return json({ ok: true, email: p.email })
    }

    if (action === 'stats') {
      const s = await readSettings()
      const limitValue = (s.get('prices')?.value as any)?.launch_limit
      const launchLimit = Number.isInteger(limitValue) && limitValue >= 0 ? limitValue : 0
      const [paidCount, paidRes, gateRes] = await Promise.all([
        paidPassCount(),
        db.from('orders').select('user_id, kind, amount_cents').eq('status', 'paid').limit(100000),
        db.from('notifications').select('user_id').eq('type', 'warrior_pass_ready').limit(100000),
      ])
      if (paidRes.error || gateRes.error) return json({ error: 'Query failed' }, 500)
      const paid = paidRes.data ?? []
      const passPayers = new Set(paid.filter((o) => o.kind === 'family_pass').map((o) => o.user_id))
      const gateFamilies = new Set((gateRes.data ?? []).map((n) => n.user_id))
      const gateThenPaid = Array.from(gateFamilies).filter((u) => passPayers.has(u)).length
      return json({
        paid_passes: paidCount,
        launch_limit: launchLimit,
        founding_places_left: Math.max(0, launchLimit - paidCount),
        revenue_cents: paid.reduce((sum, o) => sum + (o.amount_cents || 0), 0),
        children_reached_gate: gateRes.data?.length ?? 0,
        families_reached_gate: gateFamilies.size,
        families_paid_after_gate: gateThenPaid,
      })
    }

    // ================= Bulk codes =================
    /** Inserts `seats` unique codes for a batch. Throws on failure. */
    const generateCodesFor = async (batchId: string, seats: number) => {
      let remaining = seats
      const taken = new Set<string>()
      let attempts = 0
      while (remaining > 0) {
        if (++attempts > 20) throw new Error('too_many_collisions')
        const chunk = generateUniqueCodes(Math.min(remaining, 500), taken)
        const { data: clashes } = await db.from('bulk_codes').select('code').in('code', chunk.slice(0, 250))
        const { data: clashes2 } = chunk.length > 250 ? await db.from('bulk_codes').select('code').in('code', chunk.slice(250)) : { data: [] }
        const clash = new Set([...(clashes ?? []), ...(clashes2 ?? [])].map((c) => c.code))
        const fresh = chunk.filter((c) => !clash.has(c))
        chunk.forEach((c) => taken.add(c))
        if (!fresh.length) continue
        const { error: insErr } = await db.from('bulk_codes').insert(fresh.map((code) => ({ batch_id: batchId, code })))
        if (insErr) {
          if (insErr.code === '23505') continue
          throw insErr
        }
        remaining -= fresh.length
      }
    }

    const kitsShort = (short: number) => json({
      error: 'kits_short', short,
      message: `There are not enough Armour Kits in stock: ${short} short. Tick "Kits will ship after restock" to continue.`,
    }, 409)

    if (action === 'org_quote') {
      const learners = Number(body.learners)
      const s = await readSettings()
      const tiers = parseOrgTiers((s.get('prices')?.value as any)?.org_tiers)
      const price = orgBatchPrice(tiers, learners)
      const stock = parseStock(s.get('kits_in_stock')?.value ?? null)
      return json({
        per_learner_cents: price.ok ? price.per_learner_cents : null,
        amount_cents: price.ok ? price.amount_cents : null,
        kits_in_stock: stock,
        short: stock !== null && Number.isInteger(learners) && learners > stock ? learners - stock : 0,
      })
    }

    if (action === 'create_batch') {
      const parsed = parseOrgBatchInput(body)
      if (!parsed.ok) return json({ error: parsed.error }, 400)
      const v = parsed.value
      let address: Record<string, string | null> | null = null
      if (v.kits_included) {
        const d = parseDelivery({ ...(body.delivery ?? {}), method: 'door' })
        if (!d.ok) return json({ error: 'invalid_delivery', field: d.field }, 400)
        const { delivery_method: _m, locker_code: _l, ...rest } = d.value
        address = rest
      }
      const settings = await readSettings()
      const tiers = parseOrgTiers((settings.get('prices')?.value as any)?.org_tiers)
      const price = orgBatchPrice(tiers, v.seats, v.price_override_cents, v.price_override_reason)
      if (!price.ok) return json({ error: price.error }, 400)
      const stock = parseStock(settings.get('kits_in_stock')?.value ?? null)
      const plan = v.kits_included ? planBatchStock(stock, v.seats, v.allow_backorder) : { ok: true as const, takeNow: false, waiting: false, short: 0 }
      if (!plan.ok) return kitsShort(plan.short)

      const by = await adminProfileId()
      const { data: batch, error } = await db.from('bulk_code_batches').insert({
        name: v.name, organisation: v.organisation, seats: v.seats, expires_at: v.expires_at, notes: v.notes, created_by: by,
        contact_name: v.contact_name, contact_email: v.contact_email, contact_phone: v.contact_phone,
        price_per_learner_cents: price.per_learner_cents, amount_cents: price.amount_cents,
        payment_reference: v.payment_reference, price_override_reason: v.price_override_reason, kits_included: v.kits_included,
      }).select('id').single()
      if (error || !batch) return json({ error: 'Create failed' }, 500)
      let waiting = false
      try {
        await generateCodesFor(batch.id, v.seats)
        if (v.kits_included && address) {
          const { data: ship, error: shipErr } = await db.from('org_shipments').insert({
            batch_id: batch.id, quantity: v.seats, ...address, status: 'draft', waiting_for_restock: plan.waiting,
          }).select('id').single()
          if (shipErr || !ship) throw shipErr ?? new Error('shipment_failed')
          waiting = plan.waiting
          if (plan.takeNow) {
            const { data: taken, error: takeErr } = await db.rpc('take_org_shipment_stock', { _shipment_id: ship.id })
            if (takeErr) throw takeErr
            if (taken === 'short') {
              // Stock changed since the form was checked.
              if (!v.allow_backorder) {
                await db.from('bulk_code_batches').delete().eq('id', batch.id)
                return kitsShort(Math.max(1, v.seats - (parseStock((await readSettings()).get('kits_in_stock')?.value ?? null) ?? 0)))
              }
              await db.from('org_shipments').update({ waiting_for_restock: true, updated_at: new Date().toISOString() }).eq('id', ship.id)
              waiting = true
            }
          }
        }
      } catch (e) {
        console.error('bulk batch creation failed', e)
        await db.from('bulk_code_batches').delete().eq('id', batch.id)
        return json({ error: 'Create failed' }, 500)
      }
      await log('admin_wp_batch_created', {
        batch_id: batch.id, seats: v.seats, name: v.name, kits_included: v.kits_included, waiting_for_restock: waiting,
        price_per_learner_cents: price.per_learner_cents, overridden: price.overridden,
      })
      return json({ ok: true, batch_id: batch.id, waiting_for_restock: waiting })
    }

    // ================= Organisation deliveries =================
    if (action === 'list_org_shipments') {
      const [{ data: ships, error }, settings] = await Promise.all([
        db.from('org_shipments').select('*').order('created_at', { ascending: false }).limit(500),
        readSettings(),
      ])
      if (error) return json({ error: 'Query failed' }, 500)
      const batches = await byIds('bulk_code_batches', 'id, name, organisation, contact_name, contact_email, contact_phone', 'id', (ships ?? []).map((x) => x.batch_id))
      const bFor = new Map(batches.map((b) => [b.id, b]))
      return json({
        kits_in_stock: parseStock(settings.get('kits_in_stock')?.value ?? null),
        rows: (ships ?? []).map((x) => {
          const b = bFor.get(x.batch_id)
          return {
            ...x, batch_name: b?.name ?? null, organisation: b?.organisation ?? null,
            contact_name: b?.contact_name ?? null, contact_email: b?.contact_email ?? null, contact_phone: b?.contact_phone ?? null,
          }
        }),
      })
    }

    if (action === 'org_mark_packed' || action === 'org_mark_sent' || action === 'org_mark_delivered') {
      if (typeof body.id !== 'string' || !UUID.test(body.id)) return json({ error: 'Invalid input' }, 400)
      const { data: ship } = await db.from('org_shipments').select('*').eq('id', body.id).maybeSingle()
      if (!ship) return json({ error: 'Not found' }, 404)
      const nowIso = new Date().toISOString()
      if (action === 'org_mark_packed') {
        if (ship.status !== 'draft') return json({ error: 'bad_status', message: 'Only parcels that are not packed yet can be marked packed.' }, 409)
        if (!ship.stock_taken) {
          const { data: taken, error: takeErr } = await db.rpc('take_org_shipment_stock', { _shipment_id: ship.id })
          if (takeErr) return json({ error: 'Update failed' }, 500)
          if (taken === 'short') {
            const stock = parseStock((await readSettings()).get('kits_in_stock')?.value ?? null) ?? 0
            return json({ error: 'kits_short', short: ship.quantity - stock, message: `Not enough Armour Kits in stock to pack this parcel: ${ship.quantity - stock} short. Update the stock in Settings after restocking.` }, 409)
          }
        }
        const { error } = await db.from('org_shipments').update({ status: 'packed', waiting_for_restock: false, updated_at: nowIso }).eq('id', ship.id).eq('status', 'draft')
        if (error) return json({ error: 'Update failed' }, 500)
        await log('admin_wp_org_packed', { shipment_id: ship.id, quantity: ship.quantity })
        return json({ ok: true })
      }
      if (action === 'org_mark_sent') {
        if (ship.status !== 'packed') return json({ error: 'bad_status', message: 'Mark the parcel packed first.' }, 409)
        const courier = typeof body.courier === 'string' ? body.courier.trim().slice(0, 60) : ''
        const waybill = typeof body.waybill === 'string' ? body.waybill.trim().slice(0, 60) : ''
        const url = cleanTrackingUrl(body.tracking_url)
        if (courier.length < 2) return json({ error: 'invalid_courier', message: 'Enter the courier name.' }, 400)
        if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,59}$/.test(waybill)) return json({ error: 'invalid_waybill', message: 'Enter a valid waybill number.' }, 400)
        if (url === false) return json({ error: 'invalid_tracking_url', message: 'The tracking link must start with https://' }, 400)
        const { error } = await db.from('org_shipments').update({ status: 'in_transit', courier, waybill, tracking_url: url, shipped_at: nowIso, updated_at: nowIso }).eq('id', ship.id).eq('status', 'packed')
        if (error) return json({ error: 'Update failed' }, 500)
        await log('admin_wp_org_sent', { shipment_id: ship.id, waybill })
        return json({ ok: true })
      }
      if (ship.status !== 'in_transit') return json({ error: 'bad_status', message: 'Only sent parcels can be marked delivered.' }, 409)
      const { error } = await db.from('org_shipments').update({ status: 'delivered', delivered_at: nowIso, updated_at: nowIso }).eq('id', ship.id).eq('status', 'in_transit')
      if (error) return json({ error: 'Update failed' }, 500)
      await log('admin_wp_org_delivered', { shipment_id: ship.id })
      return json({ ok: true })
    }

    // ================= Maintenance mode =================
    if (action === 'set_maintenance') {
      if (typeof body.enabled !== 'boolean' || body.confirm !== true) return json({ error: 'Invalid input' }, 400)
      const { error } = await db.from('app_settings').upsert(
        { key: 'maintenance_mode', value: body.enabled, updated_at: new Date().toISOString(), updated_by: await adminProfileId() },
        { onConflict: 'key' },
      )
      if (error) return json({ error: 'Update failed' }, 500)
      await log('admin_wp_maintenance', { enabled: body.enabled })
      return json({ ok: true, maintenance_mode: body.enabled })
    }

    if (action === 'export_maintenance_signups') {
      const { data, error } = await db.from('maintenance_signups').select('email, consent_at, created_at').order('created_at').limit(10000)
      if (error) return json({ error: 'Query failed' }, 500)
      await log('admin_wp_maintenance_export', { count: data?.length ?? 0 })
      return json({
        csv: toCsv(['email', 'consent_at', 'created_at'], (data ?? []).map((r) => [r.email, r.consent_at, r.created_at])),
        filename: `kiki-upgrade-signups-${new Date().toISOString().slice(0, 10)}.csv`,
      })
    }

    // ================= Yoco connection =================
    if (action === 'yoco_status') {
      const cfg = await yocoPaymentsConfig()
      return json({ key_set: !!cfg.secretKey, key_mode: cfg.mode, webhook_registered: !!cfg.webhookSecret, webhook_source: cfg.webhookSource })
    }

    if (action === 'register_yoco_webhook') {
      const cfg = await yocoPaymentsConfig()
      if (!cfg.secretKey) return json({ error: 'yoco_key_missing', message: 'Add the Yoco secret key in the project secrets first.' }, 409)
      const mode = yocoKeyMode(cfg.secretKey)
      if (!mode) return json({ error: 'yoco_key_invalid', message: 'The Yoco secret key should start with sk_test_ or sk_live_.' }, 409)
      if (cfg.webhookSource === 'env') {
        return json({ ok: true, already: true, key_mode: mode, webhook_registered: true, message: 'A webhook secret is already set in the project secrets, so it is used as it is.' })
      }
      const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/yoco-webhook`
      const headers = { Authorization: `Bearer ${cfg.secretKey}`, 'Content-Type': 'application/json' }
      const yocoFail = (status: number, text: string) => {
        console.error('yoco webhook api error', status, text.slice(0, 300))
        return json({ error: 'yoco_failed', message: status === 403 ? 'Yoco refused the request. Check the secret key.' : 'Yoco could not register the webhook. Please try again.' }, 502)
      }
      const listRes = await fetch('https://payments.yoco.com/api/webhooks', { headers })
      const listText = await listRes.text()
      if (!listRes.ok) return yocoFail(listRes.status, listText)
      let subs: { id: string; url: string; mode?: string }[] = []
      try { subs = (JSON.parse(listText)?.subscriptions ?? []).filter((x: any) => typeof x?.id === 'string' && typeof x?.url === 'string') } catch { subs = [] }
      const ours = subs.filter((x) => x.url === webhookUrl)
      const { data: storedId } = await db.from('payment_provider_secrets').select('value').eq('key', webhookIdKeyName(mode)).maybeSingle()
      if (cfg.webhookSecret && storedId?.value && ours.some((x) => x.id === storedId.value)) {
        return json({ ok: true, already: true, key_mode: mode, webhook_registered: true })
      }
      // Yoco only shows a webhook secret once, so a webhook we have no secret for is replaced.
      for (const x of ours) {
        const del = await fetch(`https://payments.yoco.com/api/webhooks/${encodeURIComponent(x.id)}`, { method: 'DELETE', headers })
        if (!del.ok) return yocoFail(del.status, await del.text())
      }
      const regRes = await fetch('https://payments.yoco.com/api/webhooks', {
        method: 'POST', headers, body: JSON.stringify({ name: 'kiki-warrior-payments', url: webhookUrl }),
      })
      const regText = await regRes.text()
      if (!regRes.ok) return yocoFail(regRes.status, regText)
      let reg: any = {}
      try { reg = JSON.parse(regText) } catch { /* handled below */ }
      if (typeof reg?.secret !== 'string' || typeof reg?.id !== 'string') return yocoFail(regRes.status, 'missing secret or id')
      const nowIso = new Date().toISOString()
      const { error: sErr } = await db.from('payment_provider_secrets').upsert([
        { key: webhookSecretKeyName(mode), value: reg.secret, mode, created_at: nowIso },
        { key: webhookIdKeyName(mode), value: reg.id, mode, created_at: nowIso },
      ], { onConflict: 'key' })
      if (sErr) return json({ error: 'Update failed' }, 500)
      await log('admin_wp_yoco_webhook_registered', { mode, webhook_id: reg.id, replaced: ours.length })
      return json({ ok: true, already: false, key_mode: mode, webhook_registered: true })
    }

    if (action === 'list_batches') {
      const { data: batches, error } = await db.from('bulk_code_batches').select('*').order('created_at', { ascending: false }).limit(500)
      if (error) return json({ error: 'Query failed' }, 500)
      const now = Date.now()
      const rows = await Promise.all((batches ?? []).map(async (b) => {
        const { count } = await db.from('bulk_codes').select('id', { count: 'exact', head: true }).eq('batch_id', b.id).not('redeemed_by', 'is', null)
        const used = count ?? 0
        const { data: ship } = await db.from('org_shipments').select('id, status, waiting_for_restock, quantity').eq('batch_id', b.id).maybeSingle()
        return {
          ...b,
          shipment: ship ?? null,
          seats_used: used,
          seats_remaining: Math.max(0, b.seats - used),
          active: !b.expires_at || new Date(b.expires_at).getTime() > now,
        }
      }))
      return json({ rows })
    }

    if (action === 'export_batch') {
      if (typeof body.batch_id !== 'string' || !UUID.test(body.batch_id)) return json({ error: 'Invalid input' }, 400)
      const { data: batch } = await db.from('bulk_code_batches').select('id, name').eq('id', body.batch_id).maybeSingle()
      if (!batch) return json({ error: 'Not found' }, 404)
      const { data: codes, error } = await db.from('bulk_codes').select('code, redeemed_at, redeemed_by').eq('batch_id', batch.id).order('code').limit(5000)
      if (error) return json({ error: 'Query failed' }, 500)
      const slug = batch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'batch'
      await log('admin_wp_batch_exported', { batch_id: batch.id })
      return json({ csv: batchCsv(codes ?? []), filename: `kiki-codes-${slug}.csv`, name: batch.name, codes: (codes ?? []).filter((c) => !c.redeemed_by).map((c) => c.code) })
    }

    if (action === 'disable_batch') {
      if (typeof body.batch_id !== 'string' || !UUID.test(body.batch_id)) return json({ error: 'Invalid input' }, 400)
      const nowIso = new Date().toISOString()
      const { data, error } = await db.from('bulk_code_batches').update({ expires_at: nowIso })
        .eq('id', body.batch_id).or(`expires_at.is.null,expires_at.gt."${nowIso}"`).select('id')
      if (error) return json({ error: 'Update failed' }, 500)
      if (!data?.length) return json({ error: 'not_active', message: 'This batch is already disabled or expired.' }, 409)
      await log('admin_wp_batch_disabled', { batch_id: body.batch_id })
      return json({ ok: true })
    }

    // ================= Book file =================
    if (action === 'book_upload_url') {
      // A fresh path every time, so a half finished upload never replaces the live book.
      const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
      const path = `books/kikis-armour-of-god-premium-edition-${stamp}.pdf`
      const { data, error } = await db.storage.from(LIBRARY_BUCKET).createSignedUploadUrl(path)
      if (error || !data) return json({ error: 'Upload link failed' }, 500)
      await log('admin_wp_book_upload_started', { path })
      return json({ path: data.path ?? path, token: data.token, max_bytes: BOOK_MAX_BYTES })
    }

    if (action === 'book_upload_complete') {
      const path = typeof body.path === 'string' ? body.path : ''
      if (!BOOK_PATH.test(path)) return json({ error: 'invalid_path' }, 400)
      const [folder, name] = [path.slice(0, path.lastIndexOf('/')), path.slice(path.lastIndexOf('/') + 1)]
      const { data: files, error: listErr } = await db.storage.from(LIBRARY_BUCKET).list(folder, { search: name, limit: 5 })
      const file = (files ?? []).find((f) => f.name === name)
      if (listErr || !file) return json({ error: 'file_missing', message: 'The upload did not arrive. Please try again.' }, 404)
      const size = Number((file.metadata as any)?.size ?? 0)
      // Check the first bytes really are a PDF, not just the name.
      let isPdf = false
      const { data: signed } = await db.storage.from(LIBRARY_BUCKET).createSignedUrl(path, 60)
      if (signed?.signedUrl) {
        try {
          const head = await fetch(signed.signedUrl, { headers: { Range: 'bytes=0-4' } })
          const bytes = new Uint8Array(await head.arrayBuffer()).slice(0, 5)
          isPdf = new TextDecoder().decode(bytes) === '%PDF-'
        } catch { isPdf = false }
      }
      if (!isPdf || size <= 0 || size > BOOK_MAX_BYTES) {
        await db.storage.from(LIBRARY_BUCKET).remove([path])
        return json({ error: 'invalid_file', message: 'Please upload a PDF file of 50 MB or less.' }, 400)
      }
      const { error } = await db.from('app_settings').upsert(
        { key: 'library_book_path', value: path, updated_at: new Date().toISOString(), updated_by: await adminProfileId() },
        { onConflict: 'key' },
      )
      if (error) return json({ error: 'Update failed' }, 500)
      await log('admin_wp_book_uploaded', { path, size })
      return json({ ok: true, library_book_path: path, size })
    }

    // ================= Bonus pendant sets =================
    if (action === 'list_bonuses') {
      const [{ data: list, error }, settings] = await Promise.all([
        db.from('bonus_awards').select('id, user_id, note, status, shipment_id, created_at, updated_at').order('created_at', { ascending: false }).limit(500),
        readSettings(),
      ])
      if (error) return json({ error: 'Query failed' }, 500)
      const rows = list ?? []
      const owedUsers = rows.filter((b) => b.status === 'owed').map((b) => b.user_id)
      const [people, ships] = await Promise.all([
        profilesMap(rows.map((b) => b.user_id)),
        byIds('shipments', 'id, user_id, status, created_at, shipment_group_id', 'user_id', owedUsers),
      ])
      const openShips = ships.filter((sh) => PENDING_SHIPMENT_STATUSES.includes(sh.status))
      return json({
        pendant_sets_in_stock: parseStock(settings.get('pendant_sets_in_stock')?.value ?? null),
        bonuses: rows.map((b) => ({
          ...b,
          parent_name: people.get(b.user_id)?.first_name ?? null,
          parent_email: people.get(b.user_id)?.email ?? null,
          open_shipments: b.status === 'owed'
            ? openShips.filter((sh) => sh.user_id === b.user_id).map((sh) => ({ id: sh.id, status: sh.status, created_at: sh.created_at }))
            : [],
        })),
      })
    }

    if (action === 'award_bonus') {
      const p = await findUser(body.email)
      if (!p) return json({ error: 'Account not found' }, 404)
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : ''
      const { data: id, error } = await db.rpc('award_bonus_pendant', { _user_id: p.id, _note: note || null, _created_by: await adminProfileId() })
      if (error) return json({ error: 'Update failed' }, 500)
      if (!id) return json({ error: 'sold_out', message: 'No pendant sets are left in stock.' }, 409)
      await log('admin_wp_bonus_awarded', { bonus_id: id }, p.id)
      return json({ ok: true, id, email: p.email })
    }

    if (action === 'attach_bonus') {
      if (typeof body.bonus_id !== 'string' || !UUID.test(body.bonus_id) || typeof body.shipment_id !== 'string' || !UUID.test(body.shipment_id)) {
        return json({ error: 'Invalid input' }, 400)
      }
      const { data: bonus } = await db.from('bonus_awards').select('id, user_id, status').eq('id', body.bonus_id).maybeSingle()
      if (!bonus || bonus.status !== 'owed') return json({ error: 'not_owed', message: 'This bonus is not waiting to be sent.' }, 409)
      const { data: ship } = await db.from('shipments').select('id, user_id, status').eq('id', body.shipment_id).maybeSingle()
      if (!ship || ship.user_id !== bonus.user_id || !PENDING_SHIPMENT_STATUSES.includes(ship.status)) {
        return json({ error: 'invalid_shipment', message: 'Pick a parcel for this family that has not been sent yet.' }, 409)
      }
      const { data: done, error } = await db.from('bonus_awards')
        .update({ status: 'added_to_shipment', shipment_id: ship.id, updated_at: new Date().toISOString() })
        .eq('id', bonus.id).eq('status', 'owed').select('id')
      if (error) return json({ error: 'Update failed' }, 500)
      if (!done?.length) return json({ error: 'not_owed', message: 'This bonus is not waiting to be sent.' }, 409)
      await log('admin_wp_bonus_attached', { bonus_id: bonus.id, shipment_id: ship.id }, bonus.user_id)
      return json({ ok: true })
    }

    if (action === 'mark_bonus_handed_over') {
      if (typeof body.bonus_id !== 'string' || !UUID.test(body.bonus_id)) return json({ error: 'Invalid input' }, 400)
      const { data: done, error } = await db.from('bonus_awards')
        .update({ status: 'handed_over', updated_at: new Date().toISOString() })
        .eq('id', body.bonus_id).in('status', ['owed', 'added_to_shipment']).select('id, user_id')
      if (error) return json({ error: 'Update failed' }, 500)
      if (!done?.length) return json({ error: 'not_open', message: 'This bonus was already handed over.' }, 409)
      await log('admin_wp_bonus_handed_over', { bonus_id: body.bonus_id }, done[0].user_id)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    console.error('admin-orders error', e)
    return json({ error: 'Server error' }, 500)
  }
})
