import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eyebrow } from "@/components/ui/editorial";
import { callFn, useAuth } from "@/hooks/useAuth";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { useParentPin } from "@/components/security/ParentGate";
import { supabase } from "@/integrations/supabase/client";
import { BOOK_COVER, BOOK_STORES, BOOK_TITLE } from "@/data/bookStores";
import { checkoutErrorMessage, formatRand, savePassReturnPath } from "@/lib/warriorPass";

/**
 * Parent-only Family library. Renders nothing unless the paywall is on, an admin is
 * previewing, or the family already owns the book. One purchase covers every child.
 */
export function FamilyLibraryCard() {
  const { user, profile, session } = useAuth();
  const token = session?.access_token;
  const location = useLocation();
  const access = useCourseAccess(user?.id, profile?.is_admin);
  const { guard, dialog } = useParentPin();
  const [owned, setOwned] = useState<boolean | undefined>(undefined);
  const [price, setPrice] = useState<number | null>(null);
  const [paymentsReady, setPaymentsReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkoutSoon, setCheckoutSoon] = useState(false);

  const visible = access.paywallActive || access.isPreview || owned === true;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from("entitlements").select("id").eq("user_id", user.id).eq("kind", "book").is("revoked_at", null).maybeSingle()
      .then(({ data, error: e }) => { if (!cancelled) setOwned(!e && !!data); }, () => { if (!cancelled) setOwned(false); });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!token || !visible || owned !== false) return;
    let cancelled = false;
    callFn("create-checkout", { action: "quote" }, token)
      .then((r) => {
        if (cancelled || !r.ok) return;
        setPrice(typeof r.data?.price?.book_cents === "number" ? r.data.price.book_cents : null);
        setPaymentsReady(r.data?.payments_configured === true);
        if (r.data?.has_book === true) setOwned(true);
      })
      .catch(() => { /* stays "Coming soon" */ });
    return () => { cancelled = true; };
  }, [token, visible, owned]);

  useEffect(() => {
    if (visible && location.hash === "#family-library") {
      setTimeout(() => document.getElementById("family-library")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [visible, location.hash]);

  if (!visible || owned === undefined) return null;

  async function download() {
    setError("");
    setBusy(true);
    try {
      const r = await callFn("library-link", {}, token);
      if (r.ok && typeof r.data?.url === "string") { window.location.assign(r.data.url); return; }
      setError(r.data?.error === "book_not_available"
        ? "The download is being prepared. Please try again a little later."
        : checkoutErrorMessage(r.data));
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function buy(pin?: string) {
    setError("");
    if (!pin) {
      guard((p) => { void buy(p); }, { requirePin: true, message: "Enter your parent PIN to pay securely." });
      return;
    }
    setBusy(true);
    try {
      const r = await callFn("create-checkout", { action: "checkout", kind: "book", pin, consent: true }, token);
      if (r.ok && typeof r.data?.redirectUrl === "string") {
        savePassReturnPath(`/parent${location.search}`);
        window.location.assign(r.data.redirectUrl);
        return;
      }
      setBusy(false);
      if (r.status === 503 && r.data?.error === "payments_not_configured") { setCheckoutSoon(true); return; }
      if (r.data?.error === "book_not_available") { setPrice(null); return; }
      if (r.data?.error === "already_has_book") { setOwned(true); return; }
      if (r.data?.error === "pin_required") {
        setError(r.data?.message || "Please enter your parent PIN again.");
        return;
      }
      setError(checkoutErrorMessage(r.data));
    } catch {
      setBusy(false);
      setError("Could not reach the server. Please try again.");
    }
  }

  const comingSoon = (label: string) => (
    <Button variant="ghost" disabled className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-60">
      <Lock className="w-4 h-4 mr-2" />{label}
    </Button>
  );

  return (
    <div id="family-library" className="card-kiki space-y-4 scroll-mt-24">
      {dialog}
      <div>
        <Eyebrow>For the whole family</Eyebrow>
        <h2 className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Family library</h2>
      </div>
      <div className="flex gap-4 items-start">
        <img src={BOOK_COVER} alt={`${BOOK_TITLE} workbook cover`} loading="lazy" className="w-20 sm:w-24 rounded-lg shrink-0 -rotate-2" />
        <div className="space-y-1 min-w-0">
          <p className="font-display text-sm font-bold text-charcoal uppercase tracking-wide">{BOOK_TITLE}</p>
          <p className="font-body text-sm text-charcoal/70">Printable PDF workbook. One purchase covers every child in your family.</p>
          {owned && <p className="font-body text-xs font-medium text-primary">Your family owns this book</p>}
        </div>
      </div>

      {owned ? (
        <Button variant="ghost" onClick={() => void download()} disabled={busy}
          className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50">
          <Download className="w-4 h-4 mr-2" />{busy ? "Preparing download..." : "Download"}
        </Button>
      ) : price === null ? comingSoon("Coming soon") : checkoutSoon || !paymentsReady ? comingSoon("Secure checkout opening soon") : (
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span className="font-body text-sm text-charcoal/80 leading-relaxed">I am the parent or guardian and agree to the purchase</span>
          </label>
          <Button variant="ghost" onClick={() => void buy()} disabled={busy || !consent}
            className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50">
            <Lock className="w-4 h-4 mr-2" />{busy ? "Opening secure checkout..." : `Buy for ${formatRand(price)}`}
          </Button>
        </div>
      )}

      {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}

      <div className="space-y-2 border-t border-primary/15 pt-3">
        <p className="font-body text-sm text-charcoal/70">Prefer a printed copy or ebook? Buy it from a store:</p>
        <div className="flex flex-wrap gap-2">
          {BOOK_STORES.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-10 rounded-lg bg-primary/10 border border-primary/20 text-xs font-display uppercase tracking-wide text-charcoal/70 hover:text-charcoal hover:border-primary/40 transition-colors">
              {s.name}<ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
