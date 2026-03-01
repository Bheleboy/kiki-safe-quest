import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogOut, Users, Home } from "lucide-react";
import { courseData, type AgeStream } from "@/data/courseData";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { SearchBar } from "@/components/course/SearchBar";
import { ModuleCard } from "@/components/course/ModuleCard";
import { LessonView } from "@/components/course/LessonView";
import { ProgressBar } from "@/components/course/ProgressBar";
import { Certificate } from "@/components/course/Certificate";
import { ShieldIcon, CourseIcon, CertBadgeIcon } from "@/components/course/CourseIcons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type View =
  | { type: "home" }
  | { type: "stream"; streamId: string }
  | { type: "lesson"; streamId: string; moduleId: string; lessonIndex: number }
  | { type: "certificate"; streamId: string };

interface ChildInfo {
  id: string;
  first_name: string;
  age_band: string;
}

export default function CoursePage() {
  const [view, setView] = useState<View>({ type: "home" });
  const { user, profile, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("child");
  const [child, setChild] = useState<ChildInfo | null>(null);
  const navigate = useNavigate();

  // Fetch child info
  useEffect(() => {
    if (!childId || !user) return;
    supabase
      .from("children")
      .select("id, first_name, age_band")
      .eq("id", childId)
      .eq("parent_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setChild(data as unknown as ChildInfo);
      });
  }, [childId, user]);

  const {
    progress,
    completeLesson,
    earnBadge,
    isLessonComplete,
    getModuleProgress,
    isStreamComplete,
  } = useProgress(user?.id, childId);

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
    (lessonId: string, score: number, timeSeconds: number, moduleId: string) => {
      if (score < 70) return;
      completeLesson(lessonId, score, timeSeconds);
      if (score === 100) earnBadge(`star-${lessonId}`);
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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const learnerName = child?.first_name || profile?.first_name || "Warrior";
  // Use child's age band if available, otherwise fallback
  const ageBand = child?.age_band || profile?.age_band;

  // If child has specific age band, filter to that stream
  const filteredStreams = ageBand
    ? courseData.filter((s) => s.id === ageBand)
    : courseData;

  return (
    <div className="min-h-screen gradient-dark">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass-overlay border-b border-border/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <ShieldIcon size={24} className="stroke-primary" />
            <span className="font-display font-bold text-sm text-foreground uppercase tracking-wider hidden sm:inline">
              Kiki Warrior
            </span>
          </div>
          <div className="flex-1">
            <SearchBar onNavigate={handleSearchNavigate} />
          </div>
          <button
            onClick={() => navigate("/family")}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
            title="Family Hub"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/parent")}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
            title="Parent Dashboard"
          >
            <Users className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <LogOut className="w-5 h-5" />
          </button>
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-copper float">
                  <ShieldIcon size={32} className="stroke-primary-foreground" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
                  Internet Safety
                </h1>
                <p className="font-body text-muted-foreground max-w-sm mx-auto">
                  {child
                    ? `${learnerName}'s learning journey`
                    : `Choose your learning path, ${learnerName}.`}
                </p>
              </div>

              {/* Age Selection */}
              <div className="grid gap-4">
                {filteredStreams.map((stream) => {
                  const allIds = getAllLessonIds(stream);
                  const prog = getModuleProgress(allIds);
                  const complete = isStreamComplete(allIds);

                  return (
                    <motion.button
                      key={stream.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setView({ type: "stream", streamId: stream.id })}
                      className="card-kiki text-left relative overflow-hidden group"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-lg gradient-copper flex items-center justify-center">
                            <CourseIcon name={stream.id === "6-9" ? "shield" : "eye"} size={24} className="stroke-primary-foreground" />
                          </div>
                          <div>
                            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground uppercase tracking-wide">
                              {stream.label}
                            </h2>
                            <p className="font-body text-muted-foreground text-sm">
                              {stream.description}
                            </p>
                          </div>
                        </div>
                        {prog > 0 && (
                          <div className="mt-3">
                            <ProgressBar progress={prog} label={complete ? "Complete" : "Your progress"} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CourseIcon name="shield" size={100} className="stroke-foreground" />
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
                    className="touch-target p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                  </button>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
                      {stream.label}
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
                      <div className="bounce-in mb-2">
                        <CertBadgeIcon size={48} className="stroke-primary mx-auto" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
                        Congratulations!
                      </h3>
                      <p className="text-sm text-muted-foreground font-body">
                        You completed all modules. Download your certificate below.
                      </p>
                    </div>
                    <Certificate
                      learnerName={learnerName}
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
                  canAdvance={isLessonComplete(current.lesson.id)}
                  onComplete={(score, timeSeconds) =>
                    handleLessonComplete(current.lesson.id, score, timeSeconds, current.module.id)
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
