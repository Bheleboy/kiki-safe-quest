import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0-1
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  const percent = Math.round(progress * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-display font-bold text-muted-foreground">{label}</span>
          <span className="text-xs font-display font-bold text-primary">{percent}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          style={{ background: "linear-gradient(90deg, hsl(205 85% 50%), hsl(160 50% 55%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
