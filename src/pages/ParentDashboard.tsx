import { motion } from "framer-motion";
import { ArrowLeft, Clock, Trophy, BarChart3, BookOpen, Star, CheckCircle2, ArrowRight, ClipboardList, Bell, Shield, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ChildInfo = Pick<Tables<"children">, "id" | "first_name" | "age_band">;
type Notification = Tables<"notifications">;

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function ChildProgressSection({ userId, child }: { userId: string; child: ChildInfo }) {
  const { progress, loading, getModuleProgress } = useProgress(userId, child.id);
  const { earnedPieces, loading: armourLoading, getPieceProgress } = useArmour(userId, child.id);

  const stream = courseData.find((s) => s.id === child.age_band);
  const allStreams = stream ? [stream] : courseData;

  const allLessonIds = stream?.modules.flatMap((m) => m.lessons.map((l) => l.id)) || [];
  const totalCompleted = allLessonIds.filter((id) => progress.completedLessons.includes(id)).length;
  const overallProgress = allLessonIds.length > 0 ? totalCompleted / allLessonIds.length : 0;
  const isFullyComplete = totalCompleted === allLessonIds.length && allLessonIds.length > 0;

  const totalTimeSeconds = Object.values(progress.timeSpent).reduce((sum, t) => sum + t, 0);
  const allScores = Object.values(progress.quizScores);
  const averageScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
    : 0;

  const safetyPiecesEarned = ONLINE_SAFETY_PIECES.filter((p) => earnedPieces.includes(p.id)).length;

  const pieceProgress = Object.fromEntries(
    ["belt-of-truth", "shield-of-faith", "helmet-of-salvation"].map((id) => [
      id,
      getPieceProgress(id, child.age_band, progress.completedLessons),
    ])
  );

  if (loading || armourLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<BookOpen className="w-4 h-4" />} label="Lessons" value={`${totalCompleted}/${allLessonIds.length}`} color="text-primary" />
        <SummaryCard icon={<BarChart3 className="w-4 h-4" />} label="Avg. Score" value={`${averageScore}%`} color="text-success" />
        <SummaryCard icon={<Clock className="w-4 h-4" />} label="Time Spent" value={formatTime(totalTimeSeconds)} color="text-secondary" />
        <SummaryCard icon={<Trophy className="w-4 h-4" />} label="Armour" value={`${safetyPiecesEarned}/3`} color="text-accent" />
      </div>

      <ProgressBar progress={overallProgress} label={isFullyComplete ? "Course Complete ✓" : "Overall Progress"} />

      <div className="card-kiki">
        <div className="flex flex-col items-center mb-4">
          <KikiWarriorAvatar earnedPieces={earnedPieces} size="sm" />
        </div>
        <ArmourCollection earnedPieces={earnedPieces} pieceProgress={pieceProgress} compact />
      </div>

      {allStreams.map((s) => (
        <div key={s.id} className="space-y-3">
          {s.modules.map((mod) => {
            const lessonIds = mod.lessons.map((l) => l.id);
            const completedCount = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
            const moduleProgress = lessonIds.length > 0 ? completedCount / lessonIds.length : 0;

            const moduleScores = lessonIds
              .filter((id) => progress.quizScores[id] !== undefined)
              .map((id) => progress.quizScores[id]);
            const moduleAvg = moduleScores.length > 0
              ? Math.round(moduleScores.reduce((s, v) => s + v, 0) / moduleScores.length)
              : null;

            return (
              <div key={mod.id} className="card-kiki space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <CourseIcon name={mod.icon || "shield"} size={18} className="stroke-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-sm font-bold text-foreground uppercase tracking-wide truncate">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-muted-foreground font-body">
                      {completedCount}/{lessonIds.length} lessons
                    </p>
                  </div>
                  {moduleAvg !== null && (
                    <span className={`text-xs font-display font-bold px-2 py-1 rounded-full ${
                      moduleAvg >= 70 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>
                      {moduleAvg}%
                    </span>
                  )}
                </div>
                <ProgressBar progress={moduleProgress} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showSurveyReview, setShowSurveyReview] = useState(false);
  const [showParentSurvey, setShowParentSurvey] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [childrenRes, notifRes] = await Promise.all([
      supabase.from("children").select("id, first_name, age_band").eq("parent_id", user.id).order("created_at"),
      supabase.from("notifications").select("*").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false }),
    ]);
    if (childrenRes.data) setChildren(childrenRes.data);
    if (notifRes.data) setNotifications(notifRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleReviewSurvey = (notif: Notification) => {
    setSelectedChildId(notif.child_id);
    setShowSurveyReview(true);
    markNotificationRead(notif.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  return (
    <div className="min-h-screen gradient-dark">
      <header className="sticky top-0 z-50 glass-overlay border-b border-border/60 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/family")} className="touch-target p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground uppercase tracking-wider">
              Parent Dashboard
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              {children.length > 0 ? `Tracking ${children.length} learner${children.length > 1 ? "s" : ""}` : "No children added yet"}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {notifications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h2 className="font-display text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Notifications
            </h2>
            {notifications.map((notif) => (
              <div key={notif.id} className="card-kiki border-primary/30 bg-primary/5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-foreground">{notif.title}</p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                </div>
                {notif.type === "survey_review" && (
                  <button
                    onClick={() => handleReviewSurvey(notif)}
                    className="btn-copper px-3 py-1.5 text-xs uppercase tracking-widest shrink-0"
                  >
                    Review
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => { setSelectedChildId(child.id); setShowSurveyReview(false); setShowParentSurvey(false); }}
                className={`px-4 py-2 rounded-lg font-display text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                  (selectedChild?.id === child.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {child.first_name}
              </button>
            ))}
          </div>
        )}

        {selectedChild && user && (
          <motion.div key={selectedChild.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
              {selectedChild.first_name}'s Progress
              <span className="text-sm font-normal text-muted-foreground ml-2">Ages {selectedChild.age_band}</span>
            </h2>
            <ChildProgressSection userId={user.id} child={selectedChild} />
          </motion.div>
        )}

        {children.length === 0 && (
          <div className="card-kiki text-center py-8 space-y-3">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="font-body text-muted-foreground">No children added yet.</p>
            <button onClick={() => navigate("/family")} className="btn-copper px-6 py-2.5 text-sm uppercase tracking-widest">
              Add Children
            </button>
          </div>
        )}

        {selectedChild && user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
              Surveys & Feedback
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => { setShowSurveyReview(true); setShowParentSurvey(false); }}
                className="card-kiki text-left hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground uppercase tracking-wide">Review {selectedChild.first_name}'s Surveys</p>
                    <p className="text-xs text-muted-foreground font-body">Approve and review feedback</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setShowParentSurvey(true); setShowSurveyReview(false); }}
                className="card-kiki text-left hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                    <Star className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground uppercase tracking-wide">Share Your Feedback</p>
                    <p className="text-xs text-muted-foreground font-body">Help us improve Kiki Warrior</p>
                  </div>
                </div>
              </button>
            </div>

            {showSurveyReview && (
              <ChildSurveyReview
                userId={user.id}
                childId={selectedChild.id}
                childName={selectedChild.first_name}
                onDone={() => setShowSurveyReview(false)}
              />
            )}

            {showParentSurvey && (
              <ParentSurvey
                userId={user.id}
                childId={selectedChild.id}
                childName={selectedChild.first_name}
                onComplete={() => setShowParentSurvey(false)}
                onSkip={() => setShowParentSurvey(false)}
              />
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card-kiki text-center space-y-1">
      <div className={`inline-flex ${color}`}>{icon}</div>
      <p className="font-display text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">{label}</p>
    </div>
  );
}
