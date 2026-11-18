import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ListOrdered } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { NarrationToggle } from "./NarrationToggle";
import { QuizBlock } from "./QuizBlock";
import type { Lesson, Module } from "@/data/courseData";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { LessonPosition, StripState } from "@/lib/courseWayfinding";

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
  /** Mission and lesson position for the header. */
  position?: LessonPosition | null;
  /** This mission's lessons for the thin progress strip. */
  strip?: StripState[];
  /** Renders the full lesson list for the small-screen sheet; call close after choosing a lesson. */
  renderAllLessons?: (close: () => void) => ReactNode;
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
  position,
  strip,
  renderAllLessons,
}: LessonViewProps) {
  const [showParentTip, setShowParentTip] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const doneCount = strip?.filter((s) => s === "done").length ?? 0;
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
      <div className="flex items-start gap-3">
        <Button variant="ghost" onClick={onBack} className="touch-target p-2 rounded-lg hover:bg-primary/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-charcoal" />
        </Button>
        <div className="flex-1 min-w-0">
          {position ? (
            <p className="text-xs text-primary font-display font-medium uppercase tracking-wide">
              Mission {position.missionNumber} of {position.missionCount} · Lesson {position.lessonNumber} of {position.lessonCount}
            </p>
          ) : null}
          <p className="text-xs text-charcoal/70 font-display font-medium uppercase tracking-wide break-words">
            {module.title}
          </p>
          <h2 className="editorial-lesson-title font-display text-xl sm:text-2xl font-bold uppercase text-charcoal break-words">{lesson.title}</h2>
          <p className="text-xs text-charcoal/70 font-body mt-0.5">
            🎬 {lesson.videoDurationMinutes} min video · ⏱ ~{lesson.estimatedMinutes} min total
          </p>
          {strip && strip.length > 0 && (
            <div
              className="mt-2 flex gap-1"
              role="img"
              aria-label={`Mission progress: ${doneCount} of ${strip.length} lessons done`}
            >
              {strip.map((s, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    s === "done" ? "bg-success" : s === "current" ? "bg-primary" : "bg-primary/15"
                  }`}
                />
              ))}
            </div>
          )}
          <p className="text-[11px] text-charcoal/60 font-body mt-1">
            Lesson {lessonIndex + 1} of {totalLessons}
          </p>
        </div>
        {renderAllLessons && (
          <Sheet open={listOpen} onOpenChange={setListOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="lg:hidden shrink-0 h-auto gap-1.5 px-3 py-2 font-display text-[11px] uppercase tracking-wide text-primary bg-primary/10 hover:bg-primary/15"
              >
                <ListOrdered className="w-4 h-4" />
                All lessons
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" aria-describedby={undefined} className="editorial-page h-[85dvh] p-0 flex flex-col rounded-t-2xl">
              <SheetTitle className="sr-only">All lessons</SheetTitle>
              <div className="flex-1 min-h-0">{renderAllLessons(() => setListOpen(false))}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Video */}
      <VideoPlayer videoUrl={lesson.videoUrl} fallbackUrl={lesson.videoFallbackUrl} title={lesson.title} durationMinutes={lesson.videoDurationMinutes} />

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
        className="w-full flex items-center gap-2 rounded-xl border border-trust/15 bg-trust/10 p-3 text-sm font-display font-medium text-trust uppercase tracking-wide hover:bg-trust/15 transition-colors"
      >
        Parent Tip
      </Button>
      {showParentTip && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="rounded-xl border border-trust/15 bg-trust/10 p-4"
        >
          <p className="text-sm font-body text-charcoal/70">{lesson.parentTip}</p>
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
