import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PARENT_ROUTES = ["/parent", "/family"];
const CHILD_ROUTES = ["/course", "/dashboard"];
const PARENT_TIMEOUT = 30 * 60_000;
const CHILD_TIMEOUT = 2 * 60 * 60_000;
const WARNING_MS = 60_000;

let videosPlaying = 0;
/** Called by video players so lessons never time out mid-video. */
export function markVideoPlaying(playing: boolean) {
  videosPlaying = Math.max(0, videosPlaying + (playing ? 1 : -1));
  window.dispatchEvent(new Event("kw-activity"));
}
export function markActivity() {
  window.dispatchEvent(new Event("kw-activity"));
}

export function InactivityGuard() {
  const { user, signOutWithMessage } = useAuth();
  const { pathname } = useLocation();
  const isParent = PARENT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const isChild = CHILD_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const timeout = isParent ? PARENT_TIMEOUT : isChild ? CHILD_TIMEOUT : 0;
  const lastActive = useRef(Date.now());
  const [warnLeft, setWarnLeft] = useState<number | null>(null);  const signOutRef = useRef(signOutWithMessage);
  signOutRef.current = signOutWithMessage;

  useEffect(() => {
    if (!user || !timeout) { setWarnLeft(null); return; }
    lastActive.current = Date.now();
    const bump = () => { if (warnLeftRef.current === null) lastActive.current = Date.now(); };
    const events = ["pointerdown", "pointermove", "keydown", "touchstart", "scroll", "wheel", "kw-activity"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true, capture: true }));
    const iv = window.setInterval(() => {
      if (videosPlaying > 0) { lastActive.current = Date.now(); setWarnLeft(null); return; }
      const idle = Date.now() - lastActive.current;
      if (idle >= timeout) {
        setWarnLeft(null);
        const minutes = timeout / 60_000;
        const label = minutes >= 120 ? "2 hours" : `${minutes} minutes`;
        signOutRef.current(`You were signed out after ${label} of inactivity.`, "inactivity");
      } else if (idle >= timeout - WARNING_MS) {
        setWarnLeft(Math.ceil((timeout - idle) / 1000));
      } else {
        setWarnLeft(null);
      }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump, { capture: true } as EventListenerOptions));
      window.clearInterval(iv);
    };
  }, [user, timeout]);

  return (
    <AlertDialog open={warnLeft !== null}>
      <AlertDialogContent className="rounded-2xl border border-primary/15 bg-card max-w-[calc(100vw-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display uppercase text-xl text-charcoal">Still there?</AlertDialogTitle>
          <AlertDialogDescription className="font-body text-charcoal/70 leading-relaxed">
            For your security we will sign you out in {warnLeft ?? 0} seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            onClick={() => { lastActive.current = Date.now(); setWarnLeft(null); }}
            className="rounded-full bg-primary text-charcoal font-display uppercase tracking-wider min-h-12 px-6 adventure-button"
          >
            I'm still here
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
