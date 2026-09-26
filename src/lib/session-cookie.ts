export const SESSION_COOKIE = 'zenfast_session'
export const SESSION_TTL_DAYS = 90

export function sessionTtlMs(days: number = SESSION_TTL_DAYS): number {
  return days * 24 * 60 * 60 * 1000
}

export function parseSessionToken(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=')

    if (rawName === SESSION_COOKIE) {
      const value = decodeURIComponent(rawValue.join('=')).trim()

      return value.length > 0 ? value : null
    }
  }

  return null
}

export interface CookieOptions {
  maxAgeSeconds: number
  secure: boolean
}

export function serializeSessionCookie(
  token: string,
  { maxAgeSeconds, secure }: CookieOptions,
): string {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ]

  if (secure) {
    attributes.push('Secure')
  }

  return attributes.join('; ')
}

export function serializeClearedSessionCookie(): string {
  return serializeSessionCookie('', { maxAgeSeconds: 0, secure: true })
}
