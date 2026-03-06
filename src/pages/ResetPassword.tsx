import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useNavigate, Link } from "react-router-dom";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

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
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); }
    else { setSuccess(true); setTimeout(() => navigate("/family"), 2000); }
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="card-kiki py-8 space-y-4">
            <p className="font-body text-foreground">This password reset link is invalid or has expired.</p>
            <Link to="/auth" className="btn-copper inline-block px-6 py-3 text-sm uppercase tracking-widest">
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-copper mb-4">
            <ShieldIcon size={32} className="stroke-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-foreground uppercase">
            Set New Password
          </h1>
        </div>

        <div className="card-kiki">
          {success ? (
            <div className="text-center py-4">
              <p className="text-success font-body">Password updated! Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full touch-target btn-copper py-3 text-sm uppercase tracking-widest disabled:opacity-50">
                {submitting ? "..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
