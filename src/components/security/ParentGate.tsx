import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eyebrow } from "@/components/ui/editorial";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { callFn, useAuth } from "@/hooks/useAuth";

const UNLOCK_KEY = "kw_parent_unlock";

export function readUnlock(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    const raw = sessionStorage.getItem(UNLOCK_KEY);
    if (!raw) return false;
    const v = JSON.parse(raw) as { uid: string; until: number };
    return v.uid === userId && v.until > Date.now();
  } catch {
    return false;
  }
}
function writeUnlock(userId: string, until: number) {
  try { sessionStorage.setItem(UNLOCK_KEY, JSON.stringify({ uid: userId, until })); } catch { /* ignore */ }
}

type Mode = "loading" | "create" | "enter" | "forgot" | "unlocked" | "error";

export function ParentGate({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [unlocked, setUnlocked] = useState(() => readUnlock(user?.id));
  useEffect(() => {
    if (!unlocked || !user) return;
    const iv = window.setInterval(() => { if (!readUnlock(user.id)) setUnlocked(false); }, 30_000);
    return () => window.clearInterval(iv);
  }, [unlocked, user]);
  if (profile?.is_admin || unlocked) return <>{children}</>;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md"><PinPad onUnlocked={() => setUnlocked(true)} /></div>
    </div>
  );
}

/** PIN create / unlock / reset UI. Calls onUnlocked once the server confirms. */
export function PinPad({ onUnlocked, onCancel }: { onUnlocked: () => void; onCancel?: () => void }) {
  const { user, session } = useAuth();
  const [mode, setMode] = useState<Mode>(() => (readUnlock(user?.id) ? "unlocked" : "loading"));
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const token = session?.access_token;

  useEffect(() => {
    if (mode !== "loading" || !token) return;
    let cancelled = false;
    callFn("parent-pin", { action: "status" }, token)
      .then((r) => {
        if (cancelled) return;
        if (!r.ok) { setMode("error"); return; }
        setMode(r.data?.has_pin ? "enter" : "create");
      })
      .catch(() => !cancelled && setMode("error"));
    return () => { cancelled = true; };
  }, [mode, token]);

  useEffect(() => { if (mode === "unlocked") onUnlocked(); }, [mode, onUnlocked]);

  const submit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token || !user) return;
    if (pin.length !== 4) { setError("Enter 4 digits."); return; }
    setBusy(true); setError("");
    const body = mode === "enter" ? { action: "verify", pin } : { action: "set", pin, password: mode === "forgot" ? password : undefined };
    try {
      const r = await callFn("parent-pin", body, token);
      if (r.ok && r.data?.unlock_until) {
        writeUnlock(user.id, r.data.unlock_until);
        setPin(""); setPassword("");
        setMode("unlocked");
      } else {
        setError(r.data?.message || "That did not work. Please try again.");
        setPin("");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [token, user, pin, mode, password]);

  if (mode === "unlocked") return null;

  const heading = mode === "create" ? "Set a parent PIN" : mode === "forgot" ? "Reset your PIN" : "Parent PIN";
  const intro =
    mode === "create" ? "Set a 4-digit parent PIN so your child can't change settings."
    : mode === "forgot" ? "Enter your account password and choose a new 4-digit PIN."
    : "This area is for parents. Enter your 4-digit PIN.";

  return (
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <ShieldIcon size={32} className="stroke-primary-foreground" />
          </div>
          <Eyebrow>Parents only</Eyebrow>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-charcoal uppercase leading-[0.95]">{heading}</h1>
        </div>
        <div className="card-kiki">
          {mode === "loading" ? (
            <div className="flex justify-center py-6"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : mode === "error" ? (
            <div className="space-y-4 text-center">
              <p className="font-body text-charcoal/70">We could not check your parent PIN. Please try again.</p>
              <Button variant="ghost" onClick={() => setMode("loading")} className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest">Try again</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <p className="font-body text-sm text-charcoal/70 leading-relaxed text-center">{intro}</p>
              {mode === "forgot" && (
                <div>
                  <label className="font-body text-sm font-medium text-charcoal/70 block mb-1.5" htmlFor="pin-password">Account password</label>
                  <input id="pin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-primary/20 bg-card min-h-12 px-4 py-3 font-body text-charcoal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              )}
              <div className="flex justify-center">
                <InputOTP maxLength={4} value={pin} onChange={setPin} inputMode="numeric" autoFocus aria-label="4-digit parent PIN">
                  <InputOTPGroup>
                    {[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}
              <Button variant="ghost" type="submit" disabled={busy || pin.length !== 4 || (mode === "forgot" && !password)}
                className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50">
                {busy ? "..." : mode === "enter" ? "Unlock" : "Save PIN"}
              </Button>
              <div className="text-center space-y-1">
                {mode === "enter" && (
                  <Button type="button" variant="ghost" onClick={() => { setMode("forgot"); setError(""); setPin(""); }} className="text-sm font-body text-primary hover:underline">Forgot PIN?</Button>
                )}
                {mode === "forgot" && (
                  <Button type="button" variant="ghost" onClick={() => { setMode("enter"); setError(""); setPin(""); }} className="text-sm font-body text-primary hover:underline">Back</Button>
                )}
                <div>
                  {onCancel ? (
                    <Button type="button" variant="ghost" onClick={onCancel} className="text-sm font-body text-charcoal/70 hover:underline">Cancel</Button>
                  ) : (
                    <Button asChild variant="ghost" className="text-sm font-body text-charcoal/70 hover:underline">
                      <Link to="/family">Back to lessons</Link>
                    </Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
  );
}

/** Runs an action only after the parent PIN is unlocked; renders the PIN pad in a dialog. */
export function useParentPin() {
  const { user, profile } = useAuth();
  const [pending, setPending] = useState<null | (() => void)>(null);
  const guard = useCallback((action: () => void) => {
    if (profile?.is_admin || readUnlock(user?.id)) action();
    else setPending(() => action);
  }, [user, profile]);
  const onUnlocked = useCallback(() => {
    setPending((p) => { if (p) setTimeout(p, 0); return null; });
  }, []);
  const dialog = (
    <Dialog open={!!pending} onOpenChange={(o) => { if (!o) setPending(null); }}>
      <DialogContent className="rounded-2xl border border-primary/15 bg-background max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Parent PIN</DialogTitle>
        {pending && <PinPad onUnlocked={onUnlocked} onCancel={() => setPending(null)} />}
      </DialogContent>
    </Dialog>
  );
  return { guard, dialog };
}
