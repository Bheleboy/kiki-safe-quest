import { motion, AnimatePresence } from "framer-motion";
import { ARMOUR_PIECES, ONLINE_SAFETY_PIECES } from "@/data/armourData";

import kikiBase from "@/assets/armour/kiki-base.png";
import kikiBelt from "@/assets/armour/kiki-belt.png";
import kikiBeltShield from "@/assets/armour/kiki-belt-shield.png";
import kikiBeltShieldHelmet from "@/assets/armour/kiki-belt-shield-helmet.png";
import kiki4Pieces from "@/assets/armour/kiki-4pieces.png";
import kiki5Pieces from "@/assets/armour/kiki-5pieces.png";
import kikiFullArmour from "@/assets/armour/kiki-full-armour.png";

/**
 * The order armour is earned in:
 * 1. Belt of Truth (online safety)
 * 2. Shield of Faith (online safety)
 * 3. Helmet of Salvation (online safety)
 * 4. Breastplate of Righteousness (christian academy)
 * 5. Sword of the Spirit (christian academy)
 * 6. Shoes of Peace (christian academy)
 */
const PROGRESSION_ORDER = [
  "belt-of-truth",
  "shield-of-faith",
  "helmet-of-salvation",
  "breastplate-of-righteousness",
  "sword-of-the-spirit",
  "shoes-of-peace",
];

const PROGRESSION_IMAGES = [
  kikiBase,          // 0 pieces
  kikiBelt,          // 1 piece
  kikiBeltShield,    // 2 pieces
  kikiBeltShieldHelmet, // 3 pieces
  kiki4Pieces,       // 4 pieces
  kiki5Pieces,       // 5 pieces
  kikiFullArmour,    // 6 pieces (full armour!)
];

interface KikiWarriorAvatarProps {
  earnedPieces: string[];
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function KikiWarriorAvatar({
  earnedPieces,
  size = "md",
  showLabel = true,
  className = "",
}: KikiWarriorAvatarProps) {
  // Count how many pieces earned in progression order
  const earnedCount = PROGRESSION_ORDER.filter((id) => earnedPieces.includes(id)).length;
  const imageIndex = Math.min(earnedCount, PROGRESSION_IMAGES.length - 1);
  const currentImage = PROGRESSION_IMAGES[imageIndex];

  const isFullArmour = earnedCount === 6;
  const safetyComplete = ONLINE_SAFETY_PIECES.every((p) => earnedPieces.includes(p.id));

  const sizeClasses = {
    sm: "w-24 h-32",
    md: "w-40 h-52",
    lg: "w-56 h-72",
  };

  const label =
    earnedCount === 0
      ? "Begin Your Journey"
      : isFullArmour
      ? "Full Armour of God!"
      : safetyComplete
      ? `${earnedCount}/6 Pieces — Keep Going!`
      : `${earnedCount}/6 Pieces Earned`;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Glow effect for earned pieces */}
        {earnedCount > 0 && (
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${
              isFullArmour
                ? "bg-primary/30 scale-125"
                : "bg-primary/15 scale-110"
            }`}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={imageIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 150 }}
            className={`relative ${sizeClasses[size]}`}
          >
            <img
              src={currentImage}
              alt={`Kiki Warrior with ${earnedCount} armour pieces`}
              className={`w-full h-full object-contain drop-shadow-lg ${
                isFullArmour ? "drop-shadow-[0_0_15px_hsl(25_85%_55%/0.4)]" : ""
              }`}
            />

            {/* Sparkle effect for full armour */}
            {isFullArmour && (
              <>
                <motion.div
                  className="absolute top-2 right-4 w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="absolute top-8 left-2 w-1.5 h-1.5 rounded-full bg-secondary"
                  animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div
                  className="absolute bottom-12 right-2 w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Piece counter badge */}
        {earnedCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-display text-xs font-bold uppercase tracking-wider ${
              isFullArmour
                ? "gradient-copper text-primary-foreground"
                : "bg-primary/10 text-primary border border-primary/30"
            }`}
          >
            {earnedCount}/6
          </motion.div>
        )}
      </div>

      {showLabel && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`font-display text-xs uppercase tracking-widest text-center font-medium ${
            isFullArmour ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
