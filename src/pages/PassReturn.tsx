import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/editorial";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { notifyCourseAccessChanged } from "@/hooks/useCourseAccess";
import { readPassReturnPath } from "@/lib/warriorPass";

type Status = "checking" | "paid" | "stopped" | "slow" | "missing";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POLL_MS = 2000;
const MAX_MS = 60_000;

/**
 * Where Yoco sends the parent back. Never unlocks anything: it only reads the
 * parent's own order, which the payment webhook marks as paid.
 */
export default function PassReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderId = params.get("order") ?? "";
  const state = params.get("state");
  const [status, setStatus] = useState<Status>("checking");
  const [kind, setKind] = useState<string | null>(null);
  const backPath = readPassReturnPath();

  useEffect(() => {
    if (!user) return;
    if (!UUID.test(orderId)) { setStatus("missing"); return; }
    let stopped = false;
    let timer: number | undefined;
    const started = Date.now();
    const check = async () => {
      if (stopped) return;
      const { data, error } = await supabase.from("orders").select("status, kind").eq("id", orderId).maybeSingle();
      if (stopped) return;
      if (!error && !data) { setStatus("missing"); return; }
      const s = data?.status;
      if (data?.kind) setKind(data.kind);
      if (s === "paid") { setStatus("paid"); notifyCourseAccessChanged(); return; }
      if (s === "failed" || s === "cancelled" || state === "cancelled" || state === "failed") { setStatus("stopped"); return; }
      if (Date.now() - started >= MAX_MS) { setStatus("slow"); return; }
      timer = window.setTimeout(check, POLL_MS);
    };
    void check();
    return () => { stopped = true; if (timer) window.clearTimeout(timer); };
  }, [user, orderId, state]);

  const content = {
    checking: { title: "Confirming your payment", text: "This usually takes a few seconds. Please keep this page open." },
    paid: kind === "book"
      ? { title: "Family library unlocked", text: "Thank you. The book is ready to download in the Family library on your parent dashboard. A receipt is on its way to your email." }
      : kind === "extra_kit"
        ? { title: "Armour Kit added", text: "Thank you. The extra Armour Kit is confirmed and ships when your child finishes the course. A receipt is on its way to your email." }
        : { title: "Warrior Pass unlocked", text: "Thank you. Every lesson is now open for every child in your family. A receipt is on its way to your email." },
    stopped: { title: "Payment not completed", text: "No money was taken for this order. You can try again whenever you are ready." },
    slow: { title: "Still confirming", text: "We are still confirming your payment. You will get an email as soon as it is confirmed. Nothing has been lost." },
    missing: { title: "Order not found", text: "We could not find this order on your account. If you were charged, you will get an email as soon as the payment is confirmed." },
  }[status];

  return (
    <div className="editorial-page min-h-screen bg-cream bg-tech-grid flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-kiki text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary">
          <ShieldIcon size={28} className="stroke-primary-foreground" />
        </div>
        <div className="space-y-2">
          <Eyebrow>Warrior Pass</Eyebrow>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal uppercase tracking-wide">{content.title}</h1>
          <p className="font-body text-charcoal/70 leading-relaxed">{content.text}</p>
        </div>
        {status === "checking" ? (
          <div className="flex justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => navigate(backPath)}
            className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest"
          >
            {status === "stopped" ? "Try again" : backPath.startsWith("/parent") ? "Back to the parent dashboard" : "Back to the course"}
          </Button>
        )}
      </div>
    </div>
  );
}
