import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '../client'
import { createTestDb, createTestTenant } from '../testing/helpers'
import {
  latestMood,
  listWaterLogs,
  listWeightLogs,
  logMood,
  logWater,
  logWeight,
  waterTotal,
} from './logs'

describe('logs repository', () => {
  let db: Db
  let profileId: number

  beforeEach(() => {
    db = createTestDb()
    profileId = createTestTenant(db).id
  })

  it('registers water and sums the day total', () => {
    logWater(db, {
      amountMl: 250,
      loggedAt: new Date(2026, 1, 24, 8, 0),
      profileId,
    })
    logWater(db, {
      amountMl: 250,
      loggedAt: new Date(2026, 1, 24, 9, 30),
      profileId,
    })
    logWater(db, {
      amountMl: 250,
      loggedAt: new Date(2026, 1, 23, 9, 30),
      profileId,
    })

    const dayStart = new Date(2026, 1, 24, 0, 0)
    const dayEnd = new Date(2026, 1, 24, 23, 59)

    expect(waterTotal(db, { profileId, since: dayStart, until: dayEnd })).toBe(
      500,
    )
    expect(
      listWaterLogs(db, { profileId, since: dayStart, until: dayEnd }),
    ).toHaveLength(2)
  })

  it('reports the most recent water intake', () => {
    logWater(db, {
      amountMl: 250,
      loggedAt: new Date(2026, 1, 24, 8, 0),
      profileId,
    })
    const last = logWater(db, {
      amountMl: 300,
      loggedAt: new Date(2026, 1, 24, 9, 30),
      profileId,
    })

    const logs = listWaterLogs(db, { profileId, limit: 1 })

    expect(logs[0].id).toBe(last.id)
    expect(logs[0].amountMl).toBe(300)
  })

  it('stores mood check-ins and returns the latest one', () => {
    logMood(db, {
      level: 'media',
      note: 'Cansaço leve',
      loggedAt: new Date(2026, 1, 23, 9, 0),
      profileId,
    })
    logMood(db, {
      level: 'otima',
      note: 'Foco mental aguçado',
      loggedAt: new Date(2026, 1, 24, 9, 30),
      profileId,
    })

    expect(latestMood(db, profileId)?.level).toBe('otima')
    expect(latestMood(db, profileId)?.note).toBe('Foco mental aguçado')
  })

  it('returns null when no mood was logged', () => {
    expect(latestMood(db, profileId)).toBeNull()
  })

  it('registers weight evolution in chronological order', () => {
    logWeight(db, {
      weightKg: 76.5,
      loggedAt: new Date(2026, 1, 1, 8, 15),
      profileId,
    })
    logWeight(db, {
      weightKg: 73.7,
      loggedAt: new Date(2026, 1, 24, 8, 15),
      profileId,
    })
    logWeight(db, {
      weightKg: 74.9,
      loggedAt: new Date(2026, 1, 12, 8, 15),
      profileId,
    })

    const logs = listWeightLogs(db, { profileId })

    expect(logs.map((log) => log.weightKg)).toEqual([76.5, 74.9, 73.7])
  })

  it('scopes every log to the profile', () => {
    logWater(db, {
      amountMl: 250,
      loggedAt: new Date(2026, 1, 24, 8, 0),
      profileId,
    })
    logWeight(db, {
      weightKg: 73.7,
      loggedAt: new Date(2026, 1, 24, 8, 0),
      profileId,
    })

    expect(listWaterLogs(db, { profileId })).toHaveLength(1)
    expect(listWeightLogs(db, { profileId })).toHaveLength(1)
    expect(listWaterLogs(db, { profileId: 999 })).toHaveLength(0)
  })
})
