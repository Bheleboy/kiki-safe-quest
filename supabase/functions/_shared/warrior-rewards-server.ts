// Server-only Armour Kit release (Deno edge runtime). Used by award-points and save-delivery.
// Decisions come from the pure helpers in warrior-rewards.ts; this file only reads and writes.
import { admin } from './security.ts'
import { sendAppEmail } from './warrior-pass-server.ts'
import { decideKitRelease, deliveryPointText, pickShipmentGroup, type ShipmentLite } from './warrior-rewards.ts'

const DELIVERY_COLS = 'recipient_name, phone, delivery_method, address_line1, address_line2, suburb, city, province, postal_code, locker_code'

type DeliveryRow = Record<string, string | null>

/** Open shipments (draft or submitted) of this parent, used to combine siblings into one delivery group. */
async function openShipments(userId: string): Promise<ShipmentLite[]> {
  const { data, error } = await admin.from('shipments')
    .select('shipment_group_id, status, created_at')
    .eq('user_id', userId).in('status', ['draft', 'submitted'])
  if (error) throw error
  return data ?? []
}

/** Creates the draft shipment for a kit (at most one per kit). Returns the group id used. */
async function createDraftShipment(userId: string, kitId: string, delivery: DeliveryRow, siblings: ShipmentLite[]): Promise<string> {
  const groupId = pickShipmentGroup(siblings, new Date()) ?? crypto.randomUUID()
  const { error } = await admin.from('shipments').upsert({
    kit_id: kitId,
    user_id: userId,
    shipment_group_id: groupId,
    status: 'draft',
    recipient_name: delivery.recipient_name,
    phone: delivery.phone,
    delivery_method: delivery.delivery_method,
    address_line1: delivery.address_line1,
    address_line2: delivery.address_line2,
    suburb: delivery.suburb,
    city: delivery.city,
    province: delivery.province,
    postal_code: delivery.postal_code,
    locker_code: delivery.locker_code,
  }, { onConflict: 'kit_id', ignoreDuplicates: true })
  if (error) throw error
  return groupId
}

async function parentEmail(userId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(userId)
  return data?.user?.email ?? null
}

/**
 * Releases a child's Armour Kit when it is still locked and every lesson in their stream is done.
 * Idempotent: the kit only moves out of 'locked' once, and shipments are unique per kit.
 * Returns the kit status after the call, or null when the child has no kit.
 */
export async function releaseKitIfDue(opts: {
  userId: string
  childId: string
  childName: string
  streamFinished: boolean
}): Promise<string | null> {
  const { data: kit, error } = await admin.from('armour_kits')
    .select('id, status').eq('child_id', opts.childId).eq('user_id', opts.userId).maybeSingle()
  if (error) throw error
  if (!kit) return null
  if (kit.status !== 'locked' || !opts.streamFinished) return kit.status

  const [{ data: delivery, error: dErr }, siblings] = await Promise.all([
    admin.from('delivery_profiles').select(DELIVERY_COLS).eq('user_id', opts.userId).maybeSingle(),
    openShipments(opts.userId),
  ])
  if (dErr) throw dErr

  const decision = decideKitRelease({
    kitStatus: kit.status, streamFinished: opts.streamFinished, hasDeliveryProfile: !!delivery,
    siblingShipments: siblings, now: new Date(),
  })
  if (!decision.release) return kit.status

  if (decision.createShipment && delivery) await createDraftShipment(opts.userId, kit.id, delivery, siblings)

  const now = new Date().toISOString()
  // Only the first caller moves the kit out of 'locked', so the notification and email go out once.
  const { data: moved, error: mErr } = await admin.from('armour_kits')
    .update({ status: decision.newStatus, earned_at: now })
    .eq('id', kit.id).eq('status', 'locked')
    .select('id')
  if (mErr) throw mErr
  if (!moved || moved.length === 0) {
    const { data: again } = await admin.from('armour_kits').select('status').eq('id', kit.id).maybeSingle()
    return again?.status ?? kit.status
  }

  await admin.from('notifications').insert({
    user_id: opts.userId,
    child_id: opts.childId,
    type: 'armour_kit_earned',
    title: `${opts.childName} has earned the Armour Kit`,
    message: decision.newStatus === 'ready_to_ship'
      ? 'We are getting it ready to ship to the delivery point on file. Tracking details follow when it ships.'
      : 'Please add your delivery details under Warrior Pass on the parent dashboard so we can send it.',
    related_id: kit.id,
  })
  const to = await parentEmail(opts.userId)
  if (to) {
    sendAppEmail({
      to,
      template: 'reward-unlocked',
      idempotencyKey: `reward-unlocked-${kit.id}`,
      data: { childName: opts.childName, deliveryPoint: delivery ? deliveryPointText(delivery) : null },
    })
  }
  return decision.newStatus
}

/** After delivery details are saved: every kit waiting for an address gets a draft shipment and moves to ready_to_ship. */
export async function shipWaitingKits(userId: string): Promise<number> {
  const [{ data: kits, error }, { data: delivery, error: dErr }] = await Promise.all([
    admin.from('armour_kits').select('id').eq('user_id', userId).eq('status', 'address_needed'),
    admin.from('delivery_profiles').select(DELIVERY_COLS).eq('user_id', userId).maybeSingle(),
  ])
  if (error) throw error
  if (dErr) throw dErr
  if (!delivery || !kits?.length) return 0
  const siblings = await openShipments(userId)
  let moved = 0
  for (const kit of kits) {
    const groupId = await createDraftShipment(userId, kit.id, delivery, siblings)
    siblings.push({ shipment_group_id: groupId, status: 'draft', created_at: new Date().toISOString() })
    const { data, error: uErr } = await admin.from('armour_kits')
      .update({ status: 'ready_to_ship' }).eq('id', kit.id).eq('status', 'address_needed').select('id')
    if (uErr) throw uErr
    moved += data?.length ?? 0
  }
  return moved
}
