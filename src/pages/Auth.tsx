import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

type Mode = "login" | "signup" | "forgot";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Name is required").max(50),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  ageBand: z.enum(["6-9", "10-13"]),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageBand, setAgeBand] = useState<"6-9" | "10-13">("6-9");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const parsed = signupSchema.parse({ firstName, email, password, ageBand });
        const { error: err } = await signUp(parsed.email, parsed.password, parsed.firstName, parsed.ageBand);
        if (err) { setError(err.message); }
        else { setMessage("Check your email for a verification link!"); }
      } else if (mode === "login") {
        loginSchema.parse({ email, password });
        const { error: err } = await signIn(email.trim(), password);
        if (err) { setError(err.message); }
        else { navigate("/course"); }
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-copper mb-4">
            <ShieldIcon size={32} className="stroke-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wide text-foreground uppercase">
            Kiki Warrior
          </h1>
          <p className="font-body text-muted-foreground text-sm mt-1">
            Internet Safety Course
          </p>
        </div>

        {/* Card */}
        <div className="card-kiki">
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider mb-6 text-center">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                    Age Band
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["6-9", "10-13"] as const).map((band) => (
                      <button
                        key={band}
                        type="button"
                        onClick={() => setAgeBand(band)}
                        className={`rounded-lg border-2 px-4 py-3 font-display font-semibold text-sm tracking-wide transition-all ${
                          ageBand === band
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        AGES {band}
                      </button>
                    ))}
                  </div>
                </div>
              </>
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
