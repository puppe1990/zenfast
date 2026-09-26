import { describe, expect, it } from 'vitest'

import { makeWeightLog } from './testing/fixtures'
import { weightProgress } from './weight'

describe('weightProgress', () => {
  const logs = [
    makeWeightLog({
      id: 1,
      loggedAt: new Date(2026, 1, 1).toISOString(),
      weightKg: 76.5,
    }),
    makeWeightLog({
      id: 2,
      loggedAt: new Date(2026, 1, 12).toISOString(),
      weightKg: 74.9,
    }),
    makeWeightLog({
      id: 3,
      loggedAt: new Date(2026, 1, 24).toISOString(),
      weightKg: 73.7,
    }),
  ]

  it('compares the first and the latest log against the goal', () => {
    const progress = weightProgress(logs, 71.5)

    expect(progress).not.toBeNull()
    expect(progress?.startWeightKg).toBe(76.5)
    expect(progress?.currentWeightKg).toBe(73.7)
    expect(progress?.deltaKg).toBeCloseTo(-2.8, 5)
    expect(progress?.remainingKg).toBeCloseTo(2.2, 5)
    expect(progress?.percentToGoal).toBe(56)
  })

  it('sorts logs by date regardless of input order', () => {
    const shuffled = [logs[2], logs[0], logs[1]]
    const progress = weightProgress(shuffled, 71.5)

    expect(progress?.startWeightKg).toBe(76.5)
    expect(progress?.currentWeightKg).toBe(73.7)
  })

  it('caps the progress bar at 100% when the goal is beaten', () => {
    const beaten = [
      ...logs,
      makeWeightLog({
        id: 4,
        loggedAt: new Date(2026, 1, 25).toISOString(),
        weightKg: 70,
      }),
    ]

    expect(weightProgress(beaten, 71.5)?.percentToGoal).toBe(100)
  })

  it('returns null without logs', () => {
    expect(weightProgress([], 71.5)).toBeNull()
  })

  it('reports no progress with a single log', () => {
    const progress = weightProgress([logs[0]], 71.5)

    expect(progress?.deltaKg).toBe(0)
    expect(progress?.percentToGoal).toBe(0)
  })

  it('never divides by zero when start equals goal', () => {
    const progress = weightProgress([logs[0]], 76.5)

    expect(progress?.percentToGoal).toBe(0)
  })
})
