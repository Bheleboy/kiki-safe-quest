import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/editorial";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useAuth } from "@/hooks/useAuth";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { supabase } from "@/integrations/supabase/client";
import { KIT_STATUS } from "@/lib/warriorPass";
import { WarriorPassUnlockCard } from "./WarriorPassUnlockCard";

interface ChildLite { id: string; first_name: string }
interface Kit { child_id: string; status: string }

/**
 * Parent dashboard Warrior Pass card. Renders nothing unless the paywall is on,
 * an admin is previewing (?previewPaywall=1), or an admin account holds a pass.
 */
export function WarriorPassStatusCard({ children }: { children: ChildLite[] }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const access = useCourseAccess(user?.id, profile?.is_admin);
  const [pass, setPass] = useState<{ granted_at: string | null } | null | undefined>(undefined);
  const [kits, setKits] = useState<Kit[]>([]);
  const [showUnlock, setShowUnlock] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [passRes, kitsRes] = await Promise.all([
          supabase.from("entitlements").select("granted_at").eq("user_id", user.id).eq("kind", "family_pass").is("revoked_at", null).maybeSingle(),
          supabase.from("armour_kits").select("child_id, status").eq("user_id", user.id),
        ]);
        if (cancelled) return;
        setPass(passRes.error ? null : passRes.data ?? null);
        setKits(kitsRes.error ? [] : kitsRes.data ?? []);
      } catch {
        if (!cancelled) setPass(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const visible = access.paywallActive || access.isPreview || (!!pass && profile?.is_admin === true);
  if (!visible || pass === undefined) return null;

  const returnPath = `/parent${location.search}`;
  const kitFor = new Map(kits.map((k) => [k.child_id, k.status]));
  const childWithoutKit = children.some((c) => !kitFor.has(c.id));

  return (
    <div className="card-kiki space-y-4">
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
              {children.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 rounded-xl border border-primary/15 bg-card px-4 py-3 font-body text-sm">
                  <span className="text-charcoal font-medium">{c.first_name}</span>
                  <span className="text-charcoal/70 text-right">{kitFor.has(c.id) ? KIT_STATUS[kitFor.get(c.id)!] ?? "Armour Kit" : "No Armour Kit yet"}</span>
                </li>
              ))}
            </ul>
          )}
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
