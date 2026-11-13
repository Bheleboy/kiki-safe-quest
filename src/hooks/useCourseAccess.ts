import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { AgeStream } from "@/data/courseData";

/**
 * Warrior Pass course gate. FAILS OPEN: while loading, on any error, on
 * missing rows or malformed values, every lesson stays unlocked.
 */

export interface GateConfig {
  paywallEnabled: boolean;
  gateLessons: string[];
  alwaysFree: string[];
}

export interface AccessState {
  paywallActive: boolean;
  hasAccess: boolean;
  gateLessons: string[];
  alwaysFree: string[];
}

export const OPEN_ACCESS: AccessState = { paywallActive: false, hasAccess: true, gateLessons: [], alwaysFree: [] };

const SETTING_KEYS = ["paywall_enabled", "gate_lessons", "always_free_lessons"] as const;

const ACCESS_EVENT = "kw:course-access-changed";

/** Tells every mounted useCourseAccess to refetch (for example after a paid order). */
export function notifyCourseAccessChanged() {
  try { window.dispatchEvent(new Event(ACCESS_EVENT)); } catch { /* ignore */ }
}

/** Parses app_settings rows. Returns null when anything is missing or malformed. */
export function parseGateConfig(rows: { key: string; value: unknown }[] | null | undefined): GateConfig | null {
  if (!Array.isArray(rows)) return null;
  const map = new Map(rows.map((r) => [r.key, r.value]));
  if (!SETTING_KEYS.every((k) => map.has(k))) return null;
  const paywall = map.get("paywall_enabled");
  const gates = map.get("gate_lessons");
  const free = map.get("always_free_lessons");
  if (typeof paywall !== "boolean") return null;
  if (!gates || typeof gates !== "object" || Array.isArray(gates)) return null;
  const gateValues = Object.values(gates as Record<string, unknown>);
  if (!gateValues.every((v) => typeof v === "string")) return null;
  if (!Array.isArray(free) || !free.every((v) => typeof v === "string")) return null;
  return { paywallEnabled: paywall, gateLessons: gateValues as string[], alwaysFree: free as string[] };
}

export function isPreviewPaywall(isAdmin: boolean | null | undefined, search: string | URLSearchParams): boolean {
  if (isAdmin !== true) return false;
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  return params.get("previewPaywall") === "1";
}

/** Combines loaded settings, the access RPC result and admin preview into one state. */
export function resolveAccess(
  config: GateConfig | null,
  rpcResult: unknown,
  preview: boolean,
): AccessState {
  if (!config) return OPEN_ACCESS;
  const base = { gateLessons: config.gateLessons, alwaysFree: config.alwaysFree };
  if (preview) return { ...base, paywallActive: true, hasAccess: false };
  if (config.paywallEnabled !== true) return OPEN_ACCESS;
  // Anything other than an explicit false from the server means access.
  const hasAccess = rpcResult === false ? false : true;
  return { ...base, paywallActive: true, hasAccess };
}

export function computeLessonLocked(
  state: AccessState,
  stream: AgeStream,
  lessonId: string,
  isLessonComplete: boolean,
): boolean {
  if (!state.paywallActive || state.hasAccess) return false;
  if (isLessonComplete) return false;
  if (state.alwaysFree.includes(lessonId)) return false;
  const order = stream.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const gateId = state.gateLessons.find((id) => order.includes(id));
  if (!gateId) return false;
  const lessonPos = order.indexOf(lessonId);
  if (lessonPos === -1) return false;
  return lessonPos > order.indexOf(gateId);
}

export function useCourseAccess(userId: string | undefined, isAdmin: boolean | null | undefined) {
  const [searchParams] = useSearchParams();
  const preview = isPreviewPaywall(isAdmin, searchParams);
  const [config, setConfig] = useState<GateConfig | null>(null);
  const [rpcResult, setRpcResult] = useState<unknown>(undefined);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    window.addEventListener(ACCESS_EVENT, refresh);
    return () => window.removeEventListener(ACCESS_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [settings, access] = await Promise.all([
          supabase.from("app_settings").select("key, value").in("key", [...SETTING_KEYS]),
          supabase.rpc("has_course_access", { _user_id: userId }),
        ]);
        if (cancelled) return;
        setConfig(settings.error ? null : parseGateConfig(settings.data));
        setRpcResult(access.error ? undefined : access.data);
      } catch {
        if (!cancelled) { setConfig(null); setRpcResult(undefined); }
      }
    })();
    return () => { cancelled = true; };
  }, [userId, version]);

  const state = useMemo(() => resolveAccess(config, rpcResult, preview), [config, rpcResult, preview]);

  const isLessonLocked = useCallback(
    (stream: AgeStream, lessonId: string, isLessonComplete: boolean) =>
      computeLessonLocked(state, stream, lessonId, isLessonComplete),
    [state],
  );

  return { paywallActive: state.paywallActive, hasAccess: state.hasAccess, isLessonLocked, isPreview: preview, refresh };
}
