/**
 * Domain guard – restricts authentication flows to the production custom domain.
 * In development mode (localhost) auth is allowed for testing.
 */

const PRODUCTION_DOMAIN = "kikiwarrior.com";

/** Returns true when the current origin is the production custom domain or localhost dev */
export function isAllowedAuthDomain(): boolean {
  const host = window.location.hostname;

  // Allow localhost for local development
  if (host === "localhost" || host === "127.0.0.1") return true;

  // Allow the production custom domain (with or without www)
  if (host === PRODUCTION_DOMAIN || host === `www.${PRODUCTION_DOMAIN}`) return true;

  return false;
}

/** Returns the canonical production origin for redirect URLs */
export function getProductionOrigin(): string {
  // In local dev, use current origin so redirects work
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return window.location.origin;
  }
  return `https://${PRODUCTION_DOMAIN}`;
}
