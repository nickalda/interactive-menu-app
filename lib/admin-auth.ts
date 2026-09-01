import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD
  if (!secret) {
    throw new Error('Missing ADMIN_PASSWORD or ADMIN_SESSION_SECRET environment variable.')
  }
  return secret
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('hex')
}

/** Creates a signed, expiring session token to store in an httpOnly cookie. */
export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = String(expiresAt)
  const signature = sign(payload)
  return { token: `${payload}.${signature}`, maxAgeSeconds: SESSION_TTL_MS / 1000 }
}

/** Verifies a session token's signature and expiry. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expected = sign(payload)
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signature)

  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return false
  }

  const expiresAt = Number(payload)
  return Number.isFinite(expiresAt) && Date.now() < expiresAt
}

/** Thrown by requireAdmin() when the request is not authenticated. */
export class AdminAuthError extends Error {
  status = 401
}

/** Reads the admin session cookie via next/headers and throws if invalid/expired. */
export async function requireAdmin() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!verifySessionToken(token)) {
    throw new AdminAuthError('Not authenticated')
  }
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    throw new Error('Missing ADMIN_PASSWORD environment variable.')
  }

  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(password)

  return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)
}
