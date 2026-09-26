import type { MoodLevel } from './types'

export interface MoodOption {
  id: MoodLevel
  label: string
  emoji: string
  note: string
  score: number
}

export const MOOD_LEVELS: MoodOption[] = [
  {
    id: 'baixa',
    label: 'Energia baixa',
    emoji: '😔',
    note: 'Corpo pedindo descanso e hidratação',
    score: 1,
  },
  {
    id: 'media',
    label: 'Energia estável',
    emoji: '🙂',
    note: 'Ritmo constante, foco moderado',
    score: 2,
  },
  {
    id: 'alta',
    label: 'Boa energia',
    emoji: '🔋',
    note: 'Disposição consistente durante o jejum',
    score: 3,
  },
  {
    id: 'otima',
    label: 'Ótima energia',
    emoji: '⚡',
    note: 'Foco mental aguçado',
    score: 4,
  },
]

export function moodOption(level: MoodLevel): MoodOption {
  return MOOD_LEVELS.find((option) => option.id === level) ?? MOOD_LEVELS[0]
}

export function averageMoodScore(levels: MoodLevel[]): number {
  if (levels.length === 0) {
    return 0
  }

  const total = levels.reduce((sum, level) => sum + moodOption(level).score, 0)

  return Math.round((total / levels.length) * 10) / 10
}
