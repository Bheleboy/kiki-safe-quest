import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NOTICE_ID = "family-update-2026-10";

const POINTS = [
  "All lessons now play Kiki's own videos",
  "Each child earns their own Armour of God",
  "Extra safety: when you sign in on a new device, we email you a code to confirm it's you",
  "Parents now set a PIN to keep the parent area and child switching safe",
];

const storageKey = (userId: string) => `kw_notice_${NOTICE_ID}_${userId}`;

export function FamilyUpdateNotice() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (!user) return true;
    try { return localStorage.getItem(storageKey(user.id)) === "1"; } catch { return false; }
  });

  if (!user || dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(storageKey(user.id), "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <section className="card-kiki relative" aria-labelledby="family-update-heading">
      <Button
        variant="ghost"
        onClick={dismiss}
        aria-label="Dismiss update"
        className="absolute right-2 top-2 h-10 w-10 p-0 text-charcoal/60 hover:text-charcoal"
      >
        <X className="w-5 h-5" />
      </Button>
      <h2 id="family-update-heading" className="font-display text-xl font-bold uppercase tracking-wide text-charcoal pr-10">
        Kiki has had a big upgrade!
      </h2>
      <p className="font-body text-sm text-charcoal/70 mt-2">
        Thank you for being one of our first families. We've made Kiki Warrior better and safer for your children:
      </p>
      <ul className="mt-3 space-y-2">
        {POINTS.map((p) => (
          <li key={p} className="flex gap-2 font-body text-sm text-charcoal">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <Button onClick={dismiss} className="mt-4 rounded-full font-display uppercase tracking-wider min-h-11 px-6">
        Got it
      </Button>
    </section>
  );
}
