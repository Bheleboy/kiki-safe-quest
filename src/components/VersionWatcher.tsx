import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  currentEntry, fetchLatestEntry, isUpdateBlocked, markReloadedFor, onUnblocked, readReloadedFor, shouldReload,
} from "@/lib/appVersion";

const INTERVAL_MS = 10 * 60_000;

/** Mounted once: reloads into a newer build at a safe moment. */
export default function VersionWatcher() {
  const location = useLocation();
  const running = useRef<string | null>(null);
  const pending = useRef<string | null>(null);
  const firstRoute = useRef(true);

  const reloadNow = () => {
    const v = pending.current;
    if (!v || isUpdateBlocked()) return;
    if (!shouldReload(running.current, v, readReloadedFor())) return;
    markReloadedFor(v);
    window.location.reload();
  };

  const check = async (reloadIfFound: boolean) => {
    if (!running.current) return;
    const latest = await fetchLatestEntry();
    if (shouldReload(running.current, latest, readReloadedFor())) {
      pending.current = latest;
      if (reloadIfFound) reloadNow();
    }
  };

  useEffect(() => {
    running.current = currentEntry();
    if (!running.current) return; // dev server or unknown build: nothing to compare
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (pending.current) reloadNow();
      else void check(true);
    };
    const onFocus = () => onVisible();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    const t = window.setInterval(() => void check(false), INTERVAL_MS);
    const off = onUnblocked(() => reloadNow());
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(t);
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstRoute.current) { firstRoute.current = false; return; }
    if (pending.current) reloadNow();
    else void check(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}
