import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ARMOUR_PIECES, getRequiredLessonIds, type ArmourPiece } from "@/data/armourData";
import { courseData } from "@/data/courseData";

interface ArmourState {
  earnedPieces: string[]; // piece IDs
  loading: boolean;
}

export function useArmour(userId: string | undefined, childId?: string | null) {
  const [state, setState] = useState<ArmourState>({ earnedPieces: [], loading: true });

  useEffect(() => {
    if (!userId) {
      setState({ earnedPieces: [], loading: false });
      return;
    }

    const fetch = async () => {
      let query = supabase
        .from("armour_pieces" as any)
        .select("piece_id")
        .eq("user_id", userId);

      if (childId) {
        query = query.eq("child_id", childId);
      }

      const { data } = await query;
      const earned = ((data as any[]) || []).map((r: any) => r.piece_id as string);
      setState({ earnedPieces: earned, loading: false });
    };

    fetch();
  }, [userId, childId]);

  const earnPiece = useCallback(
    async (pieceId: string, courseId: string = "online-safety") => {
      if (!userId || state.earnedPieces.includes(pieceId)) return;

      const record: any = {
        user_id: userId,
        piece_id: pieceId,
        course_id: courseId,
      };
      if (childId) record.child_id = childId;

      await supabase.from("armour_pieces" as any).upsert(record, {
        onConflict: "user_id,child_id,piece_id",
      });

      setState((prev) => ({
        ...prev,
        earnedPieces: [...prev.earnedPieces, pieceId],
      }));
    },
    [userId, childId, state.earnedPieces]
  );

  /**
   * Check which pieces should be unlocked given the current completed lessons.
   * Returns newly unlocked piece IDs (not previously earned).
   */
  const checkUnlocks = useCallback(
    (completedLessons: string[], streamId: string): ArmourPiece[] => {
      const stream = courseData.find((s) => s.id === streamId);
      if (!stream) return [];

      const newlyUnlocked: ArmourPiece[] = [];

      for (const piece of ARMOUR_PIECES) {
        if (state.earnedPieces.includes(piece.id)) continue;
        const requiredLessons = getRequiredLessonIds(piece, streamId, stream.modules);
        if (requiredLessons.length === 0) continue;
        const allComplete = requiredLessons.every((id) => completedLessons.includes(id));
        if (allComplete) {
          newlyUnlocked.push(piece);
        }
      }

      return newlyUnlocked;
    },
    [state.earnedPieces]
  );

  /** Get progress toward a specific piece (0–1) */
  const getPieceProgress = useCallback(
    (pieceId: string, streamId: string, completedLessons: string[]): number => {
      if (state.earnedPieces.includes(pieceId)) return 1;
      const piece = ARMOUR_PIECES.find((p) => p.id === pieceId);
      if (!piece) return 0;
      const stream = courseData.find((s) => s.id === streamId);
      if (!stream) return 0;
      const required = getRequiredLessonIds(piece, streamId, stream.modules);
      if (required.length === 0) return 0;
      const done = required.filter((id) => completedLessons.includes(id)).length;
      return done / required.length;
    },
    [state.earnedPieces]
  );

  const isPieceEarned = useCallback(
    (pieceId: string) => state.earnedPieces.includes(pieceId),
    [state.earnedPieces]
  );

  const allSafetyPiecesEarned = ARMOUR_PIECES.filter((p) => p.course === "online-safety").every(
    (p) => state.earnedPieces.includes(p.id)
  );

  const allPiecesEarned = ARMOUR_PIECES.every((p) => state.earnedPieces.includes(p.id));

  return {
    earnedPieces: state.earnedPieces,
    loading: state.loading,
    earnPiece,
    checkUnlocks,
    getPieceProgress,
    isPieceEarned,
    allSafetyPiecesEarned,
    allPiecesEarned,
  };
}
