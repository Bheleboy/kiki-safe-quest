import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { Link } from "react-router-dom";

export default function AgeVerification() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [consent, setConsent] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, signOut, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (!dayNum || !monthNum || !yearNum || dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setError("Please enter a valid date of birth.");
      return;
    }

    const dob = new Date(yearNum, monthNum - 1, dayNum);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      setError("You must be at least 18 years old to use this platform.");
      return;
    }

    if (!consent || !guardianConsent) {
      setError("You must confirm both checkboxes to continue.");
      return;
    }

    setSubmitting(true);

    const dobString = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        date_of_birth: dobString,
        age_verified: true,
        consent_accepted_at: new Date().toISOString(),
      })
      .eq("id", user?.id);

    if (updateError) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    await fetchProfile(user!.id);
    setSubmitting(false);
    navigate("/family", { replace: true });
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-copper mb-4">
            <ShieldIcon size={32} className="stroke-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wide text-foreground uppercase">
            Age Verification
          </h1>
          <p className="font-body text-muted-foreground text-sm mt-1">
            We need to verify you are an adult before continuing
          </p>
        </div>

        <div className="card-kiki">
          <h2 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider mb-6 text-center">
            Confirm Your Identity
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                Date of Birth
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  placeholder="DD"
                  min="1"
                  max="31"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors text-center"
                />
                <input
                  type="number"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="MM"
                  min="1"
                  max="12"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors text-center"
                />
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors text-center"
                />
              </div>
            </div>

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

            {error && (
              <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full touch-target btn-copper py-3 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {submitting ? "..." : "Verify & Continue"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => signOut()}
              className="text-sm font-body text-muted-foreground hover:text-primary hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
