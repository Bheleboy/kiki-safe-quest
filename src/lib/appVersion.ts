/** Detects when a newer build is live and reloads at a safe moment. */

const ENTRY_RE = /\/assets\/index-[^"'\s>]+\.js/;
const RELOADED_KEY = "kw_reloaded_for_version";

export function extractEntry(html: string): string | null {
  const m = html.match(ENTRY_RE);
  return m ? m[0] : null;
}

export function currentEntry(): string | null {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'));
  for (const s of scripts) {
    const e = extractEntry(s.getAttribute("src") ?? "");
    if (e) return e;
  }
  return null;
}

/** True when we should reload for `latest` given the running entry and the last version reloaded for. */
export function shouldReload(running: string | null, latest: string | null, alreadyReloadedFor: string | null): boolean {
  if (!running || !latest) return false;
  if (latest === running) return false;
  return latest !== alreadyReloadedFor;
}

export async function fetchLatestEntry(): Promise<string | null> {
  try {
    const res = await fetch("/", { cache: "no-store", headers: { Accept: "text/html" } });
    if (!res.ok) return null;
    return extractEntry(await res.text());
  } catch {
    return null;
  }
}

export function readReloadedFor(): string | null {
  try { return sessionStorage.getItem(RELOADED_KEY); } catch { return null; }
}

export function markReloadedFor(v: string) {
  try { sessionStorage.setItem(RELOADED_KEY, v); } catch { /* ignore */ }
}

// Screens (like an open lesson or quiz) can block the reload until they close.
let blocked = false;
const listeners = new Set<() => void>();
export function setUpdateBlocked(b: boolean) {
  const was = blocked;
  blocked = b;
  if (was && !b) listeners.forEach((l) => l());
}
export function isUpdateBlocked() { return blocked; }
export function onUnblocked(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
