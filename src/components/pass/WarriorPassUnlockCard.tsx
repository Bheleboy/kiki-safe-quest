import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DeliveryFields, deliveryFromProfile, deliveryLooksComplete, EMPTY_DELIVERY, labelCls, type DeliveryValues } from "./DeliveryFields";
import { callFn, useAuth } from "@/hooks/useAuth";
import { useParentPin } from "@/components/security/ParentGate";
import { checkoutErrorMessage, formatRand, savePassReturnPath } from "@/lib/warriorPass";

interface QuoteChild { id: string; first_name: string; has_kit: boolean }
interface Quote {
  payments_configured: boolean;
  has_pass: boolean;
  price: { family_pass_cents: number; launch: boolean; extra_kit_cents: number; currency: string };
  children: QuoteChild[];
  delivery: Partial<Record<string, string | null>> | null;
}

/**
 * Parent-only unlock card. Shown only behind the parent PIN or the parent area.
 * Prices come from the server quote; the server recomputes them at checkout.
 */
export function WarriorPassUnlockCard({ initialPin, returnPath }: { initialPin?: string; returnPath: string }) {
  const { session } = useAuth();
  const token = session?.access_token;
  const { guard, dialog } = useParentPin();
  const pinRef = useRef<string | undefined>(initialPin);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [notConfigured, setNotConfigured] = useState(false);
  const [included, setIncluded] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [method, setMethod] = useState<"door" | "locker">("door");
  const [fields, setFields] = useState<DeliveryValues>(EMPTY_DELIVERY);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    callFn("create-checkout", { action: "quote" }, token)
      .then((r) => {
        if (cancelled) return;
        if (!r.ok || !r.data?.price) { setLoadState("unavailable"); return; }
        const q = r.data as Quote;
        setQuote(q);
        setNotConfigured(!q.payments_configured);
        const eligible = q.children.filter((c) => !c.has_kit);
        if (!q.has_pass && eligible[0]) setIncluded(eligible[0].id);
        if (q.delivery) {
          const d = deliveryFromProfile(q.delivery);
          setMethod(d.method);
          setFields(d.values);
        }
        setLoadState("ready");
      })
      .catch(() => !cancelled && setLoadState("unavailable"));
    return () => { cancelled = true; };
  }, [token]);

  const comingSoon = (
    <Button variant="ghost" disabled className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-60">
      <Lock className="w-4 h-4 mr-2" />
      Secure checkout opening soon
    </Button>
  );

  if (loadState === "loading") {
    return <div className="flex justify-center py-6"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (loadState === "unavailable" || !quote) return comingSoon;

  const names = new Map(quote.children.map((c) => [c.id, c.first_name]));
  const eligible = quote.children.filter((c) => !c.has_kit);
  const buyingPass = !quote.has_pass;
  const extraOptions = eligible.filter((c) => c.id !== included);
  const chosenExtras = extras.filter((id) => extraOptions.some((c) => c.id === id));
  const lines: { label: string; cents: number }[] = [];
  if (buyingPass && included) {
    lines.push({ label: `Family Warrior Pass, Armour Kit for ${names.get(included)}`, cents: quote.price.family_pass_cents });
  }
  chosenExtras.forEach((id) => lines.push({ label: `Extra Armour Kit for ${names.get(id)}`, cents: quote.price.extra_kit_cents }));
  const total = lines.reduce((s, l) => s + l.cents, 0);

  const deliveryOk = deliveryLooksComplete(method, fields);
  const canPay = !busy && !notConfigured && lines.length > 0 && deliveryOk && consent;

  async function pay(pin?: string) {
    setError("");
    const usePin = pin ?? pinRef.current;
    if (!usePin) {
      guard((p) => { pinRef.current = p; void pay(p); }, { requirePin: true, message: "Enter your parent PIN to pay securely." });
      return;
    }
    setBusy(true);
    try {
      const r = await callFn("create-checkout", {
        action: "checkout",
        pin: usePin,
        kind: buyingPass ? "family_pass" : "extra_kit",
        included_kit_child_id: buyingPass ? included : null,
        extra_kit_child_ids: chosenExtras,
        delivery: { method, ...fields },
        consent,
      }, token);
      if (r.ok && typeof r.data?.redirectUrl === "string") {
        savePassReturnPath(returnPath);
        window.location.assign(r.data.redirectUrl);
        return;
      }
      setBusy(false);
      if (r.status === 503 && r.data?.error === "payments_not_configured") { setNotConfigured(true); return; }
      if (r.data?.error === "pin_required") {
        pinRef.current = undefined;
        setError(r.data?.message || "Please enter your parent PIN again.");
        guard((p) => { pinRef.current = p; void pay(p); }, { requirePin: true, message: r.data?.message || "Enter your parent PIN to pay securely." });
        return;
      }
      setError(checkoutErrorMessage(r.data));
    } catch {
      setBusy(false);
      setError("Could not reach the server. Please try again.");
    }
  }

  return (
    <div className="space-y-5 text-left">
      {dialog}
      {buyingPass ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Family Warrior Pass</p>
            <p className="font-body text-sm text-charcoal/70">Every lesson for every child, plus one Armour Kit.</p>
            {quote.price.launch && (
              <span className="inline-block mt-2 rounded-full bg-primary px-3 py-1 font-display text-[11px] uppercase tracking-widest text-primary-foreground">Founding Family price</span>
            )}
          </div>
          <p className="font-display text-2xl font-bold text-charcoal">{formatRand(quote.price.family_pass_cents)}</p>
        </div>
      ) : (
        <p className="font-body text-sm text-charcoal/70">Your family has the Warrior Pass. You can add an Armour Kit for another child.</p>
      )}

      {buyingPass && eligible.length === 0 && (
        <p className="font-body text-sm text-charcoal/70">Add a child on the family page first, then come back to unlock the Warrior Pass.</p>
      )}

      {buyingPass && eligible.length > 0 && (
        <fieldset className="space-y-2">
          <legend className={labelCls}>Who gets the included Armour Kit?</legend>
          <RadioGroup value={included} onValueChange={setIncluded} className="gap-2">
            {eligible.map((c) => (
              <label key={c.id} className="flex items-center gap-3 rounded-xl border border-primary/15 bg-card px-4 min-h-12 cursor-pointer">
                <RadioGroupItem value={c.id} id={`kit-${c.id}`} />
                <span className="font-body text-charcoal">{c.first_name}</span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      )}

      {extraOptions.length > 0 && (
        <fieldset className="space-y-2">
          <legend className={labelCls}>Extra Armour Kits, {formatRand(quote.price.extra_kit_cents)} each</legend>
          {extraOptions.map((c) => (
            <label key={c.id} className="flex items-center gap-3 rounded-xl border border-primary/15 bg-card px-4 min-h-12 cursor-pointer">
              <Checkbox
                checked={extras.includes(c.id)}
                onCheckedChange={(v) => setExtras((xs) => (v === true ? [...xs, c.id] : xs.filter((x) => x !== c.id)))}
              />
              <span className="font-body text-charcoal">Extra Armour Kit for {c.first_name}</span>
            </label>
          ))}
        </fieldset>
      )}

      {!buyingPass && extraOptions.length === 0 && (
        <p className="font-body text-sm text-charcoal/70">Every child in your family already has an Armour Kit.</p>
      )}

      {lines.length > 0 && (
        <>
          <DeliveryFields method={method} onMethod={setMethod} values={fields} onChange={setFields} />

          <div className="rounded-2xl border border-primary/15 bg-card p-4 space-y-2">
            <p className="font-display text-sm font-bold text-charcoal uppercase tracking-wide">Order summary</p>
            {lines.map((l) => (
              <div key={l.label} className="flex justify-between gap-3 font-body text-sm text-charcoal/80">
                <span>{l.label}</span><span className="shrink-0">{formatRand(l.cents)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-primary/15 pt-2 font-display font-bold text-charcoal">
              <span className="uppercase tracking-wide">Total</span><span>{formatRand(total)}</span>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span className="font-body text-sm text-charcoal/80 leading-relaxed">
              I am the parent or guardian and agree to the purchase and to my delivery details being used to send the reward
            </span>
          </label>
        </>
      )}

      {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}

      {notConfigured ? comingSoon : lines.length > 0 && (
        <Button
          variant="ghost"
          onClick={() => void pay()}
          disabled={!canPay}
          className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50"
        >
          <Lock className="w-4 h-4 mr-2" />
          {busy ? "Opening secure checkout..." : `Pay securely ${formatRand(total)}`}
        </Button>
      )}
    </div>
  );
}
