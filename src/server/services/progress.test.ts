import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '#/db/client'
import { logWater, logWeight, logMood } from '#/db/repositories/logs'
import { findProtocolBySlug } from '#/db/repositories/protocols'
import { updateProfile } from '#/db/repositories/profile'
import { endSession, startSession } from '#/db/repositories/sessions'
import { createTestDb, createTestTenant } from '#/db/testing/helpers'

import { buildProgressView } from './progress'

function completedFast(
  db: Db,
  profileId: number,
  protocolId: number,
  start: Date,
  hours: number,
  extra: { breakFood?: string; moodNote?: string; notes?: string } = {},
) {
  const session = startSession(db, {
    profileId,
    protocolId,
    startedAt: start,
    targetHours: 16,
  })

  return endSession(db, session.id, {
    endedAt: new Date(start.getTime() + hours * 3600_000),
    ...extra,
  })
}

describe('buildProgressView', () => {
  const now = new Date(2026, 1, 25, 14, 0)
  let db: Db
  let protocolId: number
  let profile: ReturnType<typeof createTestTenant>

  beforeEach(() => {
    db = createTestDb()
    profile = createTestTenant(db)
    protocolId = findProtocolBySlug(db, '16-8-diario')!.id
  })

  it('aggregates the KPI cards', () => {
    completedFast(db, profile.id, protocolId, new Date(2026, 1, 23, 20, 0), 16)
    completedFast(db, profile.id, protocolId, new Date(2026, 1, 24, 20, 0), 16)
    completedFast(db, profile.id, protocolId, new Date(2026, 1, 22, 20, 0), 15)
    startSession(db, {
      profileId: profile.id,
      protocolId,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    const view = buildProgressView(db, profile.id, now)

    expect(view.streak).toEqual({ current: 3, record: 3 })
    expect(view.efficacy).toEqual({ met: 2, total: 3, percent: 67 })
    expect(view.targetHours).toBe(16)
    expect(view.weekBars).toHaveLength(7)
  })

  it('describes the weekly consistency insight', () => {
    completedFast(
      db,
      profile.id,
      protocolId,
      new Date(2026, 1, 23, 20, 0),
      16.5,
    )
    completedFast(
      db,
      profile.id,
      protocolId,
      new Date(2026, 1, 24, 20, 0),
      15.5,
    )

    const view = buildProgressView(db, profile.id, now)

    expect(view.averageHours).toBeCloseTo(4.571, 3)
    expect(view.averageDelta).toBeCloseTo(-11.4, 1)
    expect(view.insightVerdict).toBe('Atenção')
  })

  it('tracks weight progress towards the goal', () => {
    updateProfile(db, profile.id, { startWeightKg: 76.5, targetWeightKg: 71.5 })
    logWeight(db, {
      weightKg: 76.5,
      loggedAt: new Date(2026, 1, 1, 8, 0),
      profileId: profile.id,
    })
    logWeight(db, {
      weightKg: 73.7,
      loggedAt: new Date(2026, 1, 24, 8, 0),
      profileId: profile.id,
    })

    const view = buildProgressView(db, profile.id, now)

    expect(view.targetWeightKg).toBe(71.5)
    expect(view.weight?.currentWeightKg).toBe(73.7)
    expect(view.weight?.percentToGoal).toBe(56)
  })

  it('evaluates achievements against the history', () => {
    completedFast(db, profile.id, protocolId, new Date(2026, 1, 23, 20, 0), 19)

    const view = buildProgressView(db, profile.id, now)

    expect(view.totalAchievements).toBe(12)
    expect(view.unlockedCount).toBeGreaterThanOrEqual(3)
    expect(view.achievements[0].unlocked).toBe(true)
  })

  it('builds the expandable history entries', () => {
    const session = completedFast(
      db,
      profile.id,
      protocolId,
      new Date(2026, 1, 23, 20, 0),
      16,
      {
        breakFood: 'Caldo de ossos + Ovos mexidos',
        moodNote: 'Alta energia & clareza mental',
      },
    )
    logWater(db, {
      amountMl: 2200,
      loggedAt: new Date(2026, 1, 24, 10, 0),
      profileId: profile.id,
    })

    const view = buildProgressView(db, profile.id, now)
    const entry = view.history.find((item) => item.id === session.id)

    expect(entry?.dateLabel).toBe('Ontem')
    expect(entry?.statusLabel).toBe('16:8 Atingido')
    expect(entry?.durationLabel).toBe('16h 00m')
    expect(entry?.startedAtLabel).toBe('20:00')
    expect(entry?.endedAtLabel).toBe('12:00')
    expect(entry?.details).toEqual(
      expect.arrayContaining([
        {
          label: 'Quebra de Jejum',
          value: 'Caldo de ossos + Ovos mexidos',
          tone: 'on-surface',
        },
        {
          label: 'Sensação Somática',
          value: 'Alta energia & clareza mental',
          tone: 'secondary',
        },
        {
          label: 'Hidratação Registrada',
          value: '2.2L de água pura',
          tone: 'on-surface',
        },
      ]),
    )
  })

  it('labels a partial fast and its balance note', () => {
    completedFast(
      db,
      profile.id,
      protocolId,
      new Date(2026, 1, 22, 20, 0),
      15.5,
      {
        notes: 'Encerramento antecipado social',
      },
    )

    const view = buildProgressView(db, profile.id, now)
    const entry = view.history[0]

    expect(entry.statusLabel).toBe('Parcial')
    expect(entry.statusTone).toBe('on-surface-variant')
    expect(entry.durationLabel).toBe('15h 30m')
    expect(entry.details).toEqual(
      expect.arrayContaining([
        {
          label: 'Meta Pretendida',
          value: 'Encerramento antecipado social',
          tone: 'on-surface-variant',
        },
      ]),
    )
  })

  it('counts hydration streak days for the water badge', () => {
    for (let day = 20; day <= 24; day += 1) {
      logWater(db, {
        amountMl: 2600,
        loggedAt: new Date(2026, 1, day, 12, 0),
        profileId: profile.id,
      })
    }
    logMood(db, {
      level: 'alta',
      loggedAt: new Date(2026, 1, 24, 12, 0),
      profileId: profile.id,
    })

    const view = buildProgressView(db, profile.id, now)

    expect(view.waterGoalDays).toBe(5)
  })
})
