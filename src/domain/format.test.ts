import { describe, expect, it } from 'vitest'

import {
  formatClockFromSeconds,
  formatDateLabel,
  formatDayPhrase,
  formatDecimal,
  formatDurationFromHours,
  formatHoursValue,
  formatMonthDay,
  formatRelativeTime,
  formatTime,
  formatWater,
  formatWaterLiters,
} from './format'

describe('formatClockFromSeconds', () => {
  it('formats seconds as zero-padded clock', () => {
    expect(formatClockFromSeconds(51941)).toBe('14:25:41')
  })

  it('handles values above 24 hours', () => {
    expect(formatClockFromSeconds(26 * 3600 + 5)).toBe('26:00:05')
  })

  it('never returns negative clocks', () => {
    expect(formatClockFromSeconds(-10)).toBe('00:00:00')
  })
})

describe('formatDurationFromHours', () => {
  it('formats decimal hours as h/m', () => {
    expect(formatDurationFromHours(1.5833)).toBe('1h 35m')
  })

  it('formats whole hours', () => {
    expect(formatDurationFromHours(2)).toBe('2h 00m')
  })

  it('rounds minutes up when close to the hour', () => {
    expect(formatDurationFromHours(15.999)).toBe('16h 00m')
  })
})

describe('formatHoursValue', () => {
  it('renders one decimal with a dot, like the telemetry design', () => {
    expect(formatHoursValue(113.7)).toBe('113.7')
    expect(formatHoursValue(16)).toBe('16.0')
  })
})

describe('formatWater', () => {
  it('uses pt-BR thousand separators', () => {
    expect(formatWater(1750)).toBe('1.750')
    expect(formatWater(250)).toBe('250')
  })

  it('formats liters for history details', () => {
    expect(formatWaterLiters(2200)).toBe('2.2L')
  })
})

describe('formatDecimal', () => {
  it('formats weights and deltas with one decimal', () => {
    expect(formatDecimal(73.7)).toBe('73.7')
    expect(formatDecimal(-2.8)).toBe('-2.8')
  })
})

describe('formatTime', () => {
  it('formats a date as HH:MM in 24h', () => {
    expect(formatTime(new Date(2026, 1, 24, 9, 5))).toBe('09:05')
    expect(formatTime(new Date(2026, 1, 24, 20, 0))).toBe('20:00')
  })
})

describe('formatMonthDay', () => {
  it('formats as DD/MMM in pt-BR', () => {
    expect(formatMonthDay(new Date(2026, 1, 1))).toBe('01/Fev')
  })
})

describe('formatDateLabel', () => {
  const now = new Date(2026, 1, 24, 10, 0)

  it('labels today and yesterday', () => {
    expect(formatDateLabel(new Date(2026, 1, 24, 1, 0), now)).toBe('Hoje')
    expect(formatDateLabel(new Date(2026, 1, 23, 20, 0), now)).toBe('Ontem')
  })

  it('labels other days with weekday and pt-BR date', () => {
    expect(formatDateLabel(new Date(2026, 1, 21, 12, 0), now)).toBe(
      'Sábado, 21 de Fevereiro',
    )
  })
})

describe('formatDayPhrase', () => {
  const now = new Date(2026, 1, 25, 10, 25)

  it('describes the day in a sentence', () => {
    expect(formatDayPhrase(new Date(2026, 1, 25, 8, 0), now)).toBe('hoje')
    expect(formatDayPhrase(new Date(2026, 1, 24, 20, 0), now)).toBe('ontem')
    expect(formatDayPhrase(new Date(2026, 1, 20, 20, 0), now)).toBe(
      '20 de Fevereiro',
    )
  })
})

describe('formatRelativeTime', () => {
  const now = new Date(2026, 1, 25, 10, 25)

  it('describes recent water logs', () => {
    expect(formatRelativeTime(new Date(2026, 1, 25, 9, 45), now)).toBe(
      'há 40 minutos',
    )
    expect(formatRelativeTime(new Date(2026, 1, 25, 10, 25), now)).toBe(
      'agora mesmo',
    )
    expect(formatRelativeTime(new Date(2026, 1, 25, 7, 0), now)).toBe('há 3h')
    expect(formatRelativeTime(new Date(2026, 1, 23, 10, 0), now)).toBe(
      'há 2 dias',
    )
  })
})
