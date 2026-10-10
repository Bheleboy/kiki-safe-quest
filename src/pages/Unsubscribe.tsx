import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type State = "loading" | "valid" | "used" | "invalid" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return setState("invalid");
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then((r) => r.json())
      .then((d) => setState(d.valid ? "valid" : d.reason === "already_unsubscribed" ? "used" : "invalid"))
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setBusy(false);
    setState(!error && (data?.success || data?.reason === "already_unsubscribed") ? "done" : "error");
  };

  const copy: Record<State, string> = {
    loading: "Checking your link...",
    valid: "Stop receiving emails from Kiki Warrior at this address?",
    used: "You are already unsubscribed.",
    invalid: "This link is not valid or has expired.",
    done: "You have been unsubscribed.",
    error: "Something went wrong. Please try again later.",
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border border-primary/15 bg-card p-8 text-center">
        <h1 className="font-display uppercase text-2xl mb-4">Email preferences</h1>
        <p className="text-muted-foreground mb-6">{copy[state]}</p>
        {state === "valid" && (
          <Button onClick={confirm} disabled={busy}>{busy ? "Working..." : "Confirm unsubscribe"}</Button>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
