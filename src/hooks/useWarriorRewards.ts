import { useCallback, useEffect, useState } from "react";
import { callFn, useAuth } from "@/hooks/useAuth";

export interface WarriorRewards { total: number; possible: number; kitStatus: string | null }

/**
 * Asks the server to award any missing Warrior Points for a child and returns the totals.
 * Never throws and never blocks a lesson: on any problem the rewards simply stay hidden.
 */
export function useWarriorRewards(childId: string | null | undefined, enabled: boolean) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [rewards, setRewards] = useState<WarriorRewards | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !childId || !token) return;
    try {
      const r = await callFn("award-points", { child_id: childId }, token);
      if (r.ok && r.data?.enabled === true && typeof r.data.total === "number" && typeof r.data.possible === "number") {
        setRewards({ total: r.data.total, possible: r.data.possible, kitStatus: typeof r.data.kit_status === "string" ? r.data.kit_status : null });
      }
    } catch {
      /* rewards are optional */
    }
  }, [enabled, childId, token]);

  useEffect(() => {
    setRewards(null);
  }, [childId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rewards, refresh };
}
