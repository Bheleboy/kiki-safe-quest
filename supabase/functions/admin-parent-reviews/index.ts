import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITECHECKER_URL = "https://cisoexddcgwkjzgacify.supabase.co";
const SITECHECKER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc29leGRkY2d3a2p6Z2FjaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjQ0MjMsImV4cCI6MjA5OTMwMDQyM30.c78uc4a8V03yztcuJ099eXb6eHtkQbyA8kg0vpk2rvo";
const KIKI_CLIENT_ID = "7a197200-b63e-4a04-80b7-6c3bdcfd93d7";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FIELDS = "id, display_name, overall_rating, feedback, created_at, approved";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("x-admin-token");
    if (!token) return json({ error: "Missing admin token" }, 401);

    const sc = createClient(SITECHECKER_URL, SITECHECKER_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await sc.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Invalid admin token" }, 401);

    const { data: membership } = await sc
      .from("dashboard_user_clients")
      .select("client_id")
      .eq("user_id", userData.user.id)
      .eq("client_id", KIKI_CLIENT_ID)
      .maybeSingle();
    if (!membership) return json({ error: "Forbidden" }, 403);

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    if (body.action === "list") {
      const { data, error } = await db
        .from("parent_surveys")
        .select(FIELDS)
        .eq("share_publicly", true)
        .order("approved", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) return json({ error: "Query failed" }, 500);
      return json({ rows: data ?? [] });
    }

    if (body.action === "set") {
      const { id, approved } = body;
      if (typeof id !== "string" || !UUID_RE.test(id) || typeof approved !== "boolean") {
        return json({ error: "Invalid input" }, 400);
      }
      const { data, error } = await db
        .from("parent_surveys")
        .update({ approved, approved_at: approved ? new Date().toISOString() : null })
        .eq("id", id)
        .select(FIELDS)
        .maybeSingle();
      if (error) return json({ error: "Update failed" }, 500);
      if (!data) return json({ error: "Not found" }, 404);
      return json({ row: data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-parent-reviews error", e);
    return json({ error: "Server error" }, 500);
  }
});
