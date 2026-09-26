import type {
  FastingSession,
  MoodLevel,
  Protocol,
  WaterLog,
  WeightLog,
} from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export function makeSession(
  overrides: Partial<FastingSession> = {},
): FastingSession {
  const startedAt =
    overrides.startedAt ?? new Date(2026, 1, 20, 20, 0, 0).toISOString()
  const targetHours = overrides.targetHours ?? 16
  const endedAt =
    overrides.endedAt ??
    new Date(
      new Date(startedAt).getTime() + targetHours * 60 * 60 * 1000,
    ).toISOString()

  return {
    id: 1,
    protocolId: 1,
    startedAt,
    endedAt,
    targetHours,
    status: 'completed',
    breakFood: null,
    moodNote: null,
    notes: null,
    ...overrides,
  }
}

export function makeWaterLog(overrides: Partial<WaterLog> = {}): WaterLog {
  return {
    id: 1,
    loggedAt: new Date(2026, 1, 24, 9, 30, 0).toISOString(),
    amountMl: 250,
    ...overrides,
  }
}

export function makeWeightLog(overrides: Partial<WeightLog> = {}): WeightLog {
  return {
    id: 1,
    loggedAt: new Date(2026, 1, 1, 8, 15, 0).toISOString(),
    weightKg: 76.5,
    ...overrides,
  }
}

export function makeMood(
  level: MoodLevel = 'otima',
  note: string | null = null,
) {
  return {
    id: 1,
    loggedAt: new Date(2026, 1, 24, 9, 30, 0).toISOString(),
    level,
    note,
  }
}

export function makeProtocol(overrides: Partial<Protocol> = {}): Protocol {
  return {
    id: 1,
    slug: '16-8-diario',
    name: '16:8 Diário',
    method: 'Leangains',
    category: 'iniciante',
    tagline: 'Mais Popular',
    description: '16h de jejum, janela alimentar de 8h.',
    fastingHours: 16,
    eatingHours: 8,
    badgeLabel: 'Fácil de manter',
    badgeTone: 'neutral',
    suggestedWindowStart: '12:00',
    suggestedWindowEnd: '20:00',
    biomarkers: [],
    popularity: 100,
    ...overrides,
  }
}

export function daysAgo(now: Date, days: number, hours = 0): Date {
  return new Date(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      days * DAY_MS +
      hours * 60 * 60 * 1000,
  )
}
