// Warrior Points. The browser only says which child; the server works out every point from the
// progress table and stores missing rows (idempotent through unique child, reason, lesson id).
// Also releases the child's Armour Kit once every lesson in their stream is done.
import { admin, cors, getClaimsFrom, hitLimit, isRegisteredSession, json } from '../_shared/security.ts'
import { isAdminUser } from '../_shared/warrior-pass-server.ts'
import {
  computePointRows, isStreamFinished, missingPointRows, streamFor, sumPoints, totalPossible,
} from '../_shared/warrior-rewards.ts'
import { releaseKitIfDue } from '../_shared/warrior-rewards-server.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const claims = await getClaimsFrom(req)
  if (!claims || !(await isRegisteredSession(claims))) return json({ error: 'unauthorized' }, 401)
  const userId = claims.sub as string

  let body: any
  try { body = await req.json() } catch { body = {} }
  const childId = body?.child_id
  if (typeof childId !== 'string' || !UUID.test(childId)) return json({ error: 'invalid_child' }, 400)

  const limit = await hitLimit(`wp_points:${userId}`, 120, 15 * 60_000)
  if (limit.blocked) return json({ error: 'too_many' }, 429)

  const [{ data: child, error: cErr }, isAdmin, { data: paywall }] = await Promise.all([
    admin.from('children').select('id, first_name, age_band').eq('id', childId).eq('parent_id', userId).maybeSingle(),
    isAdminUser(userId),
    admin.from('app_settings').select('value').eq('key', 'paywall_enabled').maybeSingle(),
  ])
  if (cErr) return json({ error: 'server_error' }, 500)
  if (!child) return json({ error: 'invalid_child' }, 403)
  // Shipped switched off: nothing is written for families until the paywall is on (admins can preview).
  if (paywall?.value !== true && !isAdmin) return json({ enabled: false })

  const stream = streamFor(child.age_band)
  const [{ data: progress, error: pErr }, { data: existing, error: eErr }] = await Promise.all([
    admin.from('progress').select('lesson_id, score').eq('user_id', userId).eq('child_id', childId),
    admin.from('warrior_points').select('reason, lesson_id, points').eq('child_id', childId),
  ])
  if (pErr || eErr) return json({ error: 'server_error' }, 500)

  const missing = missingPointRows(computePointRows(stream, progress ?? []), existing ?? [])
  if (missing.length) {
    const { error } = await admin.from('warrior_points').upsert(
      missing.map((m) => ({ user_id: userId, child_id: childId, points: m.points, reason: m.reason, lesson_id: m.lesson_id })),
      { onConflict: 'child_id,reason,lesson_id', ignoreDuplicates: true },
    )
    if (error) {
      console.error('warrior_points insert failed', error)
      return json({ error: 'server_error' }, 500)
    }
  }

  const finished = isStreamFinished(stream, (progress ?? []).map((p) => p.lesson_id))
  let kitStatus: string | null = null
  try {
    kitStatus = await releaseKitIfDue({ userId, childId, childName: child.first_name, streamFinished: finished })
  } catch (e) {
    // Points are already saved; the kit release runs again on the next call.
    console.error('kit release failed', e)
  }

  return json({
    enabled: true,
    total: sumPoints(existing ?? []) + sumPoints(missing),
    possible: totalPossible(stream),
    stream_finished: finished,
    kit_status: kitStatus,
  })
})
