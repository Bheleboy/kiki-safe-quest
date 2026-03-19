import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { isAllowedAuthDomain } from "@/lib/domain";

import { z } from "zod";

type Mode = "login" | "signup" | "forgot";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Name is required").max(50),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { signUp, signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || "/family";

  // If already logged in, redirect
  useEffect(() => {
    if (user) navigate(returnTo, { replace: true });
  }, [user, navigate, returnTo]);

  // Block auth on non-production domains
  const domainBlocked = !isAllowedAuthDomain();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (domainBlocked) { setError("Authentication is only available on the official website."); return; }
    setSubmitting(true);

    try {
      if (mode === "signup") {
        if (!consent || !guardianConsent) { setError("You must confirm both checkboxes to create an account."); setSubmitting(false); return; }
        const parsed = signupSchema.parse({ firstName, email, password });
        const { error: err } = await signUp(parsed.email, parsed.password, parsed.firstName, "parent");
        if (err) { setError(err.message); }
        else { setMessage("Check your email for a verification link!"); }
      } else if (mode === "login") {
        loginSchema.parse({ email, password });
        const { error: err } = await signIn(email.trim(), password);
        if (err) { setError(err.message); }
        else { navigate(returnTo); }
      } else {
        z.string().email().parse(email.trim());
        const { error: err } = await resetPassword(email.trim());
        if (err) { setError(err.message); }
        else { setMessage("Check your email for a password reset link."); }
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || "Invalid input");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-copper mb-4">
              <ShieldIcon size={32} className="stroke-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-wide text-foreground uppercase">
            Kiki Warrior
          </h1>
          <p className="font-body text-muted-foreground text-sm mt-1">
            {mode === "signup" ? "Create your parent account" : "Internet Safety for Families"}
          </p>
        </div>

        {/* Card */}
        <div className="card-kiki">
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider mb-6 text-center">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Parent Account" : "Reset Password"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardianConsent}
                    onChange={(e) => setGuardianConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span className="font-body text-xs text-muted-foreground leading-relaxed">
                    I confirm that I am the parent or legal guardian of the minor(s) for whom I am creating sub-accounts. I understand that I am solely responsible for overseeing their use of this platform, including all content accessed and data shared. I accept full responsibility for the safety and conduct of the minors under my care while using this service.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span className="font-body text-xs text-muted-foreground leading-relaxed">
                    I agree to the collection and processing of personal data (including that of the minors in my care) in accordance with the{" "}
                    <Link to="/privacy" target="_blank" className="text-primary hover:underline font-semibold">
                      Privacy Policy
                    </Link>{" "}
                    and the{" "}
                    <Link to="/terms" target="_blank" className="text-primary hover:underline font-semibold">
                      Terms of Service
                    </Link>
                    , which incorporate our obligations under{" "}
                    <a href="https://popia.co.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      POPIA
                    </a>{" "}and{" "}
                    <a href="https://gdpr.eu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      GDPR
                    </a>
                    . I consent to receive course-related communications.
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm font-body text-success bg-success/10 rounded-lg px-4 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full touch-target btn-copper py-3 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {submitting
                ? "..."
                : mode === "login"
                ? "Sign In"
                : mode === "signup"
                ? "Create Account"
                : "Send Reset Link"}
            </button>
          </form>


          <div className="mt-6 space-y-2 text-center">
            {mode === "login" && (
              <>
                <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="text-sm font-body text-primary hover:underline">
                  Forgot password?
                </button>
                <p className="text-sm font-body text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className="text-primary hover:underline font-semibold">
                    Sign Up
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-sm font-body text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-primary hover:underline font-semibold">
                  Sign In
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-sm font-body text-primary hover:underline">
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
