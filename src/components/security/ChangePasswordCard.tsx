import { useState } from "react";
import { Button } from "@/components/ui/button";
import { callFn, useAuth } from "@/hooks/useAuth";

const inputCls =
  "w-full rounded-xl border border-primary/20 bg-card min-h-12 px-4 py-3 font-body text-charcoal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50";

export function ChangePasswordCard() {
  const { session } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (next.length < 10) { setError("Password must be at least 10 characters."); return; }
    if (next !== confirm) { setError("Passwords do not match."); return; }
    if (!session) return;
    setBusy(true);
    try {
      const r = await callFn("change-password", { current_password: current, new_password: next }, session.access_token);
      if (r.ok) { setMessage("Password updated. Other devices have been signed out."); setCurrent(""); setNext(""); setConfirm(""); }
      else setError(r.data?.message || "Could not update the password.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-card border border-primary/15 p-5 sm:p-6">
      <h2 className="font-display uppercase text-xl sm:text-2xl text-charcoal mb-4">Change password</h2>
      <form onSubmit={submit} className="space-y-3">
        <input type="password" autoComplete="current-password" placeholder="Current password" aria-label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        <input type="password" autoComplete="new-password" placeholder="New password" aria-label="New password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
        <input type="password" autoComplete="new-password" placeholder="Confirm new password" aria-label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        <p className="font-body text-xs text-charcoal/70 leading-relaxed">At least 10 characters. Avoid common or reused passwords.</p>
        {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}
        {message && <p className="text-sm font-body text-success bg-success/10 rounded-lg px-4 py-2">{message}</p>}
        <Button type="submit" disabled={busy || !current || !next} className="rounded-full bg-primary text-charcoal font-display uppercase tracking-wider min-h-12 px-6 adventure-button disabled:opacity-50">
          {busy ? "..." : "Update password"}
        </Button>
      </form>
    </section>
  );
}
