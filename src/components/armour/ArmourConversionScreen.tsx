import { motion } from "framer-motion";
import { ArmourPieceIcon } from "./ArmourPieceIcon";
import { KikiWarriorAvatar } from "./KikiWarriorAvatar";
import { ONLINE_SAFETY_PIECES } from "@/data/armourData";
import { ArrowRight } from "lucide-react";

interface ArmourConversionScreenProps {
  earnedPieces: string[];
  learnerName: string;
}

export function ArmourConversionScreen({ earnedPieces, learnerName }: ArmourConversionScreenProps) {
  const allEarned = ONLINE_SAFETY_PIECES.every((p) => earnedPieces.includes(p.id));

  if (!allEarned) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-kiki space-y-6 border-primary/30 bg-gradient-to-b from-primary/5 to-card"
    >
      {/* Kiki Warrior with earned armour */}
      <div className="flex flex-col items-center space-y-3">
        <KikiWarriorAvatar earnedPieces={earnedPieces} size="md" showLabel={false} />
        <p className="font-display text-sm text-primary uppercase tracking-widest font-medium">
          Congratulations, {learnerName}!
        </p>
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          Full Armour of God Earned!
        </h3>
      </div>

      {/* Earned pieces */}
      <div className="text-center space-y-3">
        <div className="flex justify-center gap-4 flex-wrap">
          {ONLINE_SAFETY_PIECES.map((piece) => (
            <div key={piece.id} className="text-center space-y-1">
              <ArmourPieceIcon pieceId={piece.id} earned size={40} />
              <p className="font-display text-[10px] uppercase tracking-wide text-foreground font-medium">
                {piece.name}
              </p>
            </div>
          ))}
        </div>
        <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
          {learnerName} has collected all 6 pieces of the Armour of God — a true Kiki Warrior!
        </p>
      </div>

      {/* CTA */}
      <button className="w-full btn-copper py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-2">
        Continue the Journey <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
