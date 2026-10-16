import { handleRequest } from './index.ts'

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
const CLIENT_ID = '7a197200-b63e-4a04-80b7-6c3bdcfd93d7'
const USER_ID = '11111111-1111-4111-8111-111111111111'
const request = () => new Request('http://localhost/admin-stats-export', { headers: { Authorization: 'Bearer test-session' } })
function mockFetch(member: boolean): typeof fetch {
  return ((url: string | URL | Request, init?: RequestInit) => {
    equal((init?.headers as Record<string, string>).Authorization, 'Bearer test-session')
    const isUser = String(url).endsWith('/auth/v1/user')
    if (!isUser) equal(String(url).includes(`user_id=eq.${USER_ID}&client_id=eq.${CLIENT_ID}`), true)
    return Promise.resolve(Response.json(isUser ? { id: USER_ID } : member ? [{ client_id: CLIENT_ID }] : []))
  }) as typeof fetch
}

Deno.test('missing bearer token returns 401 before any stats call', async () => {
  const response = await handleRequest(new Request('http://localhost/admin-stats-export'))
  equal(response.status, 401)
  equal(await response.json(), { error: 'No auth header' })
})
Deno.test('invalid SiteChecker session returns 401 without stats', async () => {
  const response = await handleRequest(request(), {
    fetch: (() => Promise.resolve(new Response('{}', { status: 401 }))) as typeof fetch,
    rpc: () => { throw new Error('Must not call stats') },
  })
  equal(response.status, 401)
  equal(await response.json(), { error: 'Invalid session' })
})
Deno.test('unmapped SiteChecker user returns 403 without stats', async () => {
  let calls = 0
  const response = await handleRequest(request(), { fetch: mockFetch(false), rpc: () => { calls++; return Promise.resolve({ data: null, error: null }) } })
  equal(response.status, 403)
  equal(await response.json(), { error: 'Not admin' })
  equal(calls, 0)
})
Deno.test('mapped admin gets exactly four ordered results with parallel RPC calls', async () => {
  const calls: string[] = []
  const releases: Array<() => void> = []
  const pending = handleRequest(request(), {
    fetch: mockFetch(true),
    rpc: (name) => {
      calls.push(name)
      return new Promise((resolve) => {
        releases.push(() => resolve({ data: [name], error: null }))
        if (releases.length === 4) releases.forEach((release) => release())
      })
    },
  })
  const response = await pending
  equal(calls, ['admin_user_stats', 'admin_child_stats', 'admin_signup_trend', 'admin_course_stats'])
  equal(response.status, 200)
  equal(await response.json(), { users: ['admin_user_stats'], children: ['admin_child_stats'], trend: ['admin_signup_trend'], course: ['admin_course_stats'] })
})
Deno.test('RPC errors return 502 with messages', async () => {
  const response = await handleRequest(request(), {
    fetch: mockFetch(true),
    rpc: (name) => Promise.resolve({ data: null, error: name === 'admin_child_stats' ? { message: 'permission denied' } : null }),
  })
  equal(response.status, 502)
  equal(await response.json(), { error: 'RPC failed', detail: ['permission denied'] })
})
Deno.test('preflight allows required request headers', async () => {
  const response = await handleRequest(new Request('http://localhost/admin-stats-export', { method: 'OPTIONS' }))
  equal(response.status, 200)
  equal(response.headers.get('Access-Control-Allow-Origin'), '*')
  equal(response.headers.get('Access-Control-Allow-Headers'), 'authorization, x-client-info, apikey, content-type')
})