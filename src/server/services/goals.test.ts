import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '#/db/client'
import { findProtocolBySlug } from '#/db/repositories/protocols'
import { findActiveSession, startSession } from '#/db/repositories/sessions'
import { createTestDb, createTestTenant } from '#/db/testing/helpers'

import { buildDashboard } from './dashboard'
import { applyGoalChange } from './goals'

describe('applyGoalChange', () => {
  const now = new Date(2026, 1, 25, 14, 0)
  let db: Db
  let profile: ReturnType<typeof createTestTenant>
  let protocolId: number

  beforeEach(() => {
    db = createTestDb()
    profile = createTestTenant(db)
    protocolId = findProtocolBySlug(db, '16-8-diario')!.id
  })

  it('saves the new daily goal on the tenant', () => {
    const updated = applyGoalChange(db, profile.id, { dailyTargetHours: 18 })

    expect(updated.dailyTargetHours).toBe(18)
  })

  it('retargets the fast that is currently running', () => {
    const session = startSession(db, {
      profileId: profile.id,
      protocolId,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    applyGoalChange(db, profile.id, { dailyTargetHours: 18 })

    expect(findActiveSession(db, profile.id)?.targetHours).toBe(18)
    expect(findActiveSession(db, profile.id)?.id).toBe(session.id)
  })

  it('leaves finished fasts untouched', () => {
    applyGoalChange(db, profile.id, { dailyTargetHours: 18 })

    const dashboard = buildDashboard(db, profile.id, now)

    expect(dashboard.goalHours).toBe(18)
    expect(dashboard.timerTargetHours).toBe(18)
  })

  it('reflects the new goal in the running timer and in the feeding window', () => {
    startSession(db, {
      profileId: profile.id,
      protocolId,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    applyGoalChange(db, profile.id, { dailyTargetHours: 20 })

    const dashboard = buildDashboard(db, profile.id, now)

    expect(dashboard.goalHours).toBe(20)
    expect(dashboard.timerTargetHours).toBe(20)
    expect(dashboard.progress?.targetHours).toBe(20)
    expect(dashboard.progress?.remainingLabel).toBe('2h 00m')
    expect(dashboard.progress?.targetTimeLabel).toBe('16:00')
    expect(dashboard.nextWindow.durationHours).toBe(4)
  })

  it('keeps other goals when only the fasting hours change', () => {
    applyGoalChange(db, profile.id, { waterGoalMl: 3200 })

    const updated = applyGoalChange(db, profile.id, { dailyTargetHours: 14 })

    expect(updated.waterGoalMl).toBe(3200)
    expect(updated.dailyTargetHours).toBe(14)
  })
})
