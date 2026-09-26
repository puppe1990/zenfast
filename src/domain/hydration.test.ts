import { describe, expect, it } from 'vitest'

import { hydrationProgress, hydrationSegments } from './hydration'

describe('hydrationSegments', () => {
  it('fills the droplet indicators proportionally', () => {
    expect(hydrationSegments(1750, 2500)).toEqual([1, 1, 1, 0.5, 0])
  })

  it('fills every segment when the goal is reached', () => {
    expect(hydrationSegments(2500, 2500)).toEqual([1, 1, 1, 1, 1])
  })

  it('never overflows or goes negative', () => {
    expect(hydrationSegments(9000, 2500)).toEqual([1, 1, 1, 1, 1])
    expect(hydrationSegments(-100, 2500)).toEqual([0, 0, 0, 0, 0])
  })
})

describe('hydrationProgress', () => {
  it('tracks intake against the daily goal', () => {
    const progress = hydrationProgress(1750, 2500)

    expect(progress.percent).toBe(70)
    expect(progress.isGoalReached).toBe(false)
    expect(progress.segments).toHaveLength(5)
  })

  it('flags the goal as reached and caps the percentage', () => {
    const progress = hydrationProgress(3000, 2500)

    expect(progress.isGoalReached).toBe(true)
    expect(progress.percent).toBe(100)
  })

  it('handles a zero goal', () => {
    const progress = hydrationProgress(500, 0)

    expect(progress.percent).toBe(0)
    expect(progress.segments).toEqual([])
  })
})
