const KEY = "kw_device";
let memory: string | null = null;

function generate(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Random per-device secret. Only ever sent to our own security functions. */
export function getDeviceSecret(): string {
  if (memory) return memory;
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && existing.length >= 32) return (memory = existing);
    const fresh = generate();
    localStorage.setItem(KEY, fresh);
    return (memory = fresh);
  } catch {
    return (memory ??= generate());
  }
}

const CH_KEY = "kw_challenge";
export type PendingChallenge = { challenge_id: string; masked_email: string; oauth?: boolean };

export function saveChallenge(c: PendingChallenge | null) {
  try {
    if (c) sessionStorage.setItem(CH_KEY, JSON.stringify(c));
    else sessionStorage.removeItem(CH_KEY);
  } catch { /* ignore */ }
}
export function loadChallenge(): PendingChallenge | null {
  try {
    const raw = sessionStorage.getItem(CH_KEY);
    return raw ? (JSON.parse(raw) as PendingChallenge) : null;
  } catch {
    return null;
  }
}
