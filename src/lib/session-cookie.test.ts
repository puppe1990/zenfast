import { describe, expect, it } from 'vitest'

import {
  SESSION_COOKIE,
  parseSessionToken,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  sessionTtlMs,
} from './session-cookie'

describe('parseSessionToken', () => {
  it('finds the session among other cookies', () => {
    const header = `outra=123; ${SESSION_COOKIE}=abc.def; tema=dark`

    expect(parseSessionToken(header)).toBe('abc.def')
  })

  it('returns null without the cookie', () => {
    expect(parseSessionToken('outra=123')).toBeNull()
    expect(parseSessionToken('')).toBeNull()
    expect(parseSessionToken(null)).toBeNull()
    expect(parseSessionToken(`${SESSION_COOKIE}=`)).toBeNull()
  })

  it('decodes url encoded values', () => {
    expect(parseSessionToken(`${SESSION_COOKIE}=a%2Fb`)).toBe('a/b')
  })
})

describe('serializeSessionCookie', () => {
  it('hardens the cookie', () => {
    const cookie = serializeSessionCookie('token-123', {
      maxAgeSeconds: 3600,
      secure: true,
    })

    expect(cookie).toContain(`${SESSION_COOKIE}=token-123`)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('Max-Age=3600')
    expect(cookie).toContain('Secure')
  })

  it('omits Secure on plain http dev servers', () => {
    const cookie = serializeSessionCookie('token-123', {
      maxAgeSeconds: 3600,
      secure: false,
    })

    expect(cookie).not.toContain('Secure')
  })

  it('expires the session when clearing', () => {
    expect(serializeClearedSessionCookie()).toContain('Max-Age=0')
  })
})

describe('sessionTtlMs', () => {
  it('defaults to ninety days', () => {
    expect(sessionTtlMs()).toBe(90 * 24 * 60 * 60 * 1000)
  })
})
