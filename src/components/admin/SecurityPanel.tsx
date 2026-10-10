import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Counts = Record<string, { day: number; week: number }>;
type Locked = { key: string; type: string; email: string | null; ip: string | null; locked_until: string };
type Ev = { id: number; event_type: string; created_at: string; ip: string | null; user_agent: string | null; email: string | null };
type Lookup = {
  found: boolean;
  email?: string;
  sessions?: { session_id: string; user_agent: string | null; ip: string | null; created_at: string; last_seen_at: string }[];
  devices?: { id: string; user_agent: string | null; created_at: string; last_seen_at: string }[];
};

export const EVENT_LABELS: Record<string, string> = {
  login_failed: "Wrong password",
  login_success: "Signed in",
  login_success_oauth: "Signed in with Google",
  login_blocked_locked: "Sign-in blocked while paused",
  account_locked: "Account paused",
  ip_locked: "Network paused",
  stepup_sent: "Sign-in code sent",
  stepup_resent: "Sign-in code sent again",
  stepup_verified: "Sign-in code accepted",
  stepup_wrong_code: "Wrong sign-in code",
  stepup_device_mismatch: "Code entered on a different device",
  device_trusted_first: "First device trusted",
  session_registered: "Session started",
  session_revoked_limit: "Signed out (too many devices)",
  session_revoked_self: "Signed out",
  session_device_mismatch: "Session used on a different device",
  register_rejected_not_oauth: "Unapproved sign-in blocked",
  user_reported_signin: "Parent said it wasn't them",
  reset_requested: "Password reset requested",
  reset_requested_unknown: "Reset requested for unknown email",
  reset_throttled: "Too many reset requests",
  reset_device_mismatch: "Reset opened on a different device",
  password_reset_completed: "Password reset",
  password_changed: "Password changed",
  password_change_bad_current: "Wrong current password",
  signup_requested: "New signup",
  signup_failed: "Signup failed",
  signup_throttled: "Too many signups",
  hibp_unavailable: "Breach check unavailable",
  pin_set: "Parent PIN set",
  pin_reset: "Parent PIN reset",
  pin_wrong: "Wrong parent PIN",
  pin_locked: "Parent PIN locked",
  pin_reset_bad_password: "Wrong password on PIN reset",
  admin_unlock: "Unlocked by admin",
  admin_revoked: "Signed out everywhere by admin",
};

const TILES: { key: string; label: string }[] = [
  { key: "login_failed", label: "Wrong passwords" },
  { key: "account_locked", label: "Accounts paused" },
  { key: "ip_locked", label: "Networks paused" },
  { key: "stepup_sent", label: "Sign-in codes sent" },
  { key: "stepup_device_mismatch", label: "Codes on other device" },
  { key: "user_reported_signin", label: "Reported sign-ins" },
  { key: "pin_locked", label: "PIN lockouts" },
];

const fmt = (d: string) => new Date(d).toLocaleString();
const friendlyDevice = (ua: string | null): string => {
  if (!ua) return "Unknown device";
  const s = ua.toLowerCase();
  const browser = s.includes("edg/") ? "Edge"
    : s.includes("chrome/") && !s.includes("chromium") ? "Chrome"
    : s.includes("safari/") && !s.includes("chrome") ? "Safari"
    : s.includes("firefox/") ? "Firefox"
    : s.includes("chromium") ? "Chromium"
    : "Browser";
  const os = s.includes("iphone") ? "iPhone"
    : s.includes("ipad") ? "iPad"
    : s.includes("android") ? "Android"
    : s.includes("mac os") || s.includes("macintosh") ? "Mac"
    : s.includes("windows") ? "Windows"
    : s.includes("linux") ? "Linux"
    : null;
  return os ? `${browser} on ${os}` : "Unknown device";
};
const shortUa = (ua: string | null) => friendlyDevice(ua);
const pill = "min-h-11 rounded-full px-5 font-display text-xs uppercase tracking-wider disabled:opacity-50";

