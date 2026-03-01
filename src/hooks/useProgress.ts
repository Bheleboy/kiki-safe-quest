import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProgressState {
  completedLessons: string[];
  earnedBadges: string[];
  quizScores: Record<string, number>;
  timeSpent: Record<string, number>;
}

export function useProgress(userId: string | undefined, childId?: string | null) {
  const [progress, setProgress] = useState<ProgressState>({
    completedLessons: [],
    earnedBadges: [],
    quizScores: {},
    timeSpent: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      let progressQuery = supabase.from("progress").select("*").eq("user_id", userId);
      let badgesQuery = supabase.from("badges").select("*").eq("user_id", userId);

      if (childId) {
        progressQuery = progressQuery.eq("child_id", childId);
        badgesQuery = badgesQuery.eq("child_id", childId);
      }

      const [progressRes, badgesRes] = await Promise.all([progressQuery, badgesQuery]);

      const completedLessons: string[] = [];
      const quizScores: Record<string, number> = {};
      const timeSpent: Record<string, number> = {};

      if (progressRes.data) {
        for (const row of progressRes.data as any[]) {
          completedLessons.push(row.lesson_id);
          quizScores[row.lesson_id] = row.score;
          timeSpent[row.lesson_id] = row.time_spent_seconds || 0;
        }
      }

      const earnedBadges = (badgesRes.data as any[] || []).map((b: any) => b.badge_id);

      setProgress({ completedLessons, earnedBadges, quizScores, timeSpent });
      setLoading(false);
    };

    fetchProgress();
  }, [userId, childId]);

  const completeLesson = useCallback(async (lessonId: string, score: number, timeSeconds?: number) => {
    if (!userId) return;

    const record: any = {
      user_id: userId,
      lesson_id: lessonId,
      score,
      time_spent_seconds: timeSeconds || 0,
    };
    if (childId) record.child_id = childId;

    await supabase.from("progress").upsert(record, { onConflict: "user_id,lesson_id" });

    setProgress((prev) => ({
      ...prev,
      completedLessons: prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId],
      quizScores: {
        ...prev.quizScores,
        [lessonId]: Math.max(prev.quizScores[lessonId] ?? 0, score),
      },
      timeSpent: {
        ...prev.timeSpent,
        [lessonId]: (prev.timeSpent[lessonId] ?? 0) + (timeSeconds || 0),
      },
    }));
  }, [userId, childId]);

  const earnBadge = useCallback(async (badgeId: string) => {
    if (!userId) return;

    const record: any = { user_id: userId, badge_id: badgeId };
    if (childId) record.child_id = childId;

    await supabase.from("badges").upsert(record, { onConflict: "user_id,badge_id" });

    setProgress((prev) => ({
      ...prev,
      earnedBadges: prev.earnedBadges.includes(badgeId)
        ? prev.earnedBadges
        : [...prev.earnedBadges, badgeId],
    }));
  }, [userId, childId]);

  const isLessonComplete = useCallback(
    (lessonId: string) => progress.completedLessons.includes(lessonId),
    [progress.completedLessons]
  );

  const getModuleProgress = useCallback(
    (lessonIds: string[]) => {
      const completed = lessonIds.filter((id) => progress.completedLessons.includes(id)).length;
      return lessonIds.length > 0 ? completed / lessonIds.length : 0;
    },
    [progress.completedLessons]
  );

  const isStreamComplete = useCallback(
    (allLessonIds: string[]) => allLessonIds.every((id) => progress.completedLessons.includes(id)),
    [progress.completedLessons]
  );

  return {
    progress,
    loading,
    completeLesson,
    earnBadge,
    isLessonComplete,
    getModuleProgress,
    isStreamComplete,
  };
}
