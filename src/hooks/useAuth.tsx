import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceSecret, loadChallenge, saveChallenge, type PendingChallenge } from "@/lib/device";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export type SignInResult = {
  error: { message: string } | null;
  locked?: boolean;
  retryAfterSeconds?: number;
  captchaRequired?: boolean;
  stepUp?: boolean;
};

type SimpleResult = { error: { message: string } | null };

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  pendingChallenge: PendingChallenge | null;
  securityMessage: string;
  clearSecurityMessage: () => void;
  signUp: (email: string, password: string, firstName: string, ageBand: string, turnstileToken?: string) => Promise<SignInResult>;
  signOutWithMessage: (message: string, reason?: string) => Promise<void>;
  setSecurityNotice: (message: string) => void;
  signIn: (email: string, password: string, turnstileToken?: string) => Promise<SignInResult>;
  verifyChallenge: (code: string) => Promise<SimpleResult>;
  resendChallenge: () => Promise<SimpleResult>;
  cancelChallenge: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<SimpleResult>;
  updatePassword: (password: string) => Promise<SimpleResult>;
  fetchProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const SIGNED_OUT_MSG = "You have been signed out for your security. Please sign in again.";
const CHECK_INTERVAL_MS = 3 * 60 * 1000;

export async function callFn(name: string, body: Record<string, unknown>, accessToken?: string) {
  const res = await fetch(`${FN_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${accessToken ?? ANON}`,
    },
    body: JSON.stringify({ ...body, device_secret: getDeviceSecret() }),
  });
  let data: any = {};
  try { data = await res.json(); } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, data };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingChallenge, setPendingChallenge] = useState<PendingChallenge | null>(() => loadChallenge());
  const [securityMessage, setSecurityMessage] = useState("");
  const lastAuthAttempt = useRef<number>(0);
  const manualSignOut = useRef(false);
  const hadUser = useRef(false);
  const sessionRef = useRef<Session | null>(null);
  const navigate = useNavigate();

  const setChallenge = useCallback((c: PendingChallenge | null) => {
    saveChallenge(c);
    setPendingChallenge(c);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) {
        console.warn("[useAuth] fetchProfile error:", error.message);
        return;
      }
      setProfile(data ?? null);
    } catch (e) {
      console.warn("[useAuth] fetchProfile threw:", e);
    }
  }, []);

  const forceSignOut = useCallback(async (message = SIGNED_OUT_MSG) => {
    manualSignOut.current = true;
    try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
    manualSignOut.current = false;
    hadUser.current = false;
    sessionRef.current = null;
    setUser(null);
    setProfile(null);
    setSession(null);
    setSecurityMessage(message);
    navigate("/auth", { replace: true });
  }, [navigate]);

  /** Returns "ok" | "invalid" | "step_up" | "error" */
  const freshTokens = useRef<string | null>(null);
  const checkSession = useCallback(async (s: Session, allowRegister: boolean) => {
    try {
      const r = await callFn("session-check", {}, s.access_token);
      if (r.data?.valid) return "ok";
      if (r.status >= 500) return "error";
      if (allowRegister && r.data?.reason === "not_registered") {
        const reg = await callFn("session-check", { action: "register" }, s.access_token);
        if (reg.data?.valid) return "ok";
        if (reg.data?.step_up && reg.data?.challenge_id) {
          setChallenge({ challenge_id: reg.data.challenge_id, masked_email: reg.data.masked_email ?? "", oauth: true });
          return "step_up";
        }
      }
      return "invalid";
    } catch {
      return "error"; // network hiccup: keep the session; the database still enforces registration
    }
  }, [setChallenge]);

  useEffect(() => {
    let mounted = true;
    const safetyTimer = window.setTimeout(() => { if (mounted) setLoading(false); }, 15000);
    let lastSessionId: string | null = null;

    const finish = (s: Session | null, event?: string) => {
      if (!mounted) return;
      if (!s) {
        if (event === "SIGNED_OUT" && hadUser.current && !manualSignOut.current) {
          // Includes failed token refreshes.
          setSecurityMessage(SIGNED_OUT_MSG);
        }
        hadUser.current = false;
        sessionRef.current = null;
        lastSessionId = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      sessionRef.current = s;
      setSession(s);
      // Token refreshes keep the same session: no need to re-check.
      if (lastSessionId === s.access_token.split(".")[1] && event === "TOKEN_REFRESHED") return;
      if (hadUser.current && event === "TOKEN_REFRESHED") return;
      // Password recovery sessions are only used to set a new password on /reset-password.
      if (event === "PASSWORD_RECOVERY" || window.location.pathname === "/reset-password") {
        setLoading(false);
        return;
      }
      lastSessionId = s.access_token.split(".")[1];
      setTimeout(async () => {
        if (!mounted) return;
        const fresh = freshTokens.current === s.access_token;
        freshTokens.current = null;
        const result = fresh ? "ok" : await checkSession(s, true);
        if (!mounted) return;
        if (result === "invalid") {
          await forceSignOut();
          setLoading(false);
          return;
        }
        if (result === "step_up") {
          // Keep the session locally but do not expose the user until verified.
          setUser(null);
          setLoading(false);
          return;
        }
        hadUser.current = true;
        setUser(s.user);
        await fetchProfile(s.user.id);
        if (mounted) setLoading(false);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => finish(s, event));

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile, checkSession, forceSignOut]);

  // Periodic and focus-based checks
  useEffect(() => {
    const run = async () => {
      const s = sessionRef.current;
      if (!s || !hadUser.current) return;
      const r = await checkSession(s, false);
      if (r === "invalid") await forceSignOut();
    };
    const iv = window.setInterval(run, CHECK_INTERVAL_MS);
    const onVis = () => { if (document.visibilityState === "visible") run(); };
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [checkSession, forceSignOut]);

  const signUp = async (email: string, password: string, firstName: string, ageBand: string, turnstileToken?: string): Promise<SignInResult> => {
    const now = Date.now();
    if (now - lastAuthAttempt.current < 2000) return { error: { message: "Please wait before trying again." } };
    lastAuthAttempt.current = now;
    try {
      const r = await callFn("secure-signup", { email, password, first_name: firstName, age_band: ageBand, turnstile_token: turnstileToken });
      const d = r.data ?? {};
      if (d.error === "captcha_required") return { error: { message: "Please complete the security check and try again." }, captchaRequired: true };
      if (d.error === "locked") return { error: { message: d.message || "Too many attempts. Please try again later." }, locked: true };
      if (!r.ok) return { error: { message: d.message || "Could not create the account. Please try again." } };
      return { error: null };
    } catch {
      return { error: { message: "Could not reach the server. Please try again." } };
    }
  };

  const applyTokens = async (data: any): Promise<SimpleResult> => {
    // The server registered this session moments ago; skip the redundant check.
    freshTokens.current = data.access_token;
    const { error } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
    return { error: error ? { message: "Sign-in failed. Please try again." } : null };
  };

  const signIn = async (email: string, password: string, turnstileToken?: string): Promise<SignInResult> => {
    const now = Date.now();
    if (now - lastAuthAttempt.current < 2000) return { error: { message: "Please wait before trying again." } };
    lastAuthAttempt.current = now;
    setSecurityMessage("");
    try {
      const r = await callFn("secure-login", { email, password, turnstile_token: turnstileToken });
      const d = r.data ?? {};
      if (d.error === "locked") {
        const mins = Math.max(1, Math.ceil((d.retry_after_seconds ?? 60) / 60));
        return { error: { message: `Too many attempts. Please wait ${mins} minute${mins === 1 ? "" : "s"} and try again.` }, locked: true, retryAfterSeconds: d.retry_after_seconds };
      }
      if (d.error === "captcha_required") {
        return { error: { message: "Please complete the security check and try again." }, captchaRequired: true };
      }
      if (d.step_up && d.challenge_id) {
        setChallenge({ challenge_id: d.challenge_id, masked_email: d.masked_email ?? "" });
        return { error: null, stepUp: true };
      }
      if (d.access_token && d.refresh_token) return await applyTokens(d);
      return { error: { message: d.message || "Invalid email or password." } };
    } catch {
      return { error: { message: "Could not reach the server. Please try again." } };
    }
  };

  const verifyChallenge = async (code: string): Promise<SimpleResult> => {
    if (!pendingChallenge) return { error: { message: "Please sign in again." } };
    const token = pendingChallenge.oauth ? sessionRef.current?.access_token : undefined;
    try {
      const r = await callFn("verify-login-challenge", { challenge_id: pendingChallenge.challenge_id, code }, token);
      const d = r.data ?? {};
      if (!r.ok) {
        if (d.error === "challenge_invalid" || d.error === "device_mismatch" || d.error === "session_mismatch") setChallenge(null);
        return { error: { message: d.message || "That code did not work. Please try again." } };
      }
      setChallenge(null);
      if (d.access_token) return await applyTokens(d);
      // OAuth: existing session is now registered
      const s = sessionRef.current;
      if (s) {
        hadUser.current = true;
        setUser(s.user);
        await fetchProfile(s.user.id);
      }
      return { error: null };
    } catch {
      return { error: { message: "Could not reach the server. Please try again." } };
    }
  };

  const resendChallenge = async (): Promise<SimpleResult> => {
    if (!pendingChallenge) return { error: { message: "Please sign in again." } };
    try {
      const r = await callFn("verify-login-challenge", { action: "resend", challenge_id: pendingChallenge.challenge_id });
      const d = r.data ?? {};
      if (r.ok) return { error: null };
      if (d.error === "resend_wait") return { error: { message: `Please wait ${d.retry_after_seconds} seconds before asking for a new code.` } };
      if (d.error === "challenge_invalid") setChallenge(null);
      return { error: { message: d.message || "Could not send a new code." } };
    } catch {
      return { error: { message: "Could not reach the server. Please try again." } };
    }
  };

  const cancelChallenge = async () => {
    const wasOauth = pendingChallenge?.oauth;
    setChallenge(null);
    if (wasOauth) {
      manualSignOut.current = true;
      try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
      manualSignOut.current = false;
    }
  };

  const revokeSelf = async (reason: string) => {
    const s = sessionRef.current;
    if (!s) return;
    try { await callFn("session-check", { action: "revoke_self", reason }, s.access_token); } catch { /* ignore */ }
  };

  const signOut = async () => {
    manualSignOut.current = true;
    await revokeSelf("sign_out");
    try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
    manualSignOut.current = false;
    hadUser.current = false;
    sessionRef.current = null;
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const signOutWithMessage = async (message: string, reason = "inactivity") => {
    await revokeSelf(reason);
    await forceSignOut(message);
  };

  const resetPassword = async (email: string) => {
    try {
      const r = await callFn("secure-reset-request", { email });
      if (!r.ok && r.status !== 200) return { error: { message: "Could not send the link. Please try again." } };
      return { error: null };
    } catch {
      return { error: { message: "Could not reach the server. Please try again." } };
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? { message: error.message } : null };
  };

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, pendingChallenge, securityMessage,
      clearSecurityMessage: () => setSecurityMessage(""),
      signOutWithMessage, setSecurityNotice: setSecurityMessage,
      signUp, signIn, verifyChallenge, resendChallenge, cancelChallenge,
      signOut, resetPassword, updatePassword, fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
