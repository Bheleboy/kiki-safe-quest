import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eyebrow } from "@/components/ui/editorial";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { supabase } from "@/integrations/supabase/client";
import { maintenanceView } from "@/lib/maintenance";

/**
 * Shows the "we are upgrading" page to visitors while app_settings.maintenance_mode is on.
 * Admins (Kiki admin profile or admin dashboard session) browse normally; sign-in and admin stay reachable.
 * While the switch is off, loading, or unreadable, it renders the normal site.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  // Re-check every minute so visitors come back automatically when the upgrade ends.
  const { settings } = usePublicSettings({ refreshMs: 60_000 });
  if (settings?.maintenance_mode !== true) return <>{children}</>;
  return <MaintenanceActive>{children}</MaintenanceActive>;
}

function MaintenanceActive({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const { pathname } = useLocation();
  const { adminLoading, clientId } = useAdminAuth();
  const view = maintenanceView({
    maintenance: true,
    path: pathname,
    authLoading: loading,
    isKikiAdmin: profile?.is_admin === true,
    isDashboardAdmin: adminLoading ? null : !!clientId,
  });
  if (view === "site") return <>{children}</>;
  if (view === "wait") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <UpgradePage />;
}

function UpgradePage() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setState("busy");
    try {
      const { error: err } = await supabase.functions.invoke("notify-me", { body: { email, consent } });
      if (err) {
        let code = "";
        try { code = (await (err as any).context?.json?.())?.error ?? ""; } catch { /* ignore */ }
        setState("idle");
        setError(code === "invalid_email" ? "Please enter a valid email address."
          : code === "too_many" ? "Too many attempts. Please try again later."
          : code === "not_available" ? "We are already back. Please refresh the page."
          : "Something went wrong. Please try again.");
        return;
      }
      setState("done");
    } catch {
      setState("idle");
      setError("Could not reach the server. Please try again.");
    }
  };

  return (
    <main className="editorial-page min-h-screen bg-cream bg-tech-grid text-charcoal flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-kiki text-center space-y-5">
        <img src="/favicon.png" alt="Kiki Warrior" className="mx-auto w-16 h-16 rounded-full ring-2 ring-primary/70" />
        <div className="space-y-2">
          <Eyebrow>Kiki Warrior</Eyebrow>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal uppercase tracking-wide">We are upgrading</h1>
          <p className="font-body text-charcoal/70 leading-relaxed">
            Kiki Warrior is getting an upgrade. We will be back shortly. Leave your email and we will tell you the moment we are back.
          </p>
        </div>
        {state === "done" ? (
          <p className="font-body text-sm text-charcoal bg-primary/10 rounded-xl px-4 py-3">Thank you. We will email you the moment we are back.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4 text-left">
            <label className="block font-body text-sm text-charcoal/80">
              Your email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
                className="mt-2 w-full rounded-xl border border-primary/20 bg-card min-h-12 px-4 font-body text-charcoal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <span className="font-body text-sm text-charcoal/80 leading-relaxed">I agree that Kiki Warrior may email me to say the site is back.</span>
            </label>
            {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}
            <Button
              type="submit"
              variant="ghost"
              disabled={state === "busy" || !consent || !email.includes("@")}
              className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {state === "busy" ? "Saving..." : "Tell me when you are back"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
