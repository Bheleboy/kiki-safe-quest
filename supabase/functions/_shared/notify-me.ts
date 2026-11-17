// Validation for the "we are upgrading" email sign-up. Pure, shared with the app's tests.
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/

export type NotifyMeResult = { ok: true; email: string } | { ok: false; error: 'invalid_email' | 'consent_required' }

/** Accepts { email, consent: true }. Lower-cases and trims the email. */
export function parseNotifyMe(body: unknown): NotifyMeResult {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' }
  if (b.consent !== true) return { ok: false, error: 'consent_required' }
  return { ok: true, email }
}
