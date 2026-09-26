import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '#/db/client'
import { listUnlockedAchievements } from '#/db/repositories/achievements'
import { logWater } from '#/db/repositories/logs'
import { findProtocolBySlug } from '#/db/repositories/protocols'
import { endSession, startSession } from '#/db/repositories/sessions'
import { createTestDb, createTestTenant } from '#/db/testing/helpers'

import {
  achievementTimeline,
  computeAchievementStats,
  syncAchievements,
} from './achievements'

describe('computeAchievementStats', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('reads the counters from the tenant history', () => {
    const profile = createTestTenant(db)
    const protocol = findProtocolBySlug(db, '16-8-diario')!
    const now = new Date(2026, 1, 25, 14, 0)

    const session = startSession(db, {
      profileId: profile.id,
      protocolId: protocol.id,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })
    endSession(db, session.id, { endedAt: new Date(2026, 1, 25, 12, 0) })

    const stats = computeAchievementStats(db, profile.id, now)

    expect(stats.totalFasts).toBe(1)
    expect(stats.longestFastHours).toBe(16)
    expect(stats.goalEfficacyPercent).toBe(100)
    expect(stats.streak.current).toBe(1)
  })
})

describe('syncAchievements', () => {
  const now = new Date(2026, 1, 25, 14, 0)
  let db: Db
  let profileId: number
  let protocolId: number

  const fast = (hours: number) => {
    const session = startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    endSession(db, session.id, {
      endedAt: new Date(2026, 1, 24, 20, 0 + hours * 3600_000),
    })
  }

  beforeEach(() => {
    db = createTestDb()
    profileId = createTestTenant(db).id
    protocolId = findProtocolBySlug(db, '16-8-diario')!.id
  })

  it('persists the badges the tenant earned', () => {
    fast(19)

    const unlocked = syncAchievements(db, profileId, now)

    expect(unlocked).toContain('pioneiro-do-jejum')
    expect(unlocked).toContain('mestre-da-cetose')
    expect(
      listUnlockedAchievements(db, profileId).map((row) => row.slug),
    ).toEqual(expect.arrayContaining(['pioneiro-do-jejum', 'mestre-da-cetose']))
  })

  it('records the unlock date once and never rewrites it', () => {
    fast(16)

    syncAchievements(db, profileId, new Date(2026, 1, 20, 12, 0))
    syncAchievements(db, profileId, new Date(2026, 1, 25, 12, 0))

    const rows = listUnlockedAchievements(db, profileId)
    const pioneer = rows.find((row) => row.slug === 'pioneiro-do-jejum')

    expect(rows.filter((row) => row.slug === 'pioneiro-do-jejum')).toHaveLength(
      1,
    )
    expect(new Date(pioneer!.unlockedAt).getTime()).toBe(
      new Date(2026, 1, 20, 12, 0).getTime(),
    )
  })

  it('keeps the timeline aligned with the live evaluation', () => {
    fast(19)

    const before = achievementTimeline(db, profileId, now)
    syncAchievements(db, profileId, now)
    const after = achievementTimeline(db, profileId, now)

    expect(after.map((entry) => entry.unlocked)).toEqual(
      before.map((entry) => entry.unlocked),
    )
    expect(
      after.every((entry) => entry.unlocked || entry.unlockedAt === null),
    ).toBe(true)
    expect(
      after.find((entry) => entry.slug === 'pioneiro-do-jejum')?.unlockedAt,
    ).toBe(now.toISOString())
  })

  it('never unlocks badges for another tenant', () => {
    const other = createTestTenant(db, { name: 'Outro tenant' })
    fast(19)

    syncAchievements(db, profileId, now)

    expect(listUnlockedAchievements(db, other.id)).toHaveLength(0)
    expect(syncAchievements(db, other.id, now)).toEqual([])
  })

  it('still counts water goal days from the real logs', () => {
    for (let day = 20; day <= 24; day += 1) {
      logWater(db, {
        amountMl: 2600,
        loggedAt: new Date(2026, 1, day, 12, 0),
        profileId,
      })
    }

    const stats = computeAchievementStats(db, profileId, now)

    expect(stats.waterGoalDays).toBe(5)
    expect(syncAchievements(db, profileId, now)).not.toContain(
      'hidratacao-mestre',
    )
  })
})
