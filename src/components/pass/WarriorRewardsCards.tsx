import { Eyebrow } from "@/components/ui/editorial";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { ProgressBar } from "@/components/course/ProgressBar";

/** Warrior Points total on the stream view. No prices or links. */
export function WarriorPointsCard({ total, possible }: { total: number; possible: number }) {
  const progress = possible > 0 ? Math.min(1, total / possible) : 0;
  return (
    <div className="card-kiki space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>Warrior Points</Eyebrow>
          <p className="font-display text-2xl font-bold text-charcoal">
            {total} <span className="text-sm font-medium text-charcoal/60">of {possible}</span>
          </p>
        </div>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary shrink-0">
          <ShieldIcon size={24} className="stroke-primary-foreground" />
        </div>
      </div>
      <ProgressBar progress={progress} label="Toward the Armour Kit" />
    </div>
  );
}

/** Shown to the child once their kit is earned. No addresses and no tracking links. */
export function KitEarnedCard() {
  return (
    <div className="card-kiki border-primary/30 bg-primary/5 text-center space-y-2 py-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary bounce-in">
        <ShieldIcon size={28} className="stroke-primary-foreground" />
      </div>
      <h3 className="font-display text-lg font-bold text-charcoal uppercase tracking-wide">Your Armour Kit is on its way</h3>
      <p className="font-body text-sm text-charcoal/70">Ask a parent to check the delivery.</p>
    </div>
  );
}
