import { describe, expect, it } from 'vitest'

import {
  METABOLIC_STAGES,
  cycleCompletionPercent,
  stageForElapsedHours,
  stageIndexForElapsedHours,
} from './metabolic'

describe('METABOLIC_STAGES', () => {
  it('describes the five biological stages in order', () => {
    expect(METABOLIC_STAGES.map((stage) => stage.label)).toEqual([
      'Digestão',
      'Insulina Baixa',
      'Gordura',
      'Cetose',
      'Autofagia',
    ])
  })

  it('renders the ranges used by the metabolic stepper', () => {
    expect(METABOLIC_STAGES.map((stage) => stage.rangeLabel)).toEqual([
      '0 - 4h',
      '4 - 8h',
      '8 - 14h',
      '14 - 16h',
      '16h+',
    ])
  })
})

describe('stageForElapsedHours', () => {
  it('maps elapsed hours to the digestion stage', () => {
    expect(stageForElapsedHours(0).id).toBe('digestao')
    expect(stageForElapsedHours(3.9).id).toBe('digestao')
  })

  it('maps stage boundaries inclusively to the next stage', () => {
    expect(stageForElapsedHours(4).id).toBe('insulina-baixa')
    expect(stageForElapsedHours(8).id).toBe('gordura')
    expect(stageForElapsedHours(14).id).toBe('cetose')
    expect(stageForElapsedHours(16).id).toBe('autofagia')
  })

  it('keeps the last stage for very long fasts', () => {
    expect(stageForElapsedHours(48).id).toBe('autofagia')
  })

  it('treats invalid input as the first stage', () => {
    expect(stageForElapsedHours(-3).id).toBe('digestao')
  })

  it('describes the lipolysis stage with the design copy', () => {
    const stage = stageForElapsedHours(12)
    expect(stage.title).toBe('Queima Acelerada de Gordura')
    expect(stage.badge).toBe('Lipólise Alta')
    expect(stage.tone).toBe('primary')
  })

  it('describes the autophagy stage with the violet tone', () => {
    const stage = stageForElapsedHours(18)
    expect(stage.badge).toBe('Autofagia Ativa')
    expect(stage.tone).toBe('tertiary')
  })
})

describe('stageIndexForElapsedHours', () => {
  it('returns the zero-based index of the active stage', () => {
    expect(stageIndexForElapsedHours(2)).toBe(0)
    expect(stageIndexForElapsedHours(10)).toBe(2)
    expect(stageIndexForElapsedHours(20)).toBe(4)
  })
})

describe('cycleCompletionPercent', () => {
  it('measures how much of the daily cycle was fasted', () => {
    expect(cycleCompletionPercent(14.08, 16)).toBe(88)
  })

  it('caps at 100%', () => {
    expect(cycleCompletionPercent(20, 16)).toBe(100)
  })
})
