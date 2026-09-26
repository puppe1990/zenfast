import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '../client'
import { createTestDb, createTestTenant } from '../testing/helpers'
import {
  authenticate,
  createAccount,
  endSession,
  isEmailTaken,
  listSessions,
  purgeExpiredSessions,
  resolveSession,
  startSession,
} from './accounts'

describe('accounts', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('creates an account with a hashed password', () => {
    const profile = createAccount(db, {
      name: 'Matheus',
      email: 'matheus@zenfast.dev',
      password: 'jejum-16-8',
    })

    expect(profile.email).toBe('matheus@zenfast.dev')
    expect(profile.isGuest).toBe(false)

    const stored = db
      .prepare<[string], { password_hash: string | null }>(
        'select password_hash from profiles where email = ?',
      )
      .get('matheus@zenfast.dev')

    expect(stored?.password_hash).toContain('scrypt$')
    expect(stored?.password_hash).not.toContain('jejum-16-8')
  })

  it('authenticates with the right credentials only', () => {
    createAccount(db, {
      name: 'Edna',
      email: 'edna@zenfast.dev',
      password: 'cetose-2026',
    })

    expect(authenticate(db, 'edna@zenfast.dev', 'cetose-2026')?.name).toBe(
      'Edna',
    )
    expect(authenticate(db, 'edna@zenfast.dev', 'outra-senha')).toBeNull()
    expect(authenticate(db, 'ninguem@zenfast.dev', 'cetose-2026')).toBeNull()
  })

  it('flags taken emails, ignoring case', () => {
    createAccount(db, {
      name: 'Ana',
      email: 'ana@zenfast.dev',
      password: 'senha-forte',
    })

    expect(isEmailTaken(db, 'ana@zenfast.dev')).toBe(true)
    expect(isEmailTaken(db, 'ANA@zenfast.dev')).toBe(true)
    expect(isEmailTaken(db, 'livre@zenfast.dev')).toBe(false)
  })

  it('never authenticates an email-less guest tenant', () => {
    const guest = createTestTenant(db, { name: 'Visitante', isGuest: true })

    expect(guest.isGuest).toBe(true)
    expect(guest.email).toBeNull()
    expect(authenticate(db, '', '')).toBeNull()
  })
})

describe('sessions', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('resolves a valid session to its tenant', () => {
    const first = createTestTenant(db, { name: 'Um' })
    const second = createTestTenant(db, { name: 'Dois' })

    const token = startSession(db, first.id)

    expect(resolveSession(db, token)?.id).toBe(first.id)
    expect(resolveSession(db, token)?.id).not.toBe(second.id)
  })

  it('ignores unknown or missing tokens', () => {
    expect(resolveSession(db, 'token-inventado')).toBeNull()
    expect(resolveSession(db, null)).toBeNull()
  })

  it('drops expired sessions', () => {
    const profile = createTestTenant(db)
    const now = new Date(2026, 1, 25, 12, 0)
    const token = startSession(db, profile.id, now, 60_000)

    expect(
      resolveSession(db, token, new Date(2026, 1, 25, 12, 0, 30))?.id,
    ).toBe(profile.id)
    expect(
      resolveSession(db, token, new Date(2026, 1, 25, 12, 1, 1)),
    ).toBeNull()
    expect(listSessions(db, profile.id)).toHaveLength(0)
  })

  it('ends a session on sign out', () => {
    const profile = createTestTenant(db)
    const token = startSession(db, profile.id)

    endSession(db, token)

    expect(resolveSession(db, token)).toBeNull()
  })

  it('purges every expired session at once', () => {
    const profile = createTestTenant(db)
    const now = new Date(2026, 1, 25, 12, 0)
    startSession(db, profile.id, new Date(2026, 1, 1), 1000)
    startSession(db, profile.id, now, 60_000)

    expect(purgeExpiredSessions(db, now)).toBe(1)
    expect(listSessions(db, profile.id)).toHaveLength(1)
  })

  it('keeps sessions per tenant', () => {
    const first = createTestTenant(db, { name: 'Um' })
    const second = createTestTenant(db, { name: 'Dois' })

    startSession(db, first.id)
    startSession(db, second.id)
    startSession(db, second.id)

    expect(listSessions(db, first.id)).toHaveLength(1)
    expect(listSessions(db, second.id)).toHaveLength(2)
  })
})
