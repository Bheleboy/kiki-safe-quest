import { MotionButton } from "@/components/ui/editorial";
import { motion } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
import { CourseIcon } from "./CourseIcons";
import { ArmourPieceIcon } from "@/components/armour/ArmourPieceIcon";
import type { Module } from "@/data/courseData";
import type { ArmourPiece } from "@/data/armourData";
import { CheckCircle } from "lucide-react";

interface ModuleCardProps {
  module: Module;
  index: number;
  progress: number;
  armourPieces?: ArmourPiece[];
  isPieceEarned?: (pieceId: string) => boolean;
  onClick: () => void;
}

export function ModuleCard({ module, index, progress, armourPieces = [], isPieceEarned = () => false, onClick }: ModuleCardProps) {
  const isComplete = progress === 1;

  return (
    <MotionButton variant="ghost"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className="w-full card-kiki adventure-card text-left hover:border-primary/40 active:scale-[0.99] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <CourseIcon name={module.icon || "shield"} size={24} className="stroke-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-charcoal uppercase tracking-wide break-words">
              {module.title}
            </h3>
            {isComplete && <CheckCircle className="w-4 h-4 text-success shrink-0" />}
          </div>
          <p className="text-xs text-charcoal/70 font-body mt-1">
            {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
            <span className="mx-1">·</span>
            <span className="text-primary/70">
              ⏱ {module.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0)} min
            </span>
          </p>

          {/* Armour piece indicators -- a module can unlock 1-2 pieces */}
          {armourPieces.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              {armourPieces.map((armourPiece) => {
                const earned = isPieceEarned(armourPiece.id);
                return (
                  <div key={armourPiece.id} className="flex items-center gap-1.5">
                    <ArmourPieceIcon pieceId={armourPiece.id} earned={earned} size={16} />
                    <span className={`font-display text-[10px] uppercase tracking-wide font-medium ${
                      earned ? "text-primary" : "text-charcoal/60"
                    }`}>
                      {earned ? `${armourPiece.name} ✓` : `Unlocks ${armourPiece.name}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-2">
            <ProgressBar progress={progress} />
          </div>
        </div>
      </div>
    </MotionButton>
  );
}
