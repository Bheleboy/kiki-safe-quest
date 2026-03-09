import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { ArmourPieceIcon } from "./ArmourPieceIcon";
import { ARMOUR_PIECES } from "@/data/armourData";

interface ArmourUnlockModalProps {
  pieceId: string | null;
  totalEarned: number;
  onClose: () => void;
}

export function ArmourUnlockModal({ pieceId, totalEarned, onClose }: ArmourUnlockModalProps) {
  const piece = ARMOUR_PIECES.find((p) => p.id === pieceId);

  useEffect(() => {
    if (!piece) return;
    // Celebration confetti
    const timer = setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
        colors: ["#C87533", "#B8860B", "#DAA520", "#FFD700", "#CD853F"],
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [piece]);

  return (
    <AnimatePresence>
      {piece && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 150 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-card rounded-2xl border border-primary/30 p-8 max-w-sm w-full text-center space-y-5 shadow-2xl"
          >
            {/* Glow background */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Piece icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, damping: 10 }}
              className="relative z-10"
            >
              <div className="mx-auto w-24 h-24 rounded-full gradient-copper flex items-center justify-center pulse-glow">
                <ArmourPieceIcon pieceId={piece.id} earned size={56} className="text-primary-foreground drop-shadow-none" />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 space-y-2"
            >
              <p className="font-display text-sm text-primary uppercase tracking-widest font-medium">
                Armour Unlocked!
              </p>
              <h2 className="font-display text-2xl font-bold text-foreground uppercase tracking-wide">
                {piece.name}
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                {piece.description}
              </p>
              <p className="font-body text-xs text-muted-foreground italic">
                — {piece.verse}
              </p>
            </motion.div>

            {/* Progress */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative z-10"
            >
              <div className="flex justify-center gap-2">
                {ARMOUR_PIECES.filter((p) => p.course === "online-safety").map((p) => (
                  <ArmourPieceIcon
                    key={p.id}
                    pieceId={p.id}
                    earned={p.id === piece.id || totalEarned > ARMOUR_PIECES.filter((ap) => ap.course === "online-safety").indexOf(p)}
                    size={24}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-body mt-2">
                {totalEarned}/6 pieces of the Armour of God
              </p>
            </motion.div>

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={onClose}
              className="relative z-10 btn-copper px-8 py-3 text-sm uppercase tracking-widest"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
