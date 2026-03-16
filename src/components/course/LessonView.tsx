import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { NarrationToggle } from "./NarrationToggle";
import { QuizBlock } from "./QuizBlock";
import type { Lesson, Module } from "@/data/courseData";
import { useState, useRef, useEffect } from "react";

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  lessonIndex: number;
  totalLessons: number;
  isComplete: boolean;
  onComplete: (score: number, timeSeconds: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onBack: () => void;
  canAdvance: boolean;
}

export function LessonView({
  lesson,
  module,
  lessonIndex,
  totalLessons,
  isComplete,
  onComplete,
  onNext,
  onPrev,
  onBack,
  canAdvance,
}: LessonViewProps) {
  const [showParentTip, setShowParentTip] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Reset timer when lesson changes
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [lesson.id]);

  const getElapsedSeconds = () => Math.round((Date.now() - startTimeRef.current) / 1000);

  const handleQuizComplete = (score: number) => {
    onComplete(score, getElapsedSeconds());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="touch-target p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-display font-medium uppercase tracking-wide truncate">
            {module.title}
          </p>
          <h2 className="font-display text-lg font-bold text-foreground truncate">{lesson.title}</h2>
          <p className="text-xs text-muted-foreground/80 font-body mt-0.5">
            🎬 {lesson.videoDurationMinutes} min video · ⏱ ~{lesson.estimatedMinutes} min total
          </p>
        </div>
        <span className="text-xs font-display font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
          {lessonIndex + 1}/{totalLessons}
        </span>
      </div>

      {/* Video */}
      <VideoPlayer videoUrl={lesson.videoUrl} fallbackUrl={lesson.videoFallbackUrl} title={lesson.title} videoCredit={lesson.videoCredit} durationMinutes={lesson.videoDurationMinutes} />

      {/* Narration + Explanation */}
      <div className="space-y-3">
        <NarrationToggle text={lesson.narrationText} />
        <div className="card-kiki">
          <p className="font-body text-foreground leading-relaxed">{lesson.explanationText}</p>
        </div>
      </div>

      {/* Parent Tip */}
      <button
        onClick={() => setShowParentTip(!showParentTip)}
        className="w-full flex items-center gap-2 rounded-lg bg-secondary/20 p-3 text-sm font-display font-medium text-secondary-foreground uppercase tracking-wide hover:bg-secondary/30 transition-colors"
      >
        Parent Tip
      </button>
      {showParentTip && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="rounded-lg bg-secondary/10 p-4"
        >
          <p className="text-sm font-body text-secondary-foreground">{lesson.parentTip}</p>
        </motion.div>
      )}

      {/* Quiz */}
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-3 uppercase tracking-wide">Quiz Time</h3>
        <QuizBlock
          questions={lesson.quiz}
          onComplete={handleQuizComplete}
          lessonId={lesson.id}
          alreadyCompleted={isComplete}
        />
      </div>

      {/* Navigation - inline instead of fixed */}
      <div className="border-t border-border/40 pt-4 mt-6 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={lessonIndex === 0}
          className="touch-target flex items-center gap-2 rounded-lg px-5 py-3 font-display font-medium text-sm bg-muted text-muted-foreground disabled:opacity-30 hover:bg-muted/80 transition-all uppercase tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="touch-target flex items-center gap-2 btn-copper px-6 py-3 text-sm uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {lessonIndex === totalLessons - 1 ? "Finish" : "Next"} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
