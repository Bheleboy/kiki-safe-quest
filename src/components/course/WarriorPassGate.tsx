import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/editorial";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { KikiWarriorAvatar } from "@/components/armour/KikiWarriorAvatar";
import { usePurchaseLock } from "@/components/security/usePurchaseLock";
import { WarriorPassUnlockCard } from "@/components/pass/WarriorPassUnlockCard";
import { KIT_CHILD_COPY } from "@/lib/warriorPass";

interface WarriorPassGateProps {
  learnerName: string;
  earnedPieces: string[];
  /** Where checkout returns the parent afterwards. */
  returnPath: string;
  onBack: () => void;
}

/**
 * Child-facing locked screen. No prices, payment links or external links.
 * The parent panel only opens after the parent PIN, asked every time (admins too),
 * and re-locks after 2 minutes idle, a hidden tab or navigation.
 */
export function WarriorPassGate({ learnerName, earnedPieces, returnPath, onBack }: WarriorPassGateProps) {
  // The PIN that opened the parent panel is kept in memory only and reused at checkout.
  const lock = usePurchaseLock();

  return (
    <div className="space-y-5">
      {lock.dialog}
      {!lock.unlocked ? (
        <div className="card-kiki text-center space-y-5">
          <div className="flex flex-col items-center">
            <KikiWarriorAvatar earnedPieces={earnedPieces} size="md" />
          </div>
          <div className="space-y-2">
            <Eyebrow>Next adventure</Eyebrow>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-charcoal uppercase tracking-wide">
              Great work, {learnerName}!
            </h2>
            <p className="font-body text-charcoal/70 max-w-md mx-auto leading-relaxed">
              You have finished the free adventure. The next missions are part of the Warrior Pass. Ask a parent to unlock them.
            </p>
            <p className="font-body text-sm text-charcoal/60 max-w-md mx-auto">{KIT_CHILD_COPY}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={() => lock.unlock("This area is for parents. Enter your 4-digit PIN.")}
              className="touch-target btn-copper adventure-button py-3 px-6 text-sm uppercase tracking-widest"
            >
              <ShieldIcon size={18} className="stroke-primary-foreground mr-2" />
              Ask a parent
            </Button>
            <Button
              variant="ghost"
              onClick={onBack}
              className="touch-target py-3 px-6 text-sm font-display uppercase tracking-wide text-charcoal/70 hover:text-charcoal"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to my lessons
            </Button>
          </div>
        </div>
      ) : (
        <div className="card-kiki space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary">
              <ShieldIcon size={28} className="stroke-primary-foreground" />
            </div>
            <Eyebrow>For parents</Eyebrow>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-charcoal uppercase tracking-wide">
              Warrior Pass
            </h2>
            <p className="font-body text-charcoal/70 max-w-md mx-auto leading-relaxed">
              {learnerName} has finished the free lessons. The Warrior Pass unlocks every lesson for every child in your family.
            </p>
          </div>
          <WarriorPassUnlockCard pin={lock.pin} onPinExpired={lock.unlock} returnPath={returnPath} />
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={lock.relock}
              className="text-sm font-body text-charcoal/70 hover:underline"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
