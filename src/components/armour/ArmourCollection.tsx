import { motion } from "framer-motion";
import { ARMOUR_PIECES } from "@/data/armourData";
import { ArmourPieceIcon } from "./ArmourPieceIcon";
import { ProgressBar } from "@/components/course/ProgressBar";

interface ArmourCollectionProps {
  earnedPieces: string[];
  /** Per-piece progress (0–1), keyed by piece ID */
  pieceProgress?: Record<string, number>;
  compact?: boolean;
}

export function ArmourCollection({ earnedPieces, pieceProgress = {}, compact }: ArmourCollectionProps) {
  const totalEarned = ARMOUR_PIECES.filter((p) => earnedPieces.includes(p.id)).length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {ARMOUR_PIECES.map((piece) => (
          <ArmourPieceIcon
            key={piece.id}
            pieceId={piece.id}
            earned={earnedPieces.includes(piece.id)}
            size={28}
          />
        ))}
        <span className="text-xs font-display font-medium text-muted-foreground ml-1">
          {totalEarned}/6
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
          Armour of God
        </h3>
        <p className="text-sm text-muted-foreground font-body mt-1">
          {totalEarned}/6 pieces collected
        </p>
        <div className="mt-3 max-w-xs mx-auto">
          <ProgressBar progress={totalEarned / 6} />
        </div>
      </div>

      {/* All 6 pieces — earnable in the Online Safety Course */}
      <div>
        <p className="text-xs font-display font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Online Safety Course
        </p>
        <div className="grid grid-cols-3 gap-3">
          {ARMOUR_PIECES.map((piece, i) => {
            const earned = earnedPieces.includes(piece.id);
            const progress = pieceProgress[piece.id] ?? (earned ? 1 : 0);

            return (
              <motion.div
                key={piece.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`card-kiki text-center space-y-2 relative ${
                  earned ? "border-primary/40" : ""
                }`}
              >
                {earned && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <div className={`mx-auto ${earned ? "pulse-glow rounded-full p-1" : ""}`}>
                  <ArmourPieceIcon pieceId={piece.id} earned={earned} size={44} />
                </div>
                <p className={`font-display text-xs font-semibold uppercase tracking-wide ${
                  earned ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {piece.name}
                </p>
                {!earned && progress > 0 && (
                  <div className="px-2">
                    <ProgressBar progress={progress} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
