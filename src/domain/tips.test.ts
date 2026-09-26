import { describe, expect, it } from 'vitest'

import { dayOfYear, tipForDay } from './tips'
import type { Tip } from './types'

const tips: Tip[] = [
  { id: 1, title: 'Primeira', body: 'a' },
  { id: 2, title: 'Segunda', body: 'b' },
  { id: 3, title: 'Terceira', body: 'c' },
]

describe('dayOfYear', () => {
  it('starts at one on the first of January', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1)
    expect(dayOfYear(new Date(2026, 0, 31))).toBe(31)
  })

  it('counts leap years', () => {
    expect(dayOfYear(new Date(2024, 11, 31))).toBe(366)
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365)
  })
})

describe('tipForDay', () => {
  it('rotates the tips through the days', () => {
    const first = tipForDay(tips, new Date(2026, 0, 1))
    const second = tipForDay(tips, new Date(2026, 0, 2))
    const third = tipForDay(tips, new Date(2026, 0, 3))
    const fourth = tipForDay(tips, new Date(2026, 0, 4))

    expect([first?.id, second?.id, third?.id, fourth?.id]).toEqual([1, 2, 3, 1])
  })

  it('is stable for the same day', () => {
    expect(tipForDay(tips, new Date(2026, 5, 10, 8))?.id).toBe(
      tipForDay(tips, new Date(2026, 5, 10, 22))?.id,
    )
  })

  it('offsets to a different tip on the same day', () => {
    const today = new Date(2026, 0, 1)

    expect(tipForDay(tips, today)?.id).not.toBe(tipForDay(tips, today, 1)?.id)
  })

  it('returns null without tips', () => {
    expect(tipForDay([], new Date())).toBeNull()
  })
})
