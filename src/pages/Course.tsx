import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Shield } from "lucide-react";
import { courseData, type AgeStream } from "@/data/courseData";
import { useProgress } from "@/hooks/useProgress";
import { SearchBar } from "@/components/course/SearchBar";
import { ModuleCard } from "@/components/course/ModuleCard";
import { LessonView } from "@/components/course/LessonView";
import { ProgressBar } from "@/components/course/ProgressBar";
import { Certificate } from "@/components/course/Certificate";

type View =
  | { type: "home" }
  | { type: "stream"; streamId: string }
  | { type: "lesson"; streamId: string; moduleId: string; lessonIndex: number }
  | { type: "certificate"; streamId: string };

export default function CoursePage() {
  const [view, setView] = useState<View>({ type: "home" });
  const [nameInput, setNameInput] = useState("");
  const {
    progress,
    completeLesson,
    earnBadge,
    setLearnerName,
    isLessonComplete,
    getModuleProgress,
    isStreamComplete,
  } = useProgress();

  const getStream = (id: string) => courseData.find((s) => s.id === id)!;

  const getAllLessonIds = (stream: AgeStream) =>
    stream.modules.flatMap((m) => m.lessons.map((l) => l.id));

  const handleSearchNavigate = useCallback((streamId: string, lessonId: string) => {
    const stream = courseData.find((s) => s.id === streamId);
    if (!stream) return;
    for (const mod of stream.modules) {
      const idx = mod.lessons.findIndex((l) => l.id === lessonId);
      if (idx !== -1) {
        setView({ type: "lesson", streamId, moduleId: mod.id, lessonIndex: idx });
        return;
      }
    }
  }, []);

  const handleLessonComplete = useCallback(
    (lessonId: string, score: number, moduleId: string) => {
      completeLesson(lessonId, score);
      if (score === 100) earnBadge(`star-${lessonId}`);
      // Check if module complete
      if (view.type === "lesson") {
        const stream = getStream(view.streamId);
        const mod = stream.modules.find((m) => m.id === moduleId);
        if (mod) {
          const allDone = mod.lessons.every(
            (l) => l.id === lessonId || isLessonComplete(l.id)
          );
          if (allDone) earnBadge(`module-${moduleId}`);
        }
      }
    },
    [completeLesson, earnBadge, isLessonComplete, view]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b-2 border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Shield className="w-7 h-7 text-primary" />
            <span className="font-display font-extrabold text-base text-foreground hidden sm:inline">
              KikiWarrior
            </span>
          </div>
          <div className="flex-1">
            <SearchBar onNavigate={handleSearchNavigate} />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* HOME */}
          {view.type === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Hero */}
              <div className="text-center space-y-3 py-6">
                <div className="text-5xl float">🛡️</div>
                <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground text-shadow-playful">
                  Internet Safety Course
                </h1>
                <p className="font-body text-muted-foreground max-w-sm mx-auto">
                  Learn to be safe, smart, and kind online! Choose your age group to begin.
                </p>
              </div>

              {/* Name Input */}
              <div className="card-playful max-w-sm mx-auto">
                <label className="font-display text-sm font-bold text-foreground block mb-2">
                  👋 What's your name?
                </label>
                <input
                  type="text"
                  value={progress.learnerName || nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setLearnerName(e.target.value);
                  }}
                  placeholder="Type your name here..."
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Age Selection */}
              <div className="grid gap-4">
                {courseData.map((stream) => {
                  const allIds = getAllLessonIds(stream);
                  const prog = getModuleProgress(allIds);
                  const complete = isStreamComplete(allIds);

                  return (
                    <motion.button
                      key={stream.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView({ type: "stream", streamId: stream.id })}
                      className={`${stream.gradient} rounded-3xl p-6 md:p-8 text-left text-primary-foreground shadow-lg relative overflow-hidden`}
                    >
                      <div className="relative z-10">
                        <span className="text-4xl md:text-5xl">{stream.emoji}</span>
                        <h2 className="font-display text-2xl md:text-3xl font-extrabold mt-2">
                          {stream.label}
                        </h2>
                        <p className="font-body text-primary-foreground/80 text-sm mt-1">
                          {stream.description}
                        </p>
                        {prog > 0 && (
                          <div className="mt-3 max-w-xs">
                            <ProgressBar progress={prog} label={complete ? "✅ Complete!" : "Your progress"} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -right-6 -bottom-6 text-8xl opacity-20">
                        {stream.emoji}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STREAM VIEW */}
          {view.type === "stream" && (() => {
            const stream = getStream(view.streamId);
            const allIds = getAllLessonIds(stream);
            const complete = isStreamComplete(allIds);

            return (
              <motion.div
                key="stream"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView({ type: "home" })}
                    className="touch-target p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                  </button>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-foreground">
                      {stream.emoji} {stream.label}
                    </h2>
                    <p className="text-xs text-muted-foreground font-body">{stream.description}</p>
                  </div>
                </div>

                <ProgressBar progress={getModuleProgress(allIds)} label="Overall Progress" />

                <div className="grid gap-4">
                  {stream.modules.map((mod, i) => (
                    <ModuleCard
                      key={mod.id}
                      module={mod}
                      index={i}
                      progress={getModuleProgress(mod.lessons.map((l) => l.id))}
                      onClick={() =>
                        setView({
                          type: "lesson",
                          streamId: stream.id,
                          moduleId: mod.id,
                          lessonIndex: 0,
                        })
                      }
                    />
                  ))}
                </div>

                {complete && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="text-center">
                      <div className="text-5xl bounce-in mb-2">🏆</div>
                      <h3 className="font-display text-xl font-extrabold text-foreground">
                        Congratulations!
                      </h3>
                      <p className="text-sm text-muted-foreground font-body">
                        You completed all modules! Download your certificate below.
                      </p>
                    </div>
                    <Certificate
                      learnerName={progress.learnerName || "Internet Hero"}
                      ageGroup={stream.id as "6-9" | "10-13"}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })()}

          {/* LESSON VIEW */}
          {view.type === "lesson" && (() => {
            const stream = getStream(view.streamId);
            const mod = stream.modules.find((m) => m.id === view.moduleId)!;
            const allStreamLessons = stream.modules.flatMap((m) =>
              m.lessons.map((l) => ({ lesson: l, module: m }))
            );
            const flatIndex = allStreamLessons.findIndex(
              (x) => x.lesson.id === mod.lessons[view.lessonIndex]?.id
            );
            const current = allStreamLessons[flatIndex];

            if (!current) return null;

            return (
              <motion.div
                key={`lesson-${current.lesson.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <LessonView
                  lesson={current.lesson}
                  module={current.module}
                  lessonIndex={flatIndex}
                  totalLessons={allStreamLessons.length}
                  isComplete={isLessonComplete(current.lesson.id)}
                  onComplete={(score) =>
                    handleLessonComplete(current.lesson.id, score, current.module.id)
                  }
                  onNext={() => {
                    if (flatIndex < allStreamLessons.length - 1) {
                      const next = allStreamLessons[flatIndex + 1];
                      setView({
                        type: "lesson",
                        streamId: view.streamId,
                        moduleId: next.module.id,
                        lessonIndex: next.module.lessons.indexOf(next.lesson),
                      });
                    } else {
                      setView({ type: "stream", streamId: view.streamId });
                    }
                  }}
                  onPrev={() => {
                    if (flatIndex > 0) {
                      const prev = allStreamLessons[flatIndex - 1];
                      setView({
                        type: "lesson",
                        streamId: view.streamId,
                        moduleId: prev.module.id,
                        lessonIndex: prev.module.lessons.indexOf(prev.lesson),
                      });
                    }
                  }}
                  onBack={() => setView({ type: "stream", streamId: view.streamId })}
                />
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </main>
    </div>
  );
}
