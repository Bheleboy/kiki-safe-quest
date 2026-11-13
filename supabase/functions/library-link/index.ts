// Family library download. Requires an active 'book' entitlement (admins allowed) and returns a
// signed link to the private family-library bucket that expires after 60 seconds.
import { admin, cors, getClaimsFrom, hitLimit, isRegisteredSession, json } from '../_shared/security.ts'
import { isAdminUser } from '../_shared/warrior-pass-server.ts'

const BUCKET = 'family-library'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const claims = await getClaimsFrom(req)
  if (!claims || !(await isRegisteredSession(claims))) return json({ error: 'unauthorized' }, 401)
  const userId = claims.sub as string

  const limit = await hitLimit(`wp_library:${userId}`, 30, 15 * 60_000)
  if (limit.blocked) return json({ error: 'too_many' }, 429)

  const [isAdmin, { data: owned, error: oErr }, { data: setting, error: sErr }] = await Promise.all([
    isAdminUser(userId),
    admin.from('entitlements').select('id').eq('user_id', userId).eq('kind', 'book').is('revoked_at', null).maybeSingle(),
    admin.from('app_settings').select('value').eq('key', 'library_book_path').maybeSingle(),
  ])
  if (oErr || sErr) return json({ error: 'server_error' }, 500)
  if (!owned && !isAdmin) return json({ error: 'not_owned' }, 403)

  const path = typeof setting?.value === 'string' ? setting.value.trim().replace(/^\/+/, '') : ''
  if (!path || path.includes('..')) return json({ error: 'book_not_available' }, 404)

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 60, { download: true })
  if (error || !data?.signedUrl) return json({ error: 'book_not_available' }, 404)
  return json({ url: data.signedUrl, expires_in: 60 })
})
