import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/editorial";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { KikiWarriorAvatar } from "@/components/armour/KikiWarriorAvatar";
import { useParentPin } from "@/components/security/ParentGate";
import { WarriorPassUnlockCard } from "@/components/pass/WarriorPassUnlockCard";

interface WarriorPassGateProps {
  learnerName: string;
  earnedPieces: string[];
  /** Where checkout returns the parent afterwards. */
  returnPath: string;
  onBack: () => void;
}

/**
 * Child-facing locked screen. No prices, payment links or external links.
 * The parent panel only opens after the parent PIN, asked every time.
 */
export function WarriorPassGate({ learnerName, earnedPieces, returnPath, onBack }: WarriorPassGateProps) {
  const { guard, dialog } = useParentPin();
  const [parentOpen, setParentOpen] = useState(false);
  // The PIN that opened the parent panel; checkout verifies it again on the server.
  const [pin, setPin] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-5">
      {dialog}
      {!parentOpen ? (
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
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={() => guard((p) => { setPin(p); setParentOpen(true); }, { force: true })}
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
              {learnerName} has finished the free lessons. The Warrior Pass unlocks every lesson for every child in your family and includes one Armour Kit.
            </p>
          </div>
          <WarriorPassUnlockCard initialPin={pin} returnPath={returnPath} />
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => { setPin(undefined); setParentOpen(false); }}
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
