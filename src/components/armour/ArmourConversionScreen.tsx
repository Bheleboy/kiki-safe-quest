import { motion } from "framer-motion";
import { ArmourPieceIcon } from "./ArmourPieceIcon";
import { KikiWarriorAvatar } from "./KikiWarriorAvatar";
import { ONLINE_SAFETY_PIECES, CHRISTIAN_ACADEMY_PIECES } from "@/data/armourData";
import { ArrowRight } from "lucide-react";

interface ArmourConversionScreenProps {
  earnedPieces: string[];
  learnerName: string;
}

export function ArmourConversionScreen({ earnedPieces, learnerName }: ArmourConversionScreenProps) {
  const safetyComplete = ONLINE_SAFETY_PIECES.every((p) => earnedPieces.includes(p.id));

  if (!safetyComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-kiki space-y-6 border-primary/30 bg-gradient-to-b from-primary/5 to-card"
    >
      {/* Earned pieces */}
      <div className="text-center space-y-3">
        <p className="font-display text-sm text-primary uppercase tracking-widest font-medium">
          Congratulations, {learnerName}!
        </p>
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          3 Armour Pieces Earned!
        </h3>
        <div className="flex justify-center gap-4">
          {ONLINE_SAFETY_PIECES.map((piece) => (
            <div key={piece.id} className="text-center space-y-1">
              <ArmourPieceIcon pieceId={piece.id} earned size={40} />
              <p className="font-display text-[10px] uppercase tracking-wide text-foreground font-medium">
                {piece.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Remaining pieces */}
      <div className="border-t border-border/40 pt-4 text-center space-y-3">
        <h4 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
          Complete the Full Armour of God
        </h4>
        <p className="font-body text-sm text-muted-foreground">
          {learnerName} has earned 3 of 6 pieces. Continue the journey in Kiki Christian Academy to unlock the remaining armour!
        </p>
        <div className="flex justify-center gap-4">
          {CHRISTIAN_ACADEMY_PIECES.map((piece) => (
            <div key={piece.id} className="text-center space-y-1">
              <ArmourPieceIcon pieceId={piece.id} earned={false} size={40} />
              <p className="font-display text-[10px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                {piece.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button className="w-full btn-copper py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-2">
        Continue the Journey <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
