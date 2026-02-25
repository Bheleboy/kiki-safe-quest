import { motion } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
import { CourseIcon } from "./CourseIcons";
import type { Module } from "@/data/courseData";
import { CheckCircle } from "lucide-react";

interface ModuleCardProps {
  module: Module;
  index: number;
  progress: number;
  onClick: () => void;
}

export function ModuleCard({ module, index, progress, onClick }: ModuleCardProps) {
  const isComplete = progress === 1;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className="w-full card-kiki text-left hover:border-primary/40 active:scale-[0.99] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <CourseIcon name={module.icon || "shield"} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide truncate">
              {module.title}
            </h3>
            {isComplete && <CheckCircle className="w-4 h-4 text-success shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground font-body mt-1">
            {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
          </p>
          <div className="mt-2">
            <ProgressBar progress={progress} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
