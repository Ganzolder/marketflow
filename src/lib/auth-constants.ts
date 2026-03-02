/**
 * Shared auth constants — no Node.js APIs.
 * Safe to import from Edge (middleware).
 */
export const COOKIE_NAME = 'marketflow_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE;
}
