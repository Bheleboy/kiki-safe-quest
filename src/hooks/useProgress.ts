import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProgressState {
  completedLessons: string[];
  earnedBadges: string[];
  quizScores: Record<string, number>;
}

export function useProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<ProgressState>({
    completedLessons: [],
    earnedBadges: [],
    quizScores: {},
  });
  const [loading, setLoading] = useState(true);

  // Fetch from DB on mount
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      const [progressRes, badgesRes] = await Promise.all([
        supabase.from("progress").select("*").eq("user_id", userId),
        supabase.from("badges").select("*").eq("user_id", userId),
      ]);

      const completedLessons: string[] = [];
      const quizScores: Record<string, number> = {};

      if (progressRes.data) {
        for (const row of progressRes.data as any[]) {
          completedLessons.push(row.lesson_id);
          quizScores[row.lesson_id] = row.score;
        }
      }

      const earnedBadges = (badgesRes.data as any[] || []).map((b: any) => b.badge_id);

      setProgress({ completedLessons, earnedBadges, quizScores });
      setLoading(false);
    };

    fetchProgress();
  }, [userId]);

  const completeLesson = useCallback(async (lessonId: string, score: number) => {
    if (!userId) return;

    // Upsert into progress table
    await supabase.from("progress").upsert(
      { user_id: userId, lesson_id: lessonId, score } as any,
      { onConflict: "user_id,lesson_id" }
    );

    setProgress((prev) => ({
      ...prev,
      completedLessons: prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId],
      quizScores: {
        ...prev.quizScores,
        [lessonId]: Math.max(prev.quizScores[lessonId] ?? 0, score),
      },
    }));
  }, [userId]);

  const earnBadge = useCallback(async (badgeId: string) => {
    if (!userId) return;

    await supabase.from("badges").upsert(
      { user_id: userId, badge_id: badgeId } as any,
      { onConflict: "user_id,badge_id" }
    );

    setProgress((prev) => ({
      ...prev,
      earnedBadges: prev.earnedBadges.includes(badgeId)
        ? prev.earnedBadges
        : [...prev.earnedBadges, badgeId],
    }));
  }, [userId]);

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
