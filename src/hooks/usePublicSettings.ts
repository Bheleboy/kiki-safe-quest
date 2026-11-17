import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parsePublicSettings, type PublicSiteSettings } from "@/lib/maintenance";

let cached: { at: number; value: PublicSiteSettings | null } | null = null;
let inflight: Promise<PublicSiteSettings | null> | null = null;

/** Fetches the public site settings once (shared by every caller). Errors resolve to null so callers fail open. */
export function fetchPublicSettings(maxAgeMs = 60_000): Promise<PublicSiteSettings | null> {
  if (cached && Date.now() - cached.at < maxAgeMs) return Promise.resolve(cached.value);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase.rpc("public_site_settings");
      const value = error ? null : parsePublicSettings(data);
      cached = { at: Date.now(), value };
      return value;
    } catch {
      cached = { at: Date.now(), value: null };
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Public settings for every visitor. `settings` is null while loading or when it could not be read. */
export function usePublicSettings(opts: { refreshMs?: number } = {}) {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(cached?.value ?? null);
  const [loaded, setLoaded] = useState(!!cached);
  const { refreshMs } = opts;
  useEffect(() => {
    let alive = true;
    const run = () => fetchPublicSettings(refreshMs ?? 60_000).then((v) => { if (alive) { setSettings(v); setLoaded(true); } });
    void run();
    const timer = refreshMs ? window.setInterval(run, refreshMs) : undefined;
    return () => { alive = false; if (timer) window.clearInterval(timer); };
  }, [refreshMs]);
  return { settings, loaded };
}