export function SecurityPanel() {
  const { adminSession } = useAdminAuth();
  const token = adminSession?.access_token;
  const [counts, setCounts] = useState<Counts | null>(null);
  const [locked, setLocked] = useState<Locked[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupMsg, setLookupMsg] = useState("");

  const call = useCallback(async (body: Record<string, unknown>) => {
    if (!token) return { data: null, error: new Error("no token") };
    return supabase.functions.invoke("admin-security", { body, headers: { "x-admin-token": token } });
  }, [token]);

  const load = useCallback(async () => {
    const { data, error: err } = await call({ action: "overview" });
    if (err || !data?.counts) { setError("Could not load security data. Try signing out of the admin dashboard and back in."); return; }
    setError(null);
    setCounts(data.counts);
    setLocked(data.locked ?? []);
    setEvents(data.events ?? []);
  }, [call]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const unlock = async (key: string) => {
    setBusy(key);
    const { error: err } = await call({ action: "unlock", key });
    setBusy(null);
    if (err) setError("Update failed. Please try again.");
    else load();
  };

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupMsg(""); setLookup(null);
    const { data, error: err } = await call({ action: "user_sessions", email: lookupEmail });
    if (err || !data) { setLookupMsg("Could not check that account."); return; }
    if (!data.found) { setLookupMsg("No account with that email."); return; }
    setLookup(data);
  };

  const revokeAll = async () => {
    if (!lookup?.email || !window.confirm(`Sign ${lookup.email} out on every device?`)) return;
    setBusy("revoke");
    const { data, error: err } = await call({ action: "revoke_user", email: lookup.email });
    setBusy(null);
    if (err || !data?.ok) { setLookupMsg("Could not sign this account out."); return; }
    setLookupMsg(`Signed out everywhere (${data.revoked} session${data.revoked === 1 ? "" : "s"}).`);
    setLookup({ ...lookup, sessions: [], devices: [] });
    load();
  };

  if (!counts && !error) return <p className="font-body text-sm text-charcoal/70">Loading security data...</p>;

  return (
    <div className="space-y-6">
      {error && <p className="font-body text-sm text-destructive">{error}</p>}

      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {TILES.map((t) => (
            <div key={t.key} className="card-kiki border-primary/15 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-display">{t.label}</p>
              <p className="text-2xl font-bold mt-1">{counts[t.key]?.day ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{counts[t.key]?.week ?? 0} in 7 days</p>
            </div>
          ))}
        </div>
      )}

      <div className="card-kiki border-primary/15 p-5">
        <h3 className="font-display uppercase text-base text-charcoal mb-3">Locked right now</h3>
        {locked.length === 0 ? (
          <p className="font-body text-sm text-charcoal/70">Nothing is locked.</p>
        ) : (
          <ul className="space-y-2">
            {locked.map((l) => (
              <li key={l.key} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-primary/15 p-3">
                <div className="flex-1 min-w-0 font-body text-sm">
                  <span className="rounded-full bg-primary/15 px-3 py-1 font-display text-[11px] uppercase tracking-widest text-charcoal mr-2">{l.type}</span>
                  <span className="break-all text-charcoal">{l.email ?? l.ip ?? "Unknown account"}</span>
                  <span className="block text-xs text-charcoal/60 mt-1">Until {fmt(l.locked_until)}</span>
                </div>
                <button type="button" disabled={busy === l.key} onClick={() => unlock(l.key)} className={`${pill} bg-primary text-charcoal`}>Unlock</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-kiki border-primary/15 p-5">
        <h3 className="font-display uppercase text-base text-charcoal mb-3">Check an account</h3>
        <form onSubmit={check} className="flex flex-col sm:flex-row gap-2">
          <input type="email" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} placeholder="parent@example.com" aria-label="Account email"
            className="flex-1 rounded-xl border border-primary/20 bg-card min-h-12 px-4 font-body text-charcoal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <button type="submit" disabled={!lookupEmail} className={`${pill} border-2 border-primary/35 text-charcoal hover:bg-primary/10`}>Check</button>
        </form>
        {lookupMsg && <p className="font-body text-sm text-charcoal/70 mt-3">{lookupMsg}</p>}
        {lookup?.found && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="font-display uppercase text-xs tracking-widest text-charcoal/70 mb-2">Active sessions ({lookup.sessions?.length ?? 0})</p>
              {(lookup.sessions ?? []).map((s) => (
                <div key={s.session_id} className="rounded-xl border border-primary/15 p-3 mb-2 font-body text-xs text-charcoal/80 break-words">
                  {shortUa(s.user_agent)}<br />IP {s.ip ?? "unknown"}, started {fmt(s.created_at)}, last seen {fmt(s.last_seen_at)}
                </div>
              ))}
            </div>
            <div>
              <p className="font-display uppercase text-xs tracking-widest text-charcoal/70 mb-2">Trusted devices ({lookup.devices?.length ?? 0})</p>
              {(lookup.devices ?? []).map((d) => (
                <div key={d.id} className="rounded-xl border border-primary/15 p-3 mb-2 font-body text-xs text-charcoal/80 break-words">
                  {shortUa(d.user_agent)}<br />Trusted {fmt(d.created_at)}, last seen {fmt(d.last_seen_at)}
                </div>
              ))}
            </div>
            <button type="button" disabled={busy === "revoke"} onClick={revokeAll} className={`${pill} bg-destructive text-destructive-foreground`}>Sign out everywhere</button>
          </div>
        )}
      </div>

      <div className="card-kiki border-primary/15 p-5">
        <h3 className="font-display uppercase text-base text-charcoal mb-3">Recent activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body min-w-[560px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal/60 font-display">
                <th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Event</th><th className="py-2 pr-3">Account</th><th className="py-2">Device</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-primary/10 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-charcoal/70">{fmt(e.created_at)}</td>
                  <td className="py-2 pr-3 text-charcoal">{EVENT_LABELS[e.event_type] ?? e.event_type.replace(/_/g, " ")}</td>
                  <td className="py-2 pr-3 break-all text-charcoal/80">{e.email ?? "-"}</td>
                  <td className="py-2 text-charcoal/60 text-xs">{shortUa(e.user_agent)}{e.ip ? ` (${e.ip})` : ""}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={4} className="py-3 text-charcoal/70">No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
