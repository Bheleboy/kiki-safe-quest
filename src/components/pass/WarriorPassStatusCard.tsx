import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eyebrow } from "@/components/ui/editorial";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { callFn, useAuth } from "@/hooks/useAuth";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { useParentPin } from "@/components/security/ParentGate";
import { supabase } from "@/integrations/supabase/client";
import { KIT_STATUS, checkoutErrorMessage } from "@/lib/warriorPass";
import { WarriorPassUnlockCard } from "./WarriorPassUnlockCard";
import { DeliveryFields, deliveryFromProfile, deliveryLooksComplete, EMPTY_DELIVERY, type DeliveryMethod, type DeliveryValues } from "./DeliveryFields";

interface ChildLite { id: string; first_name: string }
interface Kit { id: string; child_id: string; status: string }
interface Shipment { kit_id: string; tracking_url: string | null }

const safeTracking = (url: string | null | undefined) => (url && /^https:\/\//i.test(url) ? url : null);

/**
 * Parent dashboard Warrior Pass card. Renders nothing unless the paywall is on,
 * an admin is previewing (?previewPaywall=1), or an admin account holds a pass.
 */
export function WarriorPassStatusCard({ children }: { children: ChildLite[] }) {
  const { user, profile, session } = useAuth();
  const token = session?.access_token;
  const location = useLocation();
  const access = useCourseAccess(user?.id, profile?.is_admin);
  const { guard, dialog } = useParentPin();
  const [pass, setPass] = useState<{ granted_at: string | null } | null | undefined>(undefined);
  const [kits, setKits] = useState<Kit[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [showUnlock, setShowUnlock] = useState(false);
  // Delivery form, opened behind a fresh parent PIN.
  const [formPin, setFormPin] = useState<string | null>(null);
  const [method, setMethod] = useState<DeliveryMethod>("door");
  const [values, setValues] = useState<DeliveryValues>(EMPTY_DELIVERY);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [passRes, kitsRes, shipRes, dpRes] = await Promise.all([
        supabase.from("entitlements").select("granted_at").eq("user_id", user.id).eq("kind", "family_pass").is("revoked_at", null).maybeSingle(),
        supabase.from("armour_kits").select("id, child_id, status").eq("user_id", user.id),
        supabase.from("shipments").select("kit_id, tracking_url").eq("user_id", user.id),
        supabase.from("delivery_profiles").select("recipient_name, phone, delivery_method, address_line1, address_line2, suburb, city, province, postal_code, locker_code").eq("user_id", user.id).maybeSingle(),
      ]);
      setPass(passRes.error ? null : passRes.data ?? null);
      setKits(kitsRes.error ? [] : kitsRes.data ?? []);
      setShipments(shipRes.error ? [] : shipRes.data ?? []);
      if (!dpRes.error && dpRes.data) {
        const d = deliveryFromProfile(dpRes.data);
        setMethod(d.method);
        setValues(d.values);
      }
    } catch {
      setPass((p) => (p === undefined ? null : p));
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const visible = access.paywallActive || access.isPreview || (!!pass && profile?.is_admin === true);
  if (!visible || pass === undefined) return null;

  const returnPath = `/parent${location.search}`;
  const kitFor = new Map(kits.map((k) => [k.child_id, k]));
  const trackingFor = new Map(shipments.map((s) => [s.kit_id, safeTracking(s.tracking_url)]));
  const childWithoutKit = children.some((c) => !kitFor.has(c.id));
  const needsAddress = kits.some((k) => k.status === "address_needed");

  const openForm = () => guard((p) => { if (p) { setFormPin(p); setFormError(""); } }, { requirePin: true, message: "Enter your parent PIN to add delivery details." });

  async function saveDelivery() {
    if (!formPin) return;
    setBusy(true);
    setFormError("");
    try {
      const r = await callFn("save-delivery", { pin: formPin, consent, delivery: { method, ...values } }, token);
      if (r.ok) {
        setFormPin(null);
        setConsent(false);
        await load();
      } else if (r.data?.error === "pin_required") {
        setFormPin(null);
        setFormError(r.data?.message || "Please enter your parent PIN again.");
      } else {
        setFormError(checkoutErrorMessage(r.data));
      }
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-kiki space-y-4">
      {dialog}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary shrink-0">
          <ShieldIcon size={20} className="stroke-primary-foreground" />
        </div>
        <div>
          <Eyebrow>For parents</Eyebrow>
          <h2 className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Warrior Pass</h2>
        </div>
      </div>

      {pass ? (
        <>
          <p className="font-body text-sm text-charcoal/80">
            Active since {pass.granted_at ? new Date(pass.granted_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "today"}
          </p>
          {children.length > 0 && (
            <ul className="space-y-2">
              {children.map((c) => {
                const kit = kitFor.get(c.id);
                const tracking = kit ? trackingFor.get(kit.id) : null;
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 bg-card px-4 py-3 font-body text-sm">
                    <span className="text-charcoal font-medium">{c.first_name}</span>
                    <span className="text-charcoal/70 text-right flex items-center gap-2">
                      {kit ? KIT_STATUS[kit.status] ?? "Armour Kit" : "No Armour Kit yet"}
                      {kit?.status === "shipped" && tracking && (
                        <a href={tracking} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          Track parcel <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {needsAddress && !formPin && (
            <Button variant="ghost" onClick={openForm} className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest">
              Add delivery details
            </Button>
          )}
          {needsAddress && formPin && (
            <div className="space-y-4 rounded-2xl border border-primary/15 p-4">
              <DeliveryFields method={method} onMethod={setMethod} values={values} onChange={setValues} />
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                <span className="font-body text-sm text-charcoal/80 leading-relaxed">
                  I am the parent or guardian and agree to my delivery details being used to send the reward
                </span>
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => void saveDelivery()} disabled={busy || !consent || !deliveryLooksComplete(method, values)}
                  className="flex-1 touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest disabled:opacity-50">
                  {busy ? "Saving..." : "Save delivery details"}
                </Button>
                <Button variant="ghost" onClick={() => setFormPin(null)} className="touch-target px-4 text-sm font-body text-charcoal/70">Cancel</Button>
              </div>
            </div>
          )}
          {formError && <p className="text-sm font-body text-destructive bg-destructive/10 rounded-lg px-4 py-2">{formError}</p>}

          {childWithoutKit && !showUnlock && (
            <Button variant="ghost" onClick={() => setShowUnlock(true)} className="text-sm font-body text-primary hover:underline px-0">
              Add an Armour Kit
            </Button>
          )}
          {showUnlock && <WarriorPassUnlockCard returnPath={returnPath} />}
        </>
      ) : (
        <>
          <p className="font-body text-sm text-charcoal/70 leading-relaxed">
            {access.hasAccess && !access.isPreview
              ? "Your family already has every lesson open. The Warrior Pass adds an Armour Kit reward for your child."
              : "The Warrior Pass unlocks every lesson for every child in your family and includes one Armour Kit."}
          </p>
          <WarriorPassUnlockCard returnPath={returnPath} />
        </>
      )}
    </div>
  );
}
