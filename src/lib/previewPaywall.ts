import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Admin Warrior Pass preview. An admin turns it on with ?previewPaywall=1 on any page; it is then
 * remembered for the browser tab (sessionStorage) until "Exit preview" or ?previewPaywall=0.
 * Non-admins: never read, never written, no effect.
 */
export const PREVIEW_PAYWALL_KEY = "kw_preview_paywall";
const PREVIEW_EVENT = "kw:preview-paywall-changed";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function sessionStore(): StorageLike | null {
  try { return typeof window !== "undefined" ? window.sessionStorage : null; } catch { return null; }
}

function urlFlag(search: string | URLSearchParams): "on" | "off" | null {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const v = params.get("previewPaywall");
  return v === "1" ? "on" : v === "0" ? "off" : null;
}

/** URL only: true when an admin opens a page with ?previewPaywall=1. */
export function isPreviewPaywall(isAdmin: boolean | null | undefined, search: string | URLSearchParams): boolean {
  if (isAdmin !== true) return false;
  return urlFlag(search) === "on";
}

/**
 * Resolves preview for the current page and remembers an explicit URL choice.
 * The stored flag is only ever read for admins.
 */
export function resolvePreviewPaywall(
  isAdmin: boolean | null | undefined,
  search: string | URLSearchParams,
  storage: StorageLike | null = sessionStore(),
): boolean {
  if (isAdmin !== true) return false;
  const flag = urlFlag(search);
  try {
    if (flag === "on") { storage?.setItem(PREVIEW_PAYWALL_KEY, "1"); return true; }
    if (flag === "off") { storage?.removeItem(PREVIEW_PAYWALL_KEY); return false; }
    return storage?.getItem(PREVIEW_PAYWALL_KEY) === "1";
  } catch {
    return flag === "on";
  }
}

/** Switches preview off for this tab and tells every mounted hook. */
export function clearPreviewPaywall(storage: StorageLike | null = sessionStore()) {
  try { storage?.removeItem(PREVIEW_PAYWALL_KEY); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(PREVIEW_EVENT)); } catch { /* ignore */ }
}

/** Shared hook: is an admin previewing, plus a function that exits preview. */
export function usePreviewPaywall(isAdmin: boolean | null | undefined) {
  const location = useLocation();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(PREVIEW_EVENT, bump);
    return () => window.removeEventListener(PREVIEW_EVENT, bump);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => resolvePreviewPaywall(isAdmin, location.search), [isAdmin, location.search, version]);

  const exitPreview = useCallback(() => {
    clearPreviewPaywall();
    const params = new URLSearchParams(location.search);
    if (params.has("previewPaywall")) {
      params.delete("previewPaywall");
      const search = params.toString();
      navigate({ pathname: location.pathname, search: search ? `?${search}` : "", hash: location.hash }, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return { preview, exitPreview };
}
