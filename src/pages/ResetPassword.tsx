import { Eyebrow, PublicPage } from "@/components/ui/editorial";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useNavigate, Link } from "react-router-dom";
import { callFn, useAuth } from "@/hooks/useAuth";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { setSecurityNotice } = useAuth();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
          setChecking(false);
        }
      }
    );

    // Also check hash for type=recovery (fallback)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
      setChecking(false);
    }

    // Give it a moment to process the token, then stop checking
    const timeout = setTimeout(() => {
      setChecking(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 10) { setError("Password must be at least 10 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("This password reset link is invalid or has expired."); return; }
      const r = await callFn("complete-password-reset", { new_password: password }, session.access_token);
      if (!r.ok) { setError(r.data?.message || "Could not update the password. Please try again."); return; }
      setSuccess(true);
      try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
      setSecurityNotice("Password updated. Please sign in.");
      navigate("/auth", { replace: true });
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <PublicPage><main className="editorial-focus mx-auto flex w-full flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main></PublicPage>
    );
  }

  if (!isRecovery) {
    return (
      <PublicPage><main className="editorial-focus mx-auto flex w-full flex-col items-center justify-center px-4 py-12 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="card-kiki py-8 space-y-4">
            <p className="font-body text-charcoal">This password reset link is invalid or has expired.</p>
            <Button asChild className="btn-copper adventure-button">
              <Link to="/auth">Back to Sign In <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card"><ArrowUpRight /></span></Link>
            </Button>
          </div>
        </motion.div>
      </main></PublicPage>
    );
  }

  return (
    <PublicPage><main className="editorial-focus mx-auto flex w-full flex-col items-center justify-center px-4 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <ShieldIcon size={32} className="stroke-primary-foreground" />
          </div>
          <Eyebrow>Account security</Eyebrow>
          <h1 className="font-display text-2xl font-bold tracking-wide text-charcoal uppercase">
            Set New Password
          </h1>
        </div>

        <div className="card-kiki">
          {success ? (
            <div className="text-center py-4">
              <p className="text-success font-body">Password updated. Please sign in.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium text-charcoal/70 block mb-1.5">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 font-body text-charcoal placeholder:text-charcoal/70 focus:border-primary focus:outline-none transition-colors" />
                <p className="mt-1.5 font-body text-xs text-charcoal/70 leading-relaxed">At least 10 characters. Avoid common or reused passwords.</p>
              </div>
              <div>
                <label className="font-body text-sm font-medium text-charcoal/70 block mb-1.5">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 font-body text-charcoal placeholder:text-charcoal/70 focus:border-primary focus:outline-none transition-colors" />
              </div>
              {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}
              <Button variant="ghost" type="submit" disabled={submitting} className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50">
                {submitting ? "..." : "Update Password"}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </main></PublicPage>
  );
}
