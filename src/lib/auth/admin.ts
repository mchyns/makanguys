import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'makanguys_admin_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'makanguys_fallback_admin_secret_minimum_32_characters';
}

/**
 * Creates a signed token: `${timestamp}.${hmac}`
 */
export function createSessionToken(): string {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}.${hmac}`;
}

/**
 * Verifies the signed session token and checks expiry
 */
export function verifySessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, providedHmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check if expired
  if (Date.now() - timestamp > SESSION_EXPIRY_MS) {
    return false;
  }

  const secret = getSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(timestampStr).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Validates admin credentials against ADMIN_PASSWORD
 */
export function validateAdminPassword(password: string): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD || 'makanguysadmin2026';
  if (!password || !configuredPassword) return false;

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(configuredPassword);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return password === configuredPassword;
  }
}

/**
 * Checks if current request has a valid admin session cookie
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
