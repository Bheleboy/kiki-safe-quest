/** "We are upgrading" page rules. Pure so the fail-open behaviour is tested. */

/** Paths that stay reachable while the upgrade page is on: sign-in, password reset, security links and admin. */
export const MAINTENANCE_OPEN_PATHS = ["/auth", "/reset-password", "/security/revoke", "/admin", "/unsubscribe"];

export type MaintenanceView = "site" | "upgrade" | "wait";

export function maintenanceView(input: {
  /** null while loading or when the settings could not be read. */
  maintenance: boolean | null;
  path: string;
  authLoading: boolean;
  isKikiAdmin: boolean;
  /** null while the admin dashboard session is still being checked. */
  isDashboardAdmin: boolean | null;
}): MaintenanceView {
  // Fail open: unknown or off means the normal site.
  if (input.maintenance !== true) return "site";
  if (MAINTENANCE_OPEN_PATHS.some((p) => input.path === p || input.path.startsWith(`${p}/`))) return "site";
  if (input.isKikiAdmin || input.isDashboardAdmin === true) return "site";
  if (input.authLoading || input.isDashboardAdmin === null) return "wait";
  return "upgrade";
}

export interface PublicSiteSettings {
  maintenance_mode: boolean;
  prices: {
    family_pass_cents?: number | null; launch_family_pass_cents?: number | null; launch_limit?: number | null;
    kit_cents?: number | null; book_cents?: number | null; delivery_locker_cents?: number | null; delivery_door_cents?: number | null;
  } | null;
  receipt_business_name: string | null;
  support_email: string | null;
}

/** Reads the public settings result defensively. Anything malformed becomes null (callers fail open). */
export function parsePublicSettings(data: unknown): PublicSiteSettings | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
  const p = d.prices && typeof d.prices === "object" ? (d.prices as Record<string, unknown>) : null;
  return {
    maintenance_mode: d.maintenance_mode === true,
    prices: p ? {
      family_pass_cents: num(p.family_pass_cents), launch_family_pass_cents: num(p.launch_family_pass_cents),
      launch_limit: num(p.launch_limit), kit_cents: num(p.kit_cents), book_cents: num(p.book_cents),
      delivery_locker_cents: num(p.delivery_locker_cents), delivery_door_cents: num(p.delivery_door_cents),
    } : null,
    receipt_business_name: typeof d.receipt_business_name === "string" && d.receipt_business_name.trim() ? d.receipt_business_name.trim() : null,
    support_email: typeof d.support_email === "string" && d.support_email.includes("@") ? d.support_email : null,
  };
}

export const DEFAULT_SUPPORT_EMAIL = "support@kikiwarrior.com";
