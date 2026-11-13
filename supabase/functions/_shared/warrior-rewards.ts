// Warrior Pass rewards: pure helpers shared by edge functions and the app's Vitest suite.
// No Deno or Node APIs, so the same file runs in both places.

export type StreamId = '6-9' | '10-13'

/**
 * Lesson and module ids per stream, kept by hand in step with src/data/courseData.ts.
 * src/lib/warriorRewards.test.ts fails if the two drift apart.
 */
export const COURSE_STRUCTURE: Record<StreamId, { id: string; lessons: string[] }[]> = {
  '6-9': [1, 2, 3].map((m) => ({ id: `young-m${m}`, lessons: [1, 2, 3, 4, 5].map((l) => `young-m${m}-l${l}`) })),
  '10-13': [1, 2, 3, 4, 5].map((m) => ({ id: `teen-m${m}`, lessons: [1, 2, 3, 4, 5].map((l) => `teen-m${m}-l${l}`) })),
}

export const POINTS = { lesson: 10, perfect_quiz: 5, module: 25 } as const
export type PointReason = keyof typeof POINTS

export interface PointRow { reason: PointReason; lesson_id: string; points: number }

/** The stream a child follows. Unknown age bands fall back to the younger stream, like the course page. */
export function streamFor(ageBand: string | null | undefined): StreamId {
  return ageBand === '10-13' ? '10-13' : '6-9'
}

export function streamLessonIds(stream: StreamId): string[] {
  return COURSE_STRUCTURE[stream].flatMap((m) => m.lessons)
}

/** Every point row a child has earned from their progress rows. Never returns a null lesson_id. */
export function computePointRows(stream: StreamId, progress: { lesson_id: string; score: number | null }[]): PointRow[] {
  const best = new Map<string, number>()
  for (const p of progress) {
    if (typeof p.lesson_id !== 'string' || !p.lesson_id) continue
    best.set(p.lesson_id, Math.max(best.get(p.lesson_id) ?? 0, Number(p.score) || 0))
  }
  const rows: PointRow[] = []
  for (const mod of COURSE_STRUCTURE[stream]) {
    for (const id of mod.lessons) {
      if (!best.has(id)) continue
      rows.push({ reason: 'lesson', lesson_id: id, points: POINTS.lesson })
      if ((best.get(id) ?? 0) >= 100) rows.push({ reason: 'perfect_quiz', lesson_id: id, points: POINTS.perfect_quiz })
    }
    if (mod.lessons.every((id) => best.has(id))) rows.push({ reason: 'module', lesson_id: mod.id, points: POINTS.module })
  }
  return rows
}

/** Rows not stored yet (unique on child, reason, lesson id). */
export function missingPointRows(wanted: PointRow[], existing: { reason: string; lesson_id: string | null }[]): PointRow[] {
  const have = new Set(existing.map((e) => `${e.reason}|${e.lesson_id ?? ''}`))
  return wanted.filter((w) => !have.has(`${w.reason}|${w.lesson_id}`))
}

export function sumPoints(rows: { points: number }[]): number {
  return rows.reduce((s, r) => s + (Number(r.points) || 0), 0)
}

/** Most points a child can earn in a stream: every lesson, every perfect quiz and every module bonus. */
export function totalPossible(stream: StreamId): number {
  const mods = COURSE_STRUCTURE[stream]
  const lessons = mods.reduce((n, m) => n + m.lessons.length, 0)
  return lessons * (POINTS.lesson + POINTS.perfect_quiz) + mods.length * POINTS.module
}

export function isStreamFinished(stream: StreamId, completedLessonIds: Iterable<string>): boolean {
  const done = new Set(completedLessonIds)
  return streamLessonIds(stream).every((id) => done.has(id))
}

// ---------- Armour Kit release ----------

export type KitStatus = 'locked' | 'earned' | 'address_needed' | 'ready_to_ship' | 'shipped' | 'delivered'
export interface ShipmentLite { shipment_group_id: string | null; status: string; created_at: string | null }

export const GROUP_WINDOW_MS = 7 * 24 * 60 * 60_000

/** Reuses the group of a sibling shipment still in draft or submitted from the last 7 days, otherwise null (start a new group). */
export function pickShipmentGroup(siblings: ShipmentLite[], now: Date): string | null {
  const cutoff = now.getTime() - GROUP_WINDOW_MS
  const open = siblings
    .filter((s) => s.shipment_group_id && (s.status === 'draft' || s.status === 'submitted') && s.created_at && new Date(s.created_at).getTime() >= cutoff)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
  return open[0]?.shipment_group_id ?? null
}

export type KitReleaseDecision =
  | { release: false }
  | { release: true; newStatus: 'ready_to_ship' | 'address_needed'; createShipment: boolean; reuseGroupId: string | null }

/** Decides whether a kit is released now and what happens to it. Only locked kits of finished learners are released. */
export function decideKitRelease(input: {
  kitStatus: string | null
  streamFinished: boolean
  hasDeliveryProfile: boolean
  siblingShipments: ShipmentLite[]
  now: Date
}): KitReleaseDecision {
  if (input.kitStatus !== 'locked' || !input.streamFinished) return { release: false }
  if (!input.hasDeliveryProfile) return { release: true, newStatus: 'address_needed', createShipment: false, reuseGroupId: null }
  return { release: true, newStatus: 'ready_to_ship', createShipment: true, reuseGroupId: pickShipmentGroup(input.siblingShipments, input.now) }
}

/** One line describing where a kit goes, for the reward email. */
export function deliveryPointText(d: {
  delivery_method?: string | null; locker_code?: string | null; address_line1?: string | null
  suburb?: string | null; city?: string | null; postal_code?: string | null
} | null): string | null {
  if (!d) return null
  if (d.delivery_method === 'locker') return d.locker_code ? `Courier Guy locker ${d.locker_code}` : null
  const parts = [d.address_line1, d.suburb, d.city, d.postal_code].filter((p) => typeof p === 'string' && p.trim())
  return parts.length ? parts.join(', ') : null
}
