import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Db } from './client'
import {
  DEMO_DATA_FLAG,
  createTenant,
  demoDataEnabled,
  seedTenantDemoData,
} from './bootstrap'
import { countSessions } from './repositories/sessions'
import { createTestDb } from './testing/helpers'

describe('createTenant', () => {
  const now = new Date(2026, 1, 25, 10, 25, 41)
  let db: Db

  beforeEach(() => {
    db = createTestDb()
    delete process.env[DEMO_DATA_FLAG]
  })

  afterEach(() => {
    delete process.env[DEMO_DATA_FLAG]
  })

  it('creates an isolated tenant on the 16:8 protocol', () => {
    const profile = createTenant(db, { name: 'Ana' })

    expect(profile.name).toBe('Ana')
    expect(profile.isGuest).toBe(false)
    expect(profile.activeProtocolId).not.toBeNull()
    expect(countSessions(db, profile.id)).toBe(0)
  })

  it('gives guests a demo history when the flag is on', () => {
    process.env[DEMO_DATA_FLAG] = '1'

    const guest = createTenant(db, { name: 'Visitante', isGuest: true })

    expect(guest.isGuest).toBe(true)
    expect(countSessions(db, guest.id)).toBeGreaterThan(20)
  })

  it('keeps real accounts clean even with the demo flag on', () => {
    process.env[DEMO_DATA_FLAG] = '1'

    const account = createTenant(db, {
      name: 'Conta',
      email: 'conta@zenfast.dev',
      passwordHash: 'scrypt$sal$hash',
    })

    expect(countSessions(db, account.id)).toBe(0)
  })

  it('does not seed demo data twice for the same guest', () => {
    process.env[DEMO_DATA_FLAG] = '1'
    const guest = createTenant(db, { name: 'Visitante', isGuest: true })
    const seeded = countSessions(db, guest.id)

    expect(seedTenantDemoData(db, guest.id, now)).toBe(false)
    expect(countSessions(db, guest.id)).toBe(seeded)
  })

  it('never mixes the demo history of two guests', () => {
    process.env[DEMO_DATA_FLAG] = '1'

    const first = createTenant(db, { name: 'Guest 1', isGuest: true })
    const second = createTenant(db, { name: 'Guest 2', isGuest: true })

    expect(countSessions(db, first.id)).toBeGreaterThan(20)
    expect(countSessions(db, second.id)).toBeGreaterThan(20)

    const sessionsOf = (profileId: number) =>
      db
        .prepare<[number], { total: number }>(
          'select count(*) as total from fasting_sessions where profile_id = ?',
        )
        .get(profileId)?.total

    expect(sessionsOf(first.id)).toBe(countSessions(db, first.id))
    expect(sessionsOf(second.id)).toBe(countSessions(db, second.id))
    expect(
      db
        .prepare<[number], { total: number }>(
          'select count(*) as total from fasting_sessions where profile_id = ?',
        )
        .get(first.id + second.id)?.total,
    ).toBe(0)
  })
})

describe('demoDataEnabled', () => {
  afterEach(() => {
    delete process.env[DEMO_DATA_FLAG]
  })

  it('is off unless the flag is exactly 1', () => {
    expect(demoDataEnabled()).toBe(false)

    process.env[DEMO_DATA_FLAG] = 'true'
    expect(demoDataEnabled()).toBe(false)

    process.env[DEMO_DATA_FLAG] = '1'
    expect(demoDataEnabled()).toBe(true)
  })
})
