import type { DetailTone } from '#/server/services/progress'
import type { MetabolicTone } from '#/domain/types'

export const TONE_TEXT: Record<MetabolicTone, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  error: 'text-error',
  neutral: 'text-on-surface',
}

export const TONE_SOFT_BG: Record<MetabolicTone, string> = {
  primary: 'bg-primary-container/20',
  secondary: 'bg-secondary/15',
  tertiary: 'bg-tertiary/15',
  error: 'bg-error-container/40',
  neutral: 'bg-surface-container-highest',
}

export const TONE_CHIP: Record<MetabolicTone, string> = {
  primary:
    'bg-primary-container/20 text-primary border border-primary-container/30',
  secondary: 'bg-secondary/15 text-secondary border border-secondary/25',
  tertiary: 'bg-tertiary/15 text-tertiary border border-tertiary/25',
  error: 'bg-error-container/40 text-error border border-error/30',
  neutral: 'bg-surface-variant text-on-surface',
}

export const DETAIL_TONE_TEXT: Record<DetailTone, string> = {
  'on-surface': 'text-on-surface',
  'on-surface-variant': 'text-on-surface-variant',
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
}
