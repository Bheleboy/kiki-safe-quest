import { motion } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
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
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="w-full card-playful text-left hover:shadow-xl active:scale-[0.98] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl shrink-0">{module.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-foreground truncate">{module.title}</h3>
            {isComplete && <CheckCircle className="w-5 h-5 text-success shrink-0" />}
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
