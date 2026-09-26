import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from './client'
import { logWater } from './repositories/logs'
import { countSessions, listSessions } from './repositories/sessions'
import { seedDatabase } from './seeding'
import { createTestDb, createTestTenant } from './testing/helpers'

describe('seedDatabase', () => {
  const now = new Date(2026, 1, 25, 10, 25, 41)
  let db: Db
  let profileId: number

  beforeEach(() => {
    db = createTestDb()
    profileId = createTestTenant(db).id
  })

  it('creates a month of realistic history for the tenant', () => {
    const summary = seedDatabase(db, { profileId, now, days: 30, seed: 42 })

    expect(summary.sessions).toBeGreaterThan(20)
    expect(summary.waterLogs).toBeGreaterThan(20)
    expect(summary.moodLogs).toBeGreaterThan(20)
    expect(summary.weightLogs).toBeGreaterThan(5)
    expect(countSessions(db, profileId)).toBe(summary.sessions)
  })

  it('leaves an active fast matching the design timer', () => {
    seedDatabase(db, { profileId, now, days: 30, seed: 42 })

    const active = listSessions(db, { profileId }).find(
      (session) => session.status === 'active',
    )

    expect(active).toBeDefined()
    expect(now.getTime() - new Date(active!.startedAt).getTime()).toBe(
      (14 * 3600 + 25 * 60 + 41) * 1000,
    )
  })

  it('generates history older than today, with journal details', () => {
    seedDatabase(db, { profileId, now, days: 30, seed: 42 })

    const finished = listSessions(db, { profileId }).filter(
      (session) => session.status !== 'active',
    )
    const withNotes = finished.filter((session) => session.breakFood)

    expect(finished.length).toBeGreaterThan(20)
    expect(withNotes.length).toBeGreaterThan(0)
    expect(finished.every((session) => session.endedAt !== null)).toBe(true)
  })

  it('is deterministic for a given seed', () => {
    const first = seedDatabase(db, { profileId, now, days: 30, seed: 7 })
    const other = createTestDb()
    const otherTenant = createTestTenant(other)
    const second = seedDatabase(other, {
      profileId: otherTenant.id,
      now,
      days: 30,
      seed: 7,
    })

    expect(second.sessions).toBe(first.sessions)
    expect(second.waterLogs).toBe(first.waterLogs)
    expect(
      listSessions(other, { profileId: otherTenant.id })[0].startedAt,
    ).toBe(listSessions(db, { profileId })[0].startedAt)
  })

  it('never touches another tenant history', () => {
    const other = createTestTenant(db, { name: 'Outro tenant' })

    seedDatabase(db, { profileId, now, days: 30, seed: 42 })

    expect(countSessions(db, profileId)).toBeGreaterThan(20)
    expect(countSessions(db, other.id)).toBe(0)
  })

  it('unlocks the achievements earned by the generated history', () => {
    const summary = seedDatabase(db, { profileId, now, days: 30, seed: 42 })

    expect(summary.achievementsUnlocked).toBeGreaterThan(0)
  })

  it('wipes previous data when resetting', () => {
    logWater(db, { amountMl: 250, loggedAt: now, profileId })
    seedDatabase(db, { profileId, now, days: 20, seed: 42, reset: true })
    const afterFirstSeed = countSessions(db, profileId)

    seedDatabase(db, { profileId, now, days: 20, seed: 42, reset: true })

    expect(countSessions(db, profileId)).toBe(afterFirstSeed)
  })
})
