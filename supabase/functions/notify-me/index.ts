// Public "tell me when you are back" sign-up for the upgrade page. Only accepts sign-ups while
// maintenance_mode is on, is rate limited per IP, and inserts with the service role.
import { admin, clientIp, cors, hitLimit, json } from '../_shared/security.ts'
import { parseNotifyMe } from '../_shared/notify-me.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const ip = clientIp(req)
  const limit = await hitLimit(`notify_me_ip:${ip}`, 10, 60 * 60_000)
  if (limit.blocked) return json({ error: 'too_many', message: 'Too many attempts. Please try again later.' }, 429)

  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const parsed = parseNotifyMe(body)
  if (!parsed.ok) return json({ error: parsed.error }, 400)

  const { data: setting } = await admin.from('app_settings').select('value').eq('key', 'maintenance_mode').maybeSingle()
  if (setting?.value !== true) return json({ error: 'not_available' }, 403)

  const { error } = await admin.from('maintenance_signups')
    .upsert({ email: parsed.email, consent_at: new Date().toISOString() }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) {
    console.error('notify-me insert failed', error.code)
    return json({ error: 'server_error' }, 500)
  }
  return json({ ok: true })
})
