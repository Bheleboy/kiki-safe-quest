import { useState, useCallback, useEffect } from "react";

interface ProgressState {
  completedLessons: string[];
  earnedBadges: string[];
  quizScores: Record<string, number>;
  learnerName: string;
}

const STORAGE_KEY = "kiki-warrior-progress";

const getInitialState = (): ProgressState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { completedLessons: [], earnedBadges: [], quizScores: {}, learnerName: "" };
};

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const completeLesson = useCallback((lessonId: string, score: number) => {
    setProgress((prev) => ({
      ...prev,
      completedLessons: prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId],
      quizScores: { ...prev.quizScores, [lessonId]: Math.max(prev.quizScores[lessonId] ?? 0, score) },
    }));
  }, []);

  const earnBadge = useCallback((badgeId: string) => {
    setProgress((prev) => ({
      ...prev,
      earnedBadges: prev.earnedBadges.includes(badgeId) ? prev.earnedBadges : [...prev.earnedBadges, badgeId],
    }));
  }, []);

  const setLearnerName = useCallback((name: string) => {
    setProgress((prev) => ({ ...prev, learnerName: name }));
  }, []);

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

  const resetProgress = useCallback(() => {
    setProgress({ completedLessons: [], earnedBadges: [], quizScores: {}, learnerName: "" });
  }, []);

  return {
    progress,
    completeLesson,
    earnBadge,
    setLearnerName,
    isLessonComplete,
    getModuleProgress,
    isStreamComplete,
    resetProgress,
  };
}
