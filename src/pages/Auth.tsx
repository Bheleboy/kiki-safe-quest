import { Eyebrow, PublicPage } from "@/components/ui/editorial";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { isAllowedAuthDomain, getProductionOrigin } from "@/lib/domain";
import { lovable } from "@/integrations/lovable/index";
import { z } from "zod";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Turnstile } from "@/components/Turnstile";

type Mode = "login" | "signup" | "forgot";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Name is required").max(50),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(10, "Password must be at least 10 characters").max(128),
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
  const [submitting, setSubmitting] = useState(false);
  
  const { signUp, signIn, resetPassword, user, pendingChallenge, verifyChallenge, resendChallenge, cancelChallenge, securityMessage, clearSecurityMessage } = useAuth();
  const [captchaNeeded, setCaptchaNeeded] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [code, setCode] = useState("");
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setError(""); setMessage(""); setSubmitting(true);
    const { error: err } = await verifyChallenge(code);
    setSubmitting(false);
    if (err) { setError(err.message); setCode(""); }
  };

  const handleResend = async () => {
    setError(""); setMessage("");
    const { error: err } = await resendChallenge();
    if (err) setError(err.message); else setMessage("A new code is on its way.");
  };
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || "/family";

  useEffect(() => {
    if (user) navigate(returnTo, { replace: true });
  }, [user, navigate, returnTo]);

  const domainBlocked = !isAllowedAuthDomain();

  const handleGoogleSignIn = async () => {
    if (domainBlocked) { setError("Authentication is only available on the official website."); return; }
    setError("");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: getProductionOrigin(),
    });
    if (error) setError(error.message || "Google sign-in failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (domainBlocked) { setError("Authentication is only available on the official website."); return; }
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const parsed = signupSchema.parse({ firstName, email, password });
        if (parsed.password.trim().toLowerCase() === parsed.email.toLowerCase()) { setError("Password must not be the same as your email."); return; }
        const res = await signUp(parsed.email, parsed.password, parsed.firstName, "parent", turnstileToken);
        setTurnstileToken(undefined);
        const err = res.error;
        if (res.captchaRequired) setCaptchaNeeded(true);
        if (err) { setError(err.message); }
        else { setMessage("Check your email for a verification link!"); }
      } else if (mode === "login") {
        loginSchema.parse({ email, password });
        clearSecurityMessage();
        const res = await signIn(email.trim(), password, turnstileToken);
        setTurnstileToken(undefined);
        if (res.captchaRequired) setCaptchaNeeded(true);
        if (res.stepUp) { setCode(""); setPassword(""); }
        else if (res.error) { setError(res.error.message); }
      } else {
        z.string().email().parse(email.trim());
        const { error: err } = await resetPassword(email.trim());
        if (err) { setError(err.message); }
        else { setMessage("If an account exists, we have sent a link. Open it on this device and browser."); }
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
    <PublicPage><main className="editorial-focus mx-auto flex w-full flex-col items-center justify-center px-4 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
              <ShieldIcon size={32} className="stroke-primary-foreground" />
            </div>
          </Link>
          <Eyebrow>Family account</Eyebrow>
          <h1 className="font-display text-3xl font-bold tracking-wide text-charcoal uppercase">
            Kiki Warrior
          </h1>
          <p className="font-body text-charcoal/70 text-sm mt-1">
            {mode === "signup" ? "Create your parent account" : "Internet Safety for Families"}
          </p>
        </div>

        {/* Card */}
        {pendingChallenge ? (
        <div className="card-kiki">
          <h2 className="font-display text-xl font-semibold text-charcoal uppercase tracking-wider mb-4 text-center">
            Check your email
          </h2>
          <p className="font-body text-sm text-charcoal/70 leading-relaxed text-center mb-6">
            We emailed a code to {pendingChallenge.masked_email || "your email"}. Enter it on this device.
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode} inputMode="numeric" autoFocus aria-label="6-digit sign-in code">
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}
            {message && <p className="text-sm font-body text-success bg-success/10 rounded-lg px-4 py-2">{message}</p>}
            <Button variant="ghost" type="submit" disabled={submitting || code.length !== 6}
              className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50">
              {submitting ? "..." : "Verify and sign in"}
            </Button>
          </form>
          <div className="mt-6 space-y-2 text-center">
            <Button variant="ghost" onClick={handleResend} className="text-sm font-body text-primary hover:underline">
              Send a new code
            </Button>
            <div>
              <Button variant="ghost" onClick={() => { cancelChallenge(); setError(""); setMessage(""); setCode(""); setMode("login"); }} className="text-sm font-body text-charcoal/70 hover:underline">
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
        ) : (
        <div className="card-kiki">
          <h2 className="font-display text-xl font-semibold text-charcoal uppercase tracking-wider mb-6 text-center">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Parent Account" : "Reset Password"}
          </h2>

          {/* Google Sign In */}
          {mode !== "forgot" && (
            <div className="mb-6">
              <Button variant="ghost"
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 font-body text-sm text-charcoal hover:bg-accent transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-charcoal/70 font-body">or</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="font-body text-sm font-medium text-charcoal/70 block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 font-body text-charcoal placeholder:text-charcoal/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="font-body text-sm font-medium text-charcoal/70 block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 font-body text-charcoal placeholder:text-charcoal/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="font-body text-sm font-medium text-charcoal/70 block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 font-body text-charcoal placeholder:text-charcoal/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
                {mode === "signup" && (
                  <p className="mt-1.5 font-body text-xs text-charcoal/70 leading-relaxed">
                    At least 10 characters. Avoid common or reused passwords.
                  </p>
                )}
              </div>
            )}

            {securityMessage && !error && (
              <p className="text-sm font-body text-charcoal bg-primary/10 rounded-lg px-4 py-2">{securityMessage}</p>
            )}
            {mode !== "forgot" && (captchaNeeded || (mode === "signup" && !!turnstileSiteKey)) && turnstileSiteKey && (
              <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
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

            <Button variant="ghost"
              type="submit"
              disabled={submitting}
              className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {submitting
                ? "..."
                : mode === "login"
                ? "Sign In"
                : mode === "signup"
                ? "Create Account"
                : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {mode === "login" && (
              <>
                <Button variant="ghost" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="text-sm font-body text-primary hover:underline">
                  Forgot password?
                </Button>
                <p className="text-sm font-body text-charcoal/70">
                  Don't have an account?{" "}
                  <Button variant="ghost" onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className="text-primary hover:underline font-semibold">
                    Sign Up
                  </Button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-sm font-body text-charcoal/70">
                Already have an account?{" "}
                <Button variant="ghost" onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-primary hover:underline font-semibold">
                  Sign In
                </Button>
              </p>
            )}
            {mode === "forgot" && (
              <Button variant="ghost" onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-sm font-body text-primary hover:underline">
                Back to Sign In
              </Button>
            )}
          </div>
        </div>
        )}
      </motion.div>
    </main></PublicPage>
  );
}
