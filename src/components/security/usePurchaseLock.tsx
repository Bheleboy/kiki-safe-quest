import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useParentPin } from "@/components/security/ParentGate";

/** Purchase screens close and re-lock after this long without interaction. */
export const PURCHASE_IDLE_MS = 2 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "input", "scroll", "touchstart"] as const;

/**
 * Locks a parent purchase panel (prices, kit choices, delivery, book, codes) behind a
 * fresh parent PIN, every time, admins included. The verified PIN lives only in
 * component memory so it can be sent to the server once (checkout, codes, delivery)
 * without asking again. Re-locks after 2 minutes idle, when the tab is hidden,
 * on navigation and on unmount.
 */
export function usePurchaseLock() {
  const { guard, dialog } = useParentPin();
  const [pin, setPin] = useState<string | null>(null);
  const { pathname } = useLocation();

  const relock = useCallback(() => setPin(null), []);

  /** Ask for the PIN (always, admins too). Runs `then` with the new PIN once verified. */
  const unlock = useCallback((message?: string, then?: (pin: string) => void) => {
    guard((p) => { if (p) { setPin(p); then?.(p); } }, { requirePin: true, message: message ?? "Enter your parent PIN to continue." });
  }, [guard]);

  // Navigating away re-locks.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) { lastPath.current = pathname; setPin(null); }
  }, [pathname]);

  // Idle timeout and hidden tab re-lock.
  useEffect(() => {
    if (!pin) return;
    let timer = window.setTimeout(relock, PURCHASE_IDLE_MS);
    const bump = () => { window.clearTimeout(timer); timer = window.setTimeout(relock, PURCHASE_IDLE_MS); };
    const onVisibility = () => { if (document.visibilityState === "hidden") relock(); };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump, { capture: true }));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pin, relock]);

  return { pin, unlocked: pin !== null, unlock, relock, dialog };
}
