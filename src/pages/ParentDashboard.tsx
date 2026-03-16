import { motion } from "framer-motion";
import { ArrowLeft, Clock, Trophy, BarChart3, BookOpen, Star, CheckCircle2, ArrowRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useArmour } from "@/hooks/useArmour";
import { courseData } from "@/data/courseData";
import { ONLINE_SAFETY_PIECES } from "@/data/armourData";
import { CourseIcon } from "@/components/course/CourseIcons";
import { ProgressBar } from "@/components/course/ProgressBar";
import { ArmourCollection } from "@/components/armour/ArmourCollection";
import { KikiWarriorAvatar } from "@/components/armour/KikiWarriorAvatar";
import { ChildSurveyReview } from "@/components/survey/ChildSurveyReview";
import { ParentSurvey } from "@/components/survey/ParentSurvey";
import { useNavigate } from "react-router-dom";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const { progress, loading } = useProgress(user?.id);
  const { earnedPieces, loading: armourLoading, getPieceProgress } = useArmour(user?.id);
  const navigate = useNavigate();

  const learnerName = profile?.first_name || "Learner";
  const ageBand = profile?.age_band || "6-9";

  const stream = courseData.find((s) => s.id === ageBand);
  const allStreams = stream ? [stream] : courseData;

  const totalLessonsCompleted = progress.completedLessons.length;
  const totalBadges = progress.earnedBadges.length;
  const totalTimeSeconds = Object.values(progress.timeSpent).reduce((sum, t) => sum + t, 0);

  const allScores = Object.values(progress.quizScores);
  const averageScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
    : 0;

  const safetyPiecesEarned = ONLINE_SAFETY_PIECES.filter((p) => earnedPieces.includes(p.id)).length;
  const allSafetyComplete = safetyPiecesEarned === 3;

  const pieceProgress = Object.fromEntries(
    ["belt-of-truth", "shield-of-faith", "helmet-of-salvation"].map((id) => [
      id,
      getPieceProgress(id, ageBand, progress.completedLessons),
    ])
  );

  if (loading || armourLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark">
      <header className="sticky top-0 z-50 glass-overlay border-b border-border/60 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/family")}
            className="touch-target p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground uppercase tracking-wider">
              Parent Dashboard
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              Tracking {learnerName}'s progress
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <SummaryCard icon={<BookOpen className="w-5 h-5" />} label="Lessons Done" value={String(totalLessonsCompleted)} color="text-primary" />
          <SummaryCard icon={<BarChart3 className="w-5 h-5" />} label="Avg. Score" value={`${averageScore}%`} color="text-success" />
          <SummaryCard icon={<Clock className="w-5 h-5" />} label="Time Spent" value={formatTime(totalTimeSeconds)} color="text-secondary" />
          <SummaryCard icon={<Trophy className="w-5 h-5" />} label="Armour Pieces" value={`${safetyPiecesEarned}/3`} color="text-accent" />
        </motion.div>

        {/* Armour Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="card-kiki">
            <div className="flex flex-col items-center mb-4">
              <KikiWarriorAvatar earnedPieces={earnedPieces} size="md" />
            </div>
            <ArmourCollection earnedPieces={earnedPieces} pieceProgress={pieceProgress} />
          </div>
        </motion.div>

        {/* Christian Academy CTA */}
        {allSafetyComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-kiki border-primary/30 bg-gradient-to-b from-primary/5 to-card space-y-3"
          >
            <p className="font-display text-base font-bold text-foreground uppercase tracking-wide">
              {learnerName} has earned 3 pieces of the Armour of God!
            </p>
            <p className="font-body text-sm text-muted-foreground">
              Continue the journey in Kiki Christian Academy to unlock the remaining pieces.
            </p>
            <button className="btn-copper px-6 py-3 text-sm uppercase tracking-widest flex items-center gap-2">
              Continue the Journey <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Per-Module Breakdown */}
        {allStreams.map((stream) => (
          <motion.div
            key={stream.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
              {stream.label}
            </h2>

            {stream.modules.map((mod) => {
              const lessonIds = mod.lessons.map((l) => l.id);
              const completedCount = lessonIds.filter((id) =>
                progress.completedLessons.includes(id)
              ).length;
              const moduleProgress = lessonIds.length > 0 ? completedCount / lessonIds.length : 0;

              const moduleTime = lessonIds.reduce(
                (sum, id) => sum + (progress.timeSpent[id] || 0),
                0
              );

              const moduleScores = lessonIds
                .filter((id) => progress.quizScores[id] !== undefined)
                .map((id) => progress.quizScores[id]);
              const moduleAvg = moduleScores.length > 0
                ? Math.round(moduleScores.reduce((s, v) => s + v, 0) / moduleScores.length)
                : null;

              return (
                <div key={mod.id} className="card-kiki space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <CourseIcon name={mod.icon || "shield"} size={20} className="stroke-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide truncate">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-body">
                        {completedCount}/{lessonIds.length} lessons · {formatTime(moduleTime)}
                      </p>
                    </div>
                    {moduleAvg !== null && (
                      <span className={`text-sm font-display font-bold px-3 py-1 rounded-full ${
                        moduleAvg >= 70
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {moduleAvg}%
                      </span>
                    )}
                  </div>

                  <ProgressBar progress={moduleProgress} label="Module Progress" />

                  <div className="space-y-2">
                    {mod.lessons.map((lesson) => {
                      const isComplete = progress.completedLessons.includes(lesson.id);
                      const score = progress.quizScores[lesson.id];
                      const time = progress.timeSpent[lesson.id] || 0;

                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-3 rounded-lg p-3 text-sm font-body transition-colors ${
                            isComplete ? "bg-muted/50" : "bg-muted/20"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                          )}
                          <span className="flex-1 text-foreground truncate">{lesson.title}</span>
                          {time > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(time)}
                            </span>
                          )}
                          {score !== undefined && (
                            <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full ${
                              score >= 70
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}>
                              {score}%
                            </span>
                          )}
                          {score === 100 && (
                            <Star className="w-4 h-4 text-primary fill-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ))}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card-kiki text-center space-y-1">
      <div className={`inline-flex ${color}`}>{icon}</div>
      <p className="font-display text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">{label}</p>
    </div>
  );
}
