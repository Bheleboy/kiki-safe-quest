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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const COUNTED = [
  "login_failed", "account_locked", "ip_locked", "stepup_sent", "stepup_device_mismatch", "user_reported_signin", "pin_locked",
];

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
    const adminEmail = userData.user.email ?? "unknown";

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const log = (event_type: string, details: Record<string, unknown>, user_id: string | null = null) =>
      db.from("security_events").insert({ event_type, user_id, details: { ...details, admin_email: adminEmail } });

    const findUser = async (emailRaw: unknown) => {
      const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
      if (!email || email.length > 255 || !email.includes("@")) return null;
      const { data } = await db.from("profiles").select("id, email").ilike("email", email).maybeSingle();
      return data;
    };

    if (body.action === "overview") {
      const now = Date.now();
      const since7 = new Date(now - 7 * 864e5).toISOString();
      const since24 = now - 864e5;
      const { data: evs } = await db
        .from("security_events")
        .select("event_type, created_at")
        .in("event_type", COUNTED)
        .gte("created_at", since7)
        .limit(20000);
      const counts: Record<string, { day: number; week: number }> = {};
      for (const t of COUNTED) counts[t] = { day: 0, week: 0 };
      for (const e of evs ?? []) {
        counts[e.event_type].week++;
        if (new Date(e.created_at).getTime() >= since24) counts[e.event_type].day++;
      }

      const { data: profiles } = await db.from("profiles").select("id, email").limit(10000);
      const byHash = new Map<string, string>();
      const byId = new Map<string, string>();
      for (const p of profiles ?? []) {
        if (p.email) {
          byHash.set(await sha256(p.email.trim().toLowerCase()), p.email);
          byId.set(p.id, p.email);
        }
      }

      const { data: locks } = await db
        .from("login_throttle")
        .select("key, locked_until, fail_count")
        .gt("locked_until", new Date().toISOString())
        .order("locked_until", { ascending: false });
      const locked = (locks ?? []).map((l) => {
        const [prefix, ...rest] = l.key.split(":");
        const val = rest.join(":");
        const type = prefix.startsWith("reset") ? "reset" : prefix.startsWith("signup") ? "signup" : prefix === "email" ? "email" : prefix === "ip" ? "ip" : prefix;
        return {
          key: l.key,
          type,
          email: prefix.endsWith("email") ? byHash.get(val) ?? null : null,
          ip: prefix.endsWith("ip") ? val : null,
          locked_until: l.locked_until,
        };
      });

      const { data: recent } = await db
        .from("security_events")
        .select("id, user_id, email_hash, ip, user_agent, event_type, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      const events = (recent ?? []).map((e) => ({
        id: e.id,
        event_type: e.event_type,
        created_at: e.created_at,
        ip: e.ip,
        user_agent: e.user_agent,
        email: (e.user_id && byId.get(e.user_id)) || (e.email_hash && byHash.get(e.email_hash)) || null,
      }));

      return json({ counts, locked, events });
    }

    if (body.action === "unlock") {
      const key = typeof body.key === "string" ? body.key : "";
      if (!key || key.length > 300) return json({ error: "Invalid input" }, 400);
      const { error } = await db
        .from("login_throttle")
        .update({ fail_count: 0, lock_level: 0, locked_until: null, window_start: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) return json({ error: "Update failed" }, 500);
      await log("admin_unlock", { key });
      return json({ ok: true });
    }

    if (body.action === "user_sessions") {
      const p = await findUser(body.email);
      if (!p) return json({ found: false });
      const [{ data: sessions }, { data: devices }] = await Promise.all([
        db.from("user_sessions").select("session_id, user_agent, ip, created_at, last_seen_at").eq("user_id", p.id).is("revoked_at", null).order("last_seen_at", { ascending: false }),
        db.from("trusted_devices").select("id, user_agent, created_at, last_seen_at").eq("user_id", p.id).is("revoked_at", null).order("last_seen_at", { ascending: false }),
      ]);
      return json({ found: true, email: p.email, sessions: sessions ?? [], devices: devices ?? [] });
    }

    if (body.action === "revoke_user") {
      const p = await findUser(body.email);
      if (!p) return json({ error: "Account not found" }, 404);
      const nowIso = new Date().toISOString();
      const { data: sessions } = await db.from("user_sessions").select("session_id").eq("user_id", p.id).is("revoked_at", null);
      for (const s of sessions ?? []) {
        await db.from("user_sessions").update({ revoked_at: nowIso, revoke_reason: "admin_revoked" }).eq("session_id", s.session_id);
        await db.rpc("revoke_auth_session", { _session_id: s.session_id });
      }
      await db.from("trusted_devices").update({ revoked_at: nowIso }).eq("user_id", p.id).is("revoked_at", null);
      await log("admin_revoked", { sessions: sessions?.length ?? 0 }, p.id);
      return json({ ok: true, revoked: sessions?.length ?? 0 });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-security error", e);
    return json({ error: "Server error" }, 500);
  }
});
