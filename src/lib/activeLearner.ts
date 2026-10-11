const KEY = "kw_active_learner";

type ActiveLearner = { uid: string; childId: string };

/** The child currently learning on this device for the given parent account, if any. */
export function readActiveLearner(uid: string | undefined): string | null {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as ActiveLearner;
    return v.uid === uid && typeof v.childId === "string" ? v.childId : null;
  } catch {
    return null;
  }
}

export function writeActiveLearner(uid: string, childId: string) {
  try { localStorage.setItem(KEY, JSON.stringify({ uid, childId })); } catch { /* ignore */ }
}

/** Clears the lock; when childId is given, only if it points at that child. */
export function clearActiveLearner(childId?: string) {
  try {
    if (childId) {
      const raw = localStorage.getItem(KEY);
      if (!raw || (JSON.parse(raw) as ActiveLearner).childId !== childId) return;
    }
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

/** Switching is free when no learner is stored, it is the same child, or the parent is unlocked. */
export function canSwitchFreely(stored: string | null, target: string, parentUnlocked: boolean) {
  return !stored || stored === target || parentUnlocked;
}
