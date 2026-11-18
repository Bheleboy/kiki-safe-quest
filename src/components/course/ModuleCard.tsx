import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { CourseIcon } from "./CourseIcons";
import { ArmourPieceIcon } from "@/components/armour/ArmourPieceIcon";
import type { Module } from "@/data/courseData";
import type { ArmourPiece } from "@/data/armourData";
import type { LessonRow } from "@/lib/courseWayfinding";
import { CheckCircle, ChevronDown, Lock } from "lucide-react";

interface ModuleCardProps {
  module: Module;
  index: number;
  progress: number;
  armourPieces?: ArmourPiece[];
  isPieceEarned?: (pieceId: string) => boolean;
  /** Opens the first open lesson of the mission. */
  onClick: () => void;
  /** True only when every lesson in the module is behind the Warrior Pass. */
  locked?: boolean;
  /** "Mission 1 of 3" position within the stream. */
  missionNumber?: number;
  missionCount?: number;
  /** Numbered lesson rows with their state. When absent, no lesson list is shown. */
  lessons?: LessonRow[];
  /** Opens a lesson by its index in the mission (locked lessons land on the Warrior Pass gate). */
  onSelectLesson?: (lessonIndex: number) => void;
}

export function ModuleCard({
  module, index, progress, armourPieces = [], isPieceEarned = () => false, onClick, locked = false,
  missionNumber, missionCount, lessons, onSelectLesson,
}: ModuleCardProps) {
  const isComplete = progress === 1;
  const [expanded, setExpanded] = useState(false);
  const rows = lessons ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="w-full card-kiki adventure-card hover:border-primary/40 transition-all group"
    >
      <Button
        variant="ghost"
        onClick={onClick}
        className="w-full h-auto p-0 justify-start text-left whitespace-normal hover:bg-transparent active:scale-[0.99]"
      >
        <div className="flex w-full items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <CourseIcon name={module.icon || "shield"} size={24} className="stroke-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {missionNumber && missionCount ? (
              <p className="font-display text-[10px] uppercase tracking-widest font-medium text-primary">
                Mission {missionNumber} of {missionCount}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-charcoal uppercase tracking-wide break-words">
                {module.title}
              </h3>
              {isComplete && <CheckCircle className="w-4 h-4 text-success shrink-0" />}
              {locked && (
                <span className="inline-flex items-center gap-1 shrink-0 font-display text-[10px] uppercase tracking-wide font-medium text-charcoal/60">
                  <Lock className="w-3 h-3" />
                  Warrior Pass
                </span>
              )}
            </div>
            <p className="text-xs text-charcoal/70 font-body mt-1">
              {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
              <span className="mx-1">·</span>
              <span className="text-primary/70">
                ⏱ {module.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0)} min
              </span>
            </p>

            {/* Armour piece indicators: a module can unlock 1 or 2 pieces */}
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
      </Button>

      {rows.length > 0 && (
        <div className="mt-3 border-t border-primary/15 pt-3">
          <ol className="space-y-1" aria-label={`Lessons in ${module.title}`}>
            {rows.map((row, i) => (
              <li key={row.id} className={i > 0 && !expanded ? "hidden md:block" : undefined}>
                <Button
                  variant="ghost"
                  onClick={() => onSelectLesson?.(i)}
                  aria-current={row.state === "next" ? "step" : undefined}
                  className={`w-full h-auto justify-start gap-2 px-3 py-2 text-left whitespace-normal ${
                    row.state === "next"
                      ? "bg-primary/15 border border-primary/30 hover:bg-primary/20"
                      : "border border-transparent hover:bg-primary/10"
                  }`}
                >
                  <span className={`flex-1 min-w-0 break-words font-body text-xs ${
                    row.state === "done" ? "text-charcoal/70" : "text-charcoal"
                  }`}>
                    {row.label}
                  </span>
                  {row.state === "done" && (
                    <CheckCircle className="w-4 h-4 text-success shrink-0" aria-label="Completed" />
                  )}
                  {row.state === "locked" && (
                    <span className="inline-flex items-center gap-1 shrink-0 font-display text-[10px] uppercase tracking-wide font-medium text-charcoal/60">
                      <Lock className="w-3 h-3" />
                      Warrior Pass
                    </span>
                  )}
                  {row.state === "next" && (
                    <span className="shrink-0 font-display text-[10px] uppercase tracking-wide font-medium text-primary">
                      Up next
                    </span>
                  )}
                </Button>
              </li>
            ))}
          </ol>
          {rows.length > 1 && (
            <Button
              variant="ghost"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="md:hidden mt-1 h-auto w-full justify-start gap-1 px-3 py-2 font-display text-[11px] uppercase tracking-wide text-primary hover:bg-primary/10"
            >
              {expanded ? "Show fewer lessons" : `Show all ${rows.length} lessons`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
