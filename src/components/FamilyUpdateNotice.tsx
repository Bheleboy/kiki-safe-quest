import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setOpen(false); return; }
    try {
      if (localStorage.getItem(storageKey(user.id)) !== "1") setOpen(true);
    } catch { setOpen(true); }
  }, [user?.id]);

  const dismiss = () => {
    if (user) {
      try { localStorage.setItem(storageKey(user.id), "1"); } catch { /* ignore */ }
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="rounded-2xl border border-primary/15 bg-background max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto p-6">
        <DialogTitle className="sr-only">Kiki has had a big upgrade</DialogTitle>
        <div aria-labelledby="family-update-heading">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
