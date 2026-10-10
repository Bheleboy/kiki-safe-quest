import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eyebrow, PublicPage } from "@/components/ui/editorial";
import { Button } from "@/components/ui/button";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { supabase } from "@/integrations/supabase/client";

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function SecurityRevoke() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"idle" | "working" | "done" | "invalid">(token ? "idle" : "invalid");

  const confirm = async () => {
    setState("working");
    try {
      const res = await fetch(`${FN_BASE}/security-revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
        setState("done");
      } else setState("invalid");
    } catch {
      setState("invalid");
    }
  };

  return (
    <PublicPage>
      <main className="editorial-focus mx-auto flex w-full flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
              <ShieldIcon size={32} className="stroke-primary-foreground" />
            </div>
            <Eyebrow>Account security</Eyebrow>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-charcoal uppercase leading-[0.95]">
              This wasn't me
            </h1>
          </div>
          <div className="card-kiki space-y-5 text-center">
            {state === "done" ? (
              <p className="font-body text-charcoal leading-relaxed">
                Done. You have been signed out on every device and we have emailed you a link to set a new password.
              </p>
            ) : state === "invalid" ? (
              <>
                <p className="font-body text-charcoal/70 leading-relaxed">
                  This link is invalid, has expired or was already used. If you are worried, reset your password from the sign-in page.
                </p>
                <Button asChild className="btn-copper adventure-button">
                  <Link to="/auth">Go to sign in</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="font-body text-charcoal/70 leading-relaxed">
                  We will sign your account out on every device, forget all trusted devices and email you a link to set a new password.
                </p>
                <Button
                  variant="ghost"
                  onClick={confirm}
                  disabled={state === "working"}
                  className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  {state === "working" ? "..." : "Yes, sign out everywhere"}
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </PublicPage>
  );
}
