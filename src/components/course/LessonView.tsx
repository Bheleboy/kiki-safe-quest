import { Button } from "@/components/ui/button";
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
        <Button variant="ghost" onClick={onBack} className="touch-target p-2 rounded-lg hover:bg-primary/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-charcoal" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-charcoal/70 font-display font-medium uppercase tracking-wide break-words">
            {module.title}
          </p>
          <h2 className="font-display text-lg font-bold text-charcoal break-words">{lesson.title}</h2>
          <p className="text-xs text-charcoal/70 font-body mt-0.5">
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
          <p className="font-body text-charcoal leading-relaxed">{lesson.explanationText}</p>
        </div>
      </div>

      {/* Parent Tip */}
      <Button variant="ghost"
        onClick={() => setShowParentTip(!showParentTip)}
        className="w-full flex items-center gap-2 rounded-lg bg-trust/10 p-3 text-sm font-display font-medium text-trust uppercase tracking-wide hover:bg-trust/15 transition-colors"
      >
        Parent Tip
      </Button>
      {showParentTip && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="rounded-lg bg-trust/10 p-4"
        >
          <p className="text-sm font-body text-trust">{lesson.parentTip}</p>
        </motion.div>
      )}

      {/* Quiz */}
      <div>
        <h3 className="font-display text-lg font-bold text-charcoal mb-3 uppercase tracking-wide">Quiz Time</h3>
        <QuizBlock
          questions={lesson.quiz}
          onComplete={handleQuizComplete}
          lessonId={lesson.id}
          alreadyCompleted={isComplete}
        />
      </div>

      {/* Navigation - inline instead of fixed */}
      <div className="border-t border-primary/15 pt-4 mt-6 flex items-center justify-between">
        <Button variant="ghost"
          onClick={onPrev}
          disabled={lessonIndex === 0}
          className="touch-target flex items-center gap-2 rounded-lg px-5 py-3 font-display font-medium text-sm bg-primary/10 text-charcoal/70 disabled:opacity-30 hover:bg-primary/10/80 transition-all uppercase tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button variant="ghost"
          onClick={onNext}
          disabled={!canAdvance}
          className="touch-target flex items-center gap-2 btn-copper adventure-button px-6 py-3 text-sm uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {lessonIndex === totalLessons - 1 ? "Finish" : "Next"} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
