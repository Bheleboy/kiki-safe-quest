import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders as sdkCorsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const corsHeaders = {
  ...sdkCorsHeaders,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const SITECHECKER_URL = 'https://cisoexddcgwkjzgacify.supabase.co'
const SITECHECKER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc29leGRkY2d3a2p6Z2FjaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjQ0MjMsImV4cCI6MjA5OTMwMDQyM30.c78uc4a8V03yztcuJ099eXb6eHtkQbyA8kg0vpk2rvo'
const KIKI_CLIENT_ID = '7a197200-b63e-4a04-80b7-6c3bdcfd93d7'
const RPC_NAMES = ['admin_user_stats', 'admin_child_stats', 'admin_signup_trend', 'admin_course_stats'] as const
type RpcResult = { data: unknown; error: { message: string } | null }
type Dependencies = {
  fetch: typeof fetch
  rpc: (name: typeof RPC_NAMES[number]) => PromiseLike<RpcResult>
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function handleRequest(req: Request, dependencies?: Dependencies): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) {
    return json({ error: 'No auth header' }, 401)
  }
  const headers = { Authorization: authorization, apikey: SITECHECKER_KEY }
  const fetcher = dependencies?.fetch ?? fetch
  let user: { id?: unknown }
  try {
    const response = await fetcher(`${SITECHECKER_URL}/auth/v1/user`, { headers })
    if (response.status !== 200) return json({ error: 'Invalid session' }, 401)
    user = await response.json()
    if (!user || typeof user.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
      return json({ error: 'Invalid session' }, 401)
    }
  } catch {
    return json({ error: 'Invalid session' }, 401)
  }
  try {
    const response = await fetcher(
      `${SITECHECKER_URL}/rest/v1/dashboard_user_clients?select=client_id&user_id=eq.${encodeURIComponent(user.id as string)}&client_id=eq.${KIKI_CLIENT_ID}`,
      { headers },
    )
    if (!response.ok) return json({ error: 'Not admin' }, 403)
    const membership: unknown = await response.json()
    if (!Array.isArray(membership) || !membership.some((row) => row?.client_id === KIKI_CLIENT_ID)) {
      return json({ error: 'Not admin' }, 403)
    }
  } catch {
    return json({ error: 'Not admin' }, 403)
  }

  try {
    let rpc = dependencies?.rpc
    if (!rpc) {
      const url = Deno.env.get('SUPABASE_URL')
      const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (!url || !key) return json({ error: 'RPC failed', detail: ['Server configuration unavailable'] }, 502)
      const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      rpc = (name) => db.rpc(name)
    }
    const results = await Promise.all(RPC_NAMES.map(async (name) => {
      try {
        return await rpc(name)
      } catch {
        return { data: null, error: { message: `${name} request failed` } }
      }
    }))
    const messages = results.flatMap((result) => result.error ? [result.error.message] : [])
    if (messages.length) return json({ error: 'RPC failed', detail: messages }, 502)
    const [users, children, trend, course] = results
    return json({ users: users.data, children: children.data, trend: trend.data, course: course.data })
  } catch {
    return json({ error: 'RPC failed', detail: ['Stats request failed'] }, 502)
  }
}

if (import.meta.main) Deno.serve((req) => handleRequest(req))