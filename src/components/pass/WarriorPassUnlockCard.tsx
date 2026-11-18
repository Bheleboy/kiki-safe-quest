import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeliveryFields, deliveryFromProfile, deliveryLooksComplete, EMPTY_DELIVERY, labelCls, type DeliveryValues } from "./DeliveryFields";
import { callFn, useAuth } from "@/hooks/useAuth";
import { checkoutErrorMessage, formatRand, KIT_PARENT_COPY, KITS_SOLD_OUT, savePassReturnPath } from "@/lib/warriorPass";

interface QuoteChild { id: string; first_name: string; has_kit: boolean }
interface Quote {
  payments_configured: boolean;
  has_pass: boolean;
  price: {
    family_pass_cents: number; launch: boolean; kit_cents?: number; extra_kit_cents: number;
    delivery_locker_cents?: number | null; delivery_door_cents?: number | null; currency: string;
  };
  kits_sold_out?: boolean;
  kit_stock?: number | null;
  children: QuoteChild[];
  delivery: Partial<Record<string, string | null>> | null;
}

/**
 * Parent-only unlock card. Renders nothing (and fetches nothing) without a PIN the
 * parent just entered; that same PIN is sent to checkout so the parent is asked once.
 * The pass covers lessons only; Armour Kits are optional, per child, plus one delivery fee.
 * Prices come from the server quote; the server recomputes them at checkout.
 */
