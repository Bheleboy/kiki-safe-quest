import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { courseData } from "@/data/courseData";
import { ProgressBar } from "@/components/course/ProgressBar";
import { ShieldIcon, StarIcon, CertBadgeIcon } from "@/components/course/CourseIcons";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth();
  const { progress, loading } = useProgress(user?.id);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ageBand = profile?.age_band || "6-9";
  const stream = courseData.find((s) => s.id === ageBand);
  const allLessonIds = stream?.modules.flatMap((m) => m.lessons.map((l) => l.id)) || [];
  const completedCount = allLessonIds.filter((id) => progress.completedLessons.includes(id)).length;
  const totalLessons = allLessonIds.length;
  const overallProgress = totalLessons > 0 ? completedCount / totalLessons : 0;
  const totalStars = progress.earnedBadges.filter((b) => b.startsWith("star-")).length;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen gradient-dark">
      {/* Header */}
      <header className="border-b border-border/60 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldIcon size={28} className="stroke-primary" />
            <span className="font-display font-bold text-lg text-foreground uppercase tracking-wider">
              Kiki Warrior
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wide">
            Welcome, {profile?.first_name || "Warrior"}
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            Ages {ageBand} Learning Path
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card-kiki text-center">
            <ProgressBar progress={overallProgress} />
            <p className="font-body text-xs text-muted-foreground mt-2">Progress</p>
          </div>
          <div className="card-kiki text-center flex flex-col items-center justify-center">
            <StarIcon size={28} className="stroke-primary mb-1" />
            <p className="font-display text-2xl font-bold text-foreground">{totalStars}</p>
            <p className="font-body text-xs text-muted-foreground">Stars</p>
          </div>
          <div className="card-kiki text-center flex flex-col items-center justify-center">
            <CertBadgeIcon size={28} className="stroke-primary mb-1" />
            <p className="font-display text-2xl font-bold text-foreground">{completedCount}</p>
            <p className="font-body text-xs text-muted-foreground">Lessons</p>
          </div>
        </div>

        {/* Resume */}
        <button
          onClick={() => navigate("/course")}
          className="w-full touch-target btn-copper py-4 text-base uppercase tracking-widest"
        >
          {completedCount > 0 ? "Resume Learning" : "Start Course"}
        </button>

        {/* Modules Overview */}
        {stream && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
              Your Modules
            </h2>
            {stream.modules.map((mod, i) => {
              const modLessonIds = mod.lessons.map((l) => l.id);
              const modCompleted = modLessonIds.filter((id) => progress.completedLessons.includes(id)).length;
              const modProgress = modLessonIds.length > 0 ? modCompleted / modLessonIds.length : 0;

              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-kiki"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide">
                      {mod.title}
                    </h3>
                    <span className="font-body text-xs text-muted-foreground">
                      {modCompleted}/{modLessonIds.length}
                    </span>
                  </div>
                  <ProgressBar progress={modProgress} />
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
