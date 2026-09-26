import { beforeEach, describe, expect, it } from 'vitest'

import { logWater } from './repositories/logs'
import { countSessions, listSessions } from './repositories/sessions'
import { seedDatabase } from './seeding'
import { createTestDb } from './testing/helpers'
import type { Db } from './client'

describe('seedDatabase', () => {
  const now = new Date(2026, 1, 25, 10, 25, 41)
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('creates a month of realistic history', () => {
    const summary = seedDatabase(db, { now, days: 30, seed: 42 })

    expect(summary.sessions).toBeGreaterThan(20)
    expect(summary.waterLogs).toBeGreaterThan(20)
    expect(summary.moodLogs).toBeGreaterThan(20)
    expect(summary.weightLogs).toBeGreaterThan(5)
    expect(countSessions(db)).toBe(summary.sessions)
  })

  it('leaves an active fast matching the design timer', () => {
    seedDatabase(db, { now, days: 30, seed: 42 })

    const active = listSessions(db).find(
      (session) => session.status === 'active',
    )

    expect(active).toBeDefined()
    expect(now.getTime() - new Date(active!.startedAt).getTime()).toBe(
      (14 * 3600 + 25 * 60 + 41) * 1000,
    )
  })

  it('generates history older than today, with some journal details', () => {
    seedDatabase(db, { now, days: 30, seed: 42 })

    const finished = listSessions(db).filter(
      (session) => session.status !== 'active',
    )
    const withNotes = finished.filter((session) => session.breakFood)

    expect(finished.length).toBeGreaterThan(20)
    expect(withNotes.length).toBeGreaterThan(0)
    expect(finished.every((session) => session.endedAt !== null)).toBe(true)
  })

  it('is deterministic for a given faker seed', () => {
    const first = seedDatabase(db, { now, days: 30, seed: 7 })
    const other = createTestDb()
    const second = seedDatabase(other, { now, days: 30, seed: 7 })

    expect(second.sessions).toBe(first.sessions)
    expect(second.waterLogs).toBe(first.waterLogs)
    expect(listSessions(other)[0].startedAt).toBe(listSessions(db)[0].startedAt)
  })

  it('unlocks the achievements earned by the generated history', () => {
    const summary = seedDatabase(db, { now, days: 30, seed: 42 })

    expect(summary.achievementsUnlocked).toBeGreaterThan(0)
  })

  it('wipes previous data when resetting', () => {
    logWater(db, { amountMl: 250, loggedAt: now })
    seedDatabase(db, { now, days: 20, seed: 42, reset: true })
    const afterFirstSeed = countSessions(db)

    seedDatabase(db, { now, days: 20, seed: 42, reset: true })

    expect(countSessions(db)).toBe(afterFirstSeed)
  })
})
