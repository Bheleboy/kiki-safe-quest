/**
 * Remembers where a visitor wanted to go before signing up, across the email
 * confirmation link (which opens a new tab, so sessionStorage would be lost).
 * Holds only an in-site path, never anything personal, and expires after a day.
 */
const KEY = "kw_auth_return";
const TTL_MS = 24 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const store = (): StorageLike | null => { try { return window.localStorage; } catch { return null; } };

/** Only same-site paths are ever used, so a stored value can never send someone off the site. */
export function safeReturnPath(v: unknown): string | undefined {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : undefined;
}

export function saveAuthReturn(path: string, s: StorageLike | null = store(), now = Date.now()) {
  const p = safeReturnPath(path);
  if (!p) return;
  try { s?.setItem(KEY, JSON.stringify({ path: p, until: now + TTL_MS })); } catch { /* ignore */ }
}

export function readAuthReturn(s: StorageLike | null = store(), now = Date.now()): string | undefined {
  try {
    const raw = s?.getItem(KEY);
    if (!raw) return undefined;
    const v = JSON.parse(raw) as { path?: unknown; until?: unknown };
    if (typeof v.until !== "number" || v.until <= now) { s?.removeItem(KEY); return undefined; }
    return safeReturnPath(v.path);
  } catch {
    return undefined;
  }
}

export function clearAuthReturn(s: StorageLike | null = store()) {
  try { s?.removeItem(KEY); } catch { /* ignore */ }
}