export function WarriorPassUnlockCard({ pin, onPinExpired, returnPath }: {
  pin: string | null;
  /** Server said the PIN failed or expired: ask again, then retry with the new PIN. */
  onPinExpired: (message: string, retry: (pin: string) => void) => void;
  returnPath: string;
}) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [notConfigured, setNotConfigured] = useState(false);
  const [kits, setKits] = useState<string[]>([]);
  const [method, setMethod] = useState<"door" | "locker">("door");
  const [fields, setFields] = useState<DeliveryValues>(EMPTY_DELIVERY);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hasPin = !!pin;
  useEffect(() => {
    if (!token || !hasPin) return;
    let cancelled = false;
    callFn("create-checkout", { action: "quote" }, token)
      .then((r) => {
        if (cancelled) return;
        if (!r.ok || !r.data?.price) { setLoadState("unavailable"); return; }
        const q = r.data as Quote;
        setQuote(q);
        setNotConfigured(!q.payments_configured);
        if (q.delivery) {
          const d = deliveryFromProfile(q.delivery);
          setMethod(d.method);
          setFields(d.values);
        }
        setLoadState("ready");
      })
      .catch(() => !cancelled && setLoadState("unavailable"));
    return () => { cancelled = true; };
  }, [token, hasPin]);

  const comingSoon = (
    <Button variant="ghost" disabled className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-60">
      <Lock className="w-4 h-4 mr-2" />
      Secure checkout opening soon
    </Button>
  );

  if (!pin) return null;
  if (loadState === "loading") {
    return <div className="flex justify-center py-6"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (loadState === "unavailable" || !quote) return comingSoon;

  const kitCents = quote.price.kit_cents ?? quote.price.extra_kit_cents;
  const names = new Map(quote.children.map((c) => [c.id, c.first_name]));
  const eligible = quote.children.filter((c) => !c.has_kit);
  const buyingPass = !quote.has_pass;
  const soldOut = quote.kits_sold_out === true;
  const stock = typeof quote.kit_stock === "number" ? quote.kit_stock : null;
  const chosenKits = soldOut ? [] : kits.filter((id) => eligible.some((c) => c.id === id));
  const overStock = stock !== null && chosenKits.length > stock;
  const fee = method === "locker" ? quote.price.delivery_locker_cents ?? null : quote.price.delivery_door_cents ?? null;

  const lines: { key: string; label: string; cents: number | null }[] = [];
  if (buyingPass) lines.push({ key: "pass", label: `Family Warrior Pass${quote.price.launch ? " (Founding Family price)" : ""}`, cents: quote.price.family_pass_cents });
  chosenKits.forEach((id) => lines.push({ key: `kit-${id}`, label: `Armour Kit for ${names.get(id)}`, cents: kitCents }));
  if (chosenKits.length > 0) {
    lines.push({ key: "delivery", label: method === "locker" ? "Delivery to a Courier Guy locker" : "Door delivery", cents: fee });
  }
  const total = lines.reduce((s, l) => s + (l.cents ?? 0), 0);
  const hasKits = chosenKits.length > 0;

  const deliveryOk = !hasKits || (deliveryLooksComplete(method, fields) && fee !== null);
  const canPay = !busy && !notConfigured && lines.length > 0 && !overStock && deliveryOk && consent && (buyingPass || hasKits);

  async function pay(freshPin?: string) {
    setError("");
    const usePin = freshPin ?? pin;
    if (!usePin) return;
    setBusy(true);
    try {
      const r = await callFn("create-checkout", {
        action: "checkout",
        pin: usePin,
        kind: buyingPass ? "family_pass" : "extra_kit",
        extra_kit_child_ids: chosenKits,
        ...(hasKits ? { delivery: { method, ...fields } } : {}),
        consent,
      }, token);
      if (r.ok && typeof r.data?.redirectUrl === "string") {
        savePassReturnPath(returnPath);
        window.location.assign(r.data.redirectUrl);
        return;
      }
      setBusy(false);
      if (r.status === 503 && r.data?.error === "payments_not_configured") { setNotConfigured(true); return; }
      if (r.data?.error === "kits_sold_out") setQuote({ ...quote!, kits_sold_out: true });
      if (r.data?.error === "pin_required") {
        onPinExpired(r.data?.message || "Enter your parent PIN to pay securely.", (p) => { void pay(p); });
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
      {buyingPass ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Family Warrior Pass</p>
            <p className="font-body text-sm text-charcoal/70">Every lesson for every child in your family.</p>
            {quote.price.launch && (
              <span className="inline-block mt-2 rounded-full bg-primary px-3 py-1 font-display text-[11px] uppercase tracking-widest text-primary-foreground">Founding Family price</span>
            )}
          </div>
          <p className="font-display text-2xl font-bold text-charcoal">{formatRand(quote.price.family_pass_cents)}</p>
        </div>
      ) : (
        <p className="font-body text-sm text-charcoal/70">Your family has the Warrior Pass. You can add an Armour Kit for a child.</p>
      )}

      {quote.children.length > 0 && (
        <fieldset className="space-y-2">
          <legend className={labelCls}>{buyingPass ? "Add Armour Kits (optional)" : "Armour Kits"}, {formatRand(kitCents)} per child</legend>
          <p className="font-body text-sm text-charcoal/70">{KIT_PARENT_COPY} Delivery is added once per order.</p>
          {soldOut ? (
            <p className="font-body text-sm text-charcoal/80 rounded-xl bg-muted px-4 py-3">{KITS_SOLD_OUT}</p>
          ) : eligible.length === 0 ? (
            <p className="font-body text-sm text-charcoal/70">Every child in your family already has an Armour Kit.</p>
          ) : (
            eligible.map((c) => (
              <label key={c.id} className="flex items-center gap-3 rounded-xl border border-primary/15 bg-card px-4 min-h-12 cursor-pointer">
                <Checkbox
                  checked={kits.includes(c.id)}
                  onCheckedChange={(v) => setKits((xs) => (v === true ? [...xs, c.id] : xs.filter((x) => x !== c.id)))}
                />
                <span className="font-body text-charcoal">Armour Kit for {c.first_name}</span>
              </label>
            ))
          )}
          {overStock && <p className="font-body text-sm text-destructive">Only {stock} Armour Kit{stock === 1 ? " is" : "s are"} left. Please choose fewer.</p>}
        </fieldset>
      )}

      {lines.length > 0 && (
        <>
          {hasKits && (
            <>
              <DeliveryFields method={method} onMethod={setMethod} values={fields} onChange={setFields} />
              {fee === null && <p className="font-body text-sm text-charcoal/70">Delivery to this option is not available yet.</p>}
            </>
          )}

          <div className="rounded-2xl border border-primary/15 bg-card p-4 space-y-2">
            <p className="font-display text-sm font-bold text-charcoal uppercase tracking-wide">Order summary</p>
            {lines.map((l) => (
              <div key={l.key} className="flex justify-between gap-3 font-body text-sm text-charcoal/80">
                <span>{l.label}</span><span className="shrink-0">{l.cents === null ? "-" : formatRand(l.cents)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-primary/15 pt-2 font-display font-bold text-charcoal">
              <span className="uppercase tracking-wide">Total</span><span>{formatRand(total)}</span>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span className="font-body text-sm text-charcoal/80 leading-relaxed">
              {hasKits
                ? "I am the parent or guardian and agree to the purchase and to my delivery details being used to send the Armour Kit"
                : "I am the parent or guardian and agree to the purchase"}
            </span>
          </label>
        </>
      )}

      <p className="font-body text-xs text-charcoal/60">
        <a href="/pricing-and-delivery" target="_blank" rel="noopener" className="text-primary hover:underline">Prices, delivery and refunds</a>
      </p>

      {error && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}

      {notConfigured ? comingSoon : (buyingPass || hasKits) && (
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
