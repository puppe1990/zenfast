import { describe, expect, it } from 'vitest'

import {
  MAX_BACKDATE_HOURS,
  computeFastingProgress,
  fastingDurationHours,
  parseFastingStart,
  roundUpDurationLabel,
  sessionMeetsGoal,
} from './fasting'
import { makeSession } from './testing/fixtures'

describe('computeFastingProgress', () => {
  const now = new Date(2026, 1, 25, 10, 25, 41)
  const startedAt = new Date(2026, 1, 24, 20, 0, 0)

  it('tracks the elapsed clock, remaining time and target hour', () => {
    const progress = computeFastingProgress(startedAt, 16, now)

    expect(progress.elapsedSeconds).toBe(14 * 3600 + 25 * 60 + 41)
    expect(progress.elapsedHours).toBeCloseTo(14.428, 3)
    expect(progress.remainingLabel).toBe('1h 35m')
    expect(progress.targetTimeLabel).toBe('12:00')
    expect(progress.isTargetReached).toBe(false)
  })

  it('measures the ring completion against the target', () => {
    const progress = computeFastingProgress(startedAt, 16, now)

    expect(progress.percent).toBeCloseTo(90.18, 2)
    expect(progress.percentCapped).toBeCloseTo(90.18, 2)
  })

  it('caps the ring but keeps the raw percentage after the target', () => {
    const late = new Date(2026, 1, 25, 14, 0, 0)
    const progress = computeFastingProgress(startedAt, 16, late)

    expect(progress.isTargetReached).toBe(true)
    expect(progress.percent).toBeCloseTo(112.5, 1)
    expect(progress.percentCapped).toBe(100)
    expect(progress.remainingLabel).toBe('Meta atingida')
  })

  it('accepts ISO strings for the start', () => {
    const progress = computeFastingProgress(startedAt.toISOString(), 16, now)
    expect(progress.elapsedSeconds).toBe(14 * 3600 + 25 * 60 + 41)
  })

  it('never reports negative elapsed time', () => {
    const future = new Date(2026, 1, 26, 8, 0, 0)
    const progress = computeFastingProgress(future, 16, now)
    expect(progress.elapsedSeconds).toBe(0)
  })
})

describe('roundUpDurationLabel', () => {
  it('rounds partial minutes up, like the countdown in the design', () => {
    expect(roundUpDurationLabel((1 * 3600 + 34 * 60 + 19) / 3600)).toBe(
      '1h 35m',
    )
  })

  it('keeps exact durations untouched', () => {
    expect(roundUpDurationLabel(8)).toBe('8h 00m')
  })
})

describe('parseFastingStart', () => {
  const now = new Date(2026, 1, 25, 10, 0, 0)

  it('accepts a past start within the allowed window', () => {
    const start = parseFastingStart(
      new Date(2026, 1, 25, 6, 0, 0).toISOString(),
      now,
    )

    expect(start.toISOString()).toBe(
      new Date(2026, 1, 25, 6, 0, 0).toISOString(),
    )
  })

  it('accepts the exact current time', () => {
    expect(parseFastingStart(now.toISOString(), now).getTime()).toBe(
      now.getTime(),
    )
  })

  it('rejects an invalid date', () => {
    expect(() => parseFastingStart('not-a-date', now)).toThrow(/inválido/i)
  })

  it('rejects a start in the future', () => {
    expect(() =>
      parseFastingStart(new Date(2026, 1, 25, 10, 1, 0).toISOString(), now),
    ).toThrow(/futuro/i)
  })

  it('rejects a start older than the maximum backdate window', () => {
    const tooOld = new Date(
      now.getTime() - (MAX_BACKDATE_HOURS * 3600_000 + 60_000),
    )

    expect(() => parseFastingStart(tooOld.toISOString(), now)).toThrow(
      /anterior/i,
    )
  })
})

describe('fastingDurationHours', () => {
  it('uses the end date for finished sessions', () => {
    const session = makeSession({
      startedAt: new Date(2026, 1, 23, 20, 0).toISOString(),
      endedAt: new Date(2026, 1, 24, 12, 0).toISOString(),
      targetHours: 16,
    })

    expect(fastingDurationHours(session, new Date(2026, 1, 24, 18, 0))).toBe(16)
  })

  it('uses the current time for the active session', () => {
    const session = makeSession({
      startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
      endedAt: null,
      status: 'active',
      targetHours: 16,
    })

    expect(fastingDurationHours(session, new Date(2026, 1, 25, 10, 0))).toBe(14)
  })
})

describe('sessionMeetsGoal', () => {
  it('is true when the fast reaches the target', () => {
    const session = makeSession({
      startedAt: new Date(2026, 1, 23, 20, 0).toISOString(),
      endedAt: new Date(2026, 1, 24, 12, 0).toISOString(),
      targetHours: 16,
    })

    expect(sessionMeetsGoal(session, new Date(2026, 1, 24, 23, 0))).toBe(true)
  })

  it('is false when the fast is closed before the target', () => {
    const session = makeSession({
      startedAt: new Date(2026, 1, 23, 20, 0).toISOString(),
      endedAt: new Date(2026, 1, 24, 11, 30).toISOString(),
      targetHours: 16,
      status: 'partial',
    })

    expect(sessionMeetsGoal(session, new Date(2026, 1, 24, 23, 0))).toBe(false)
  })

  it('keeps counting the active session once it passes the target', () => {
    const session = makeSession({
      startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
      endedAt: null,
      status: 'active',
      targetHours: 16,
    })

    expect(sessionMeetsGoal(session, new Date(2026, 1, 25, 12, 30))).toBe(true)
    expect(sessionMeetsGoal(session, new Date(2026, 1, 25, 10, 0))).toBe(false)
  })
})
