import { describe, expect, it } from 'vitest'

import { MOOD_LEVELS, averageMoodScore, moodOption } from './mood'

describe('MOOD_LEVELS', () => {
  it('maps the four disposition states of the tracker', () => {
    expect(MOOD_LEVELS.map((option) => option.id)).toEqual([
      'baixa',
      'media',
      'alta',
      'otima',
    ])
  })
})

describe('moodOption', () => {
  it('returns the copy used by the dashboard card', () => {
    expect(moodOption('otima').label).toBe('Ótima energia')
    expect(moodOption('otima').note).toBe('Foco mental aguçado')
    expect(moodOption('otima').emoji).toBe('⚡')
  })

  it('falls back to the first option for unknown levels', () => {
    expect(moodOption('inexistente' as never).id).toBe('baixa')
  })
})

describe('averageMoodScore', () => {
  it('averages the check-in scores', () => {
    expect(averageMoodScore(['otima', 'alta'])).toBe(3.5)
  })

  it('returns zero without check-ins', () => {
    expect(averageMoodScore([])).toBe(0)
  })
})
