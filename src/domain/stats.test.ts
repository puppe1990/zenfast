import { describe, expect, it } from 'vitest'

import {
  averageHours,
  computeEfficacy,
  computeStreak,
  longestFastHours,
  monthlyHours,
  weeklyBars,
} from './stats'
import { makeSession } from './testing/fixtures'

const TARGET = 16

function fastEndingOn(
  day: Date,
  hours: number,
  status: 'completed' | 'partial' = 'completed',
) {
  const endedAt = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    12,
    0,
    0,
  )
  const startedAt = new Date(endedAt.getTime() - hours * 60 * 60 * 1000)

  return makeSession({
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    targetHours: TARGET,
    status: hours >= TARGET ? status : 'partial',
  })
}

function activeFast(startedAt: Date) {
  return makeSession({
    startedAt: startedAt.toISOString(),
    endedAt: null,
    targetHours: TARGET,
    status: 'active',
  })
}

describe('computeStreak', () => {
  const now = new Date(2026, 1, 25, 14, 0)

  it('counts consecutive goal-met days ending yesterday', () => {
    const sessions = [
      fastEndingOn(new Date(2026, 1, 24), 16),
      fastEndingOn(new Date(2026, 1, 23), 16.5),
      fastEndingOn(new Date(2026, 1, 22), 16),
    ]

    expect(computeStreak(sessions, now)).toEqual({ current: 3, record: 3 })
  })

  it('keeps the streak alive while today is still fasting', () => {
    const sessions = [
      activeFast(new Date(2026, 1, 24, 20, 0)),
      fastEndingOn(new Date(2026, 1, 24), 16),
      fastEndingOn(new Date(2026, 1, 23), 16),
    ]

    expect(computeStreak(sessions, now).current).toBe(3)
  })

  it('breaks the streak on a missed day', () => {
    const sessions = [
      fastEndingOn(new Date(2026, 1, 24), 16),
      fastEndingOn(new Date(2026, 1, 23), 15.5),
      fastEndingOn(new Date(2026, 1, 22), 16),
    ]

    expect(computeStreak(sessions, now).current).toBe(1)
  })

  it('remembers the record streak even after a break', () => {
    const sessions = [
      fastEndingOn(new Date(2026, 1, 24), 16),
      fastEndingOn(new Date(2026, 1, 20), 16),
      fastEndingOn(new Date(2026, 1, 19), 16),
      fastEndingOn(new Date(2026, 1, 18), 16),
      fastEndingOn(new Date(2026, 1, 17), 16),
    ]

    expect(computeStreak(sessions, now)).toEqual({ current: 1, record: 4 })
  })

  it('returns zero when nothing was logged', () => {
    expect(computeStreak([], now)).toEqual({ current: 0, record: 0 })
  })
})

describe('monthlyHours', () => {
  const now = new Date(2026, 1, 25, 14, 0)

  it('sums the current month and compares with the previous one', () => {
    const sessions = [
      fastEndingOn(new Date(2026, 1, 24), 16),
      fastEndingOn(new Date(2026, 1, 20), 16),
      fastEndingOn(new Date(2026, 0, 31), 16),
    ]

    expect(monthlyHours(sessions, now)).toEqual({
      hours: 32,
      previousHours: 16,
      deltaHours: 16,
    })
  })

  it('counts the elapsed time of the active fast', () => {
    const sessions = [activeFast(new Date(2026, 1, 25, 2, 0))]

    expect(monthlyHours(sessions, now).hours).toBe(12)
  })
})

describe('computeEfficacy', () => {
  const now = new Date(2026, 1, 25, 14, 0)

  it('measures how many finished fasts hit the goal', () => {
    const sessions = [
      fastEndingOn(new Date(2026, 1, 24), 16),
      fastEndingOn(new Date(2026, 1, 23), 16),
      fastEndingOn(new Date(2026, 1, 22), 18),
      fastEndingOn(new Date(2026, 1, 21), 15.5),
    ]

    expect(computeEfficacy(sessions, now)).toEqual({
      met: 3,
      total: 4,
      percent: 75,
    })
  })

  it('ignores the active fast until it is closed', () => {
    const sessions = [
      activeFast(new Date(2026, 1, 24, 20, 0)),
      fastEndingOn(new Date(2026, 1, 24), 16),
    ]

    expect(computeEfficacy(sessions, now)).toEqual({
      met: 1,
      total: 1,
      percent: 100,
    })
  })

  it('returns zero percent when there is nothing to measure', () => {
    expect(computeEfficacy([], now)).toEqual({ met: 0, total: 0, percent: 0 })
  })
})

describe('weeklyBars', () => {
  const now = new Date(2026, 1, 25, 12, 0)

  it('builds a Monday-first week with the elapsed active fast', () => {
    const sessions = [
      fastEndingOn(new Date(2026, 1, 23), 16.5),
      fastEndingOn(new Date(2026, 1, 24), 15.5),
      activeFast(new Date(2026, 1, 24, 20, 0)),
    ]

    const bars = weeklyBars(sessions, now, TARGET)

    expect(bars.map((bar) => bar.label)).toEqual([
      'Seg',
      'Ter',
      'Qua',
      'Qui',
      'Sex',
      'Sáb',
      'Dom',
    ])
    expect(bars.map((bar) => bar.hours)).toEqual([16.5, 15.5, 16, 0, 0, 0, 0])
    expect(bars.map((bar) => bar.meetsTarget)).toEqual([
      true,
      false,
      true,
      false,
      false,
      false,
      false,
    ])
    expect(bars.map((bar) => bar.isToday)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ])
    expect(bars.filter((bar) => bar.isBest)).toHaveLength(1)
    expect(bars.find((bar) => bar.isBest)?.label).toBe('Seg')
  })

  it('ignores sessions from other weeks', () => {
    const sessions = [
      fastEndingOn(new Date(2026, 1, 18), 16),
      fastEndingOn(new Date(2026, 1, 23), 17),
    ]

    const bars = weeklyBars(sessions, now, TARGET)

    expect(bars.map((bar) => bar.hours)).toEqual([17, 0, 0, 0, 0, 0, 0])
  })
})

describe('averageHours', () => {
  it('divides the weekly total across the seven days', () => {
    const bars = weeklyBars(
      [
        fastEndingOn(new Date(2026, 1, 23), 16.5),
        fastEndingOn(new Date(2026, 1, 24), 15.5),
      ],
      new Date(2026, 1, 25, 12, 0),
      TARGET,
    )

    expect(averageHours(bars)).toBeCloseTo(4.571, 3)
  })
})

describe('longestFastHours', () => {
  it('finds the deepest fast of the history', () => {
    const now = new Date(2026, 1, 25, 14, 0)
    const sessions = [
      fastEndingOn(new Date(2026, 1, 24), 16),
      fastEndingOn(new Date(2026, 1, 23), 19.5),
      fastEndingOn(new Date(2026, 1, 22), 18),
    ]

    expect(longestFastHours(sessions, now)).toBe(19.5)
  })
})
