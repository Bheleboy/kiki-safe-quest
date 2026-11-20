import { Eyebrow } from "@/components/ui/editorial";

/**
 * Shown in place of the direct printable PDF purchase while it is not available yet.
 * No buttons and no store links. `inset` drops the card frame for use inside another card.
 */
export function BookLaunchingSoon({ inset = false }: { inset?: boolean }) {
  return (
    <div className={inset ? "rounded-2xl border border-primary/15 bg-peach/60 p-4 space-y-2" : "card-kiki space-y-3"}>
      <Eyebrow>Premium Edition</Eyebrow>
      <h2 className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Launching soon</h2>
      <p className="font-body text-sm text-charcoal/70 leading-relaxed">
        Kiki's Armour of God, Premium Edition, will be available here as a printable PDF very soon. One purchase covers every child in your family.
      </p>
    </div>
  );
}
