import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { COOKIE_NAME, SESSION_MAX_AGE } from './auth-constants';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters');
  }
  return secret;
}

export function signSession(username: string): string {
  const payload = `${username}:${Date.now()}`;
  const secret = getSecret();
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifySession(token: string): { username: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [username, timestampStr, signature] = decoded.split(':');
    if (!username || !timestampStr || !signature) return null;
    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > SESSION_MAX_AGE * 1000) return null;
    const secret = getSecret();
    const expected = createHmac('sha256', secret).update(`${username}:${timestampStr}`).digest('hex');
    if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    return { username };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { getCookieName, getSessionMaxAge } from './auth-constants';
