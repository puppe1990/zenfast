import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '#/db/client'
import { logMood, logWater } from '#/db/repositories/logs'
import { findProtocolBySlug } from '#/db/repositories/protocols'
import { startSession, endSession } from '#/db/repositories/sessions'
import { createTestDb, createTestTenant } from '#/db/testing/helpers'

import { buildDashboard } from './dashboard'

describe('buildDashboard', () => {
  const now = new Date(2026, 1, 25, 10, 25, 41)
  let db: Db
  let profile: ReturnType<typeof createTestTenant>

  beforeEach(() => {
    db = createTestDb()
    profile = createTestTenant(db)
  })

  it('projects the active fast into the radial timer', () => {
    const protocol = findProtocolBySlug(db, '16-8-diario')!
    startSession(db, {
      profileId: profile.id,
      protocolId: protocol.id,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    const dashboard = buildDashboard(db, profile.id, now)

    expect(dashboard.activeSession).not.toBeNull()
    expect(dashboard.progress?.elapsedSeconds).toBe(14 * 3600 + 25 * 60 + 41)
    expect(dashboard.progress?.remainingLabel).toBe('1h 35m')
    expect(dashboard.progress?.targetTimeLabel).toBe('12:00')
    expect(dashboard.stage.id).toBe('cetose')
    expect(dashboard.stageIndex).toBe(3)
    expect(dashboard.cyclePercent).toBe(90)
  })

  it('summarises hydration and disposition of the day', () => {
    logWater(db, {
      amountMl: 1500,
      loggedAt: new Date(2026, 1, 25, 8, 0),
      profileId: profile.id,
    })
    logWater(db, {
      amountMl: 250,
      loggedAt: new Date(2026, 1, 25, 9, 45),
      profileId: profile.id,
    })
    logWater(db, {
      amountMl: 500,
      loggedAt: new Date(2026, 1, 24, 9, 45),
      profileId: profile.id,
    })
    logMood(db, {
      level: 'otima',
      note: 'Foco mental aguçado',
      loggedAt: new Date(2026, 1, 25, 9, 30),
      profileId: profile.id,
    })

    const dashboard = buildDashboard(db, profile.id, now)

    expect(dashboard.hydration.consumedMl).toBe(1750)
    expect(dashboard.hydration.goalMl).toBe(2500)
    expect(dashboard.hydration.percent).toBe(70)
    expect(dashboard.hydration.lastLogAt).toBe(
      new Date(2026, 1, 25, 9, 45).toISOString(),
    )
    expect(dashboard.mood?.label).toBe('Ótima energia')
    expect(dashboard.mood?.note).toBe('Foco mental aguçado')
  })

  it('previews the next feeding window from the protocol', () => {
    const protocol = findProtocolBySlug(db, '16-8-diario')!
    startSession(db, {
      profileId: profile.id,
      protocolId: protocol.id,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    const dashboard = buildDashboard(db, profile.id, now)

    expect(dashboard.nextWindow).toEqual({
      startLabel: '12:00',
      endLabel: '20:00',
      durationHours: 8,
    })
  })

  it('keeps the protocol and streak available for the header', () => {
    const protocol = findProtocolBySlug(db, '16-8-diario')!
    const first = startSession(db, {
      profileId: profile.id,
      protocolId: protocol.id,
      startedAt: new Date(2026, 1, 22, 20, 0),
      targetHours: 16,
    })
    endSession(db, first.id, { endedAt: new Date(2026, 1, 23, 12, 0) })
    const second = startSession(db, {
      profileId: profile.id,
      protocolId: protocol.id,
      startedAt: new Date(2026, 1, 23, 20, 0),
      targetHours: 16,
    })
    endSession(db, second.id, { endedAt: new Date(2026, 1, 24, 12, 0) })

    const dashboard = buildDashboard(db, profile.id, now)

    expect(dashboard.protocol.slug).toBe('16-8-diario')
    expect(dashboard.streakDays).toBe(2)
    expect(dashboard.todayHours).toBe(0)
  })

  it('works without an active fast', () => {
    const dashboard = buildDashboard(db, profile.id, now)

    expect(dashboard.activeSession).toBeNull()
    expect(dashboard.progress).toBeNull()
    expect(dashboard.stage.id).toBe('digestao')
    expect(dashboard.cyclePercent).toBe(0)
  })
})
