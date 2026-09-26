import type { AchievementRequirementType, MetabolicTone } from './types'

export interface AchievementStats {
  streak: { current: number; record: number }
  longestFastHours: number
  totalFasts: number
  goalEfficacyPercent: number
  waterGoalDays: number
}

export interface AchievementRule {
  slug: string
  title: string
  description: string
  icon: string
  tierLabel: string
  requirementType: AchievementRequirementType
  requirementValue: number
  tint: MetabolicTone
}

export interface AchievementEvaluation extends AchievementRule {
  unlocked: boolean
  progressPercent: number
  progressLabel: string
}

export const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    slug: 'pioneiro-do-jejum',
    title: 'Pioneiro do Jejum',
    description: 'Primeiro jejum 16:8 concluído com êxito.',
    icon: '🏅',
    tierLabel: 'Nível 1',
    requirementType: 'single-fast-hours',
    requirementValue: 16,
    tint: 'primary',
  },
  {
    slug: 'fogo-metabolico',
    title: 'Fogo Metabólico',
    description: 'Manteve o ritmo sem falhas durante 7 dias seguidos.',
    icon: '🔥',
    tierLabel: '7 Dias',
    requirementType: 'streak-days',
    requirementValue: 7,
    tint: 'primary',
  },
  {
    slug: 'mestre-da-cetose',
    title: 'Mestre da Cetose',
    description: 'Jejum profundo de 18 horas superado.',
    icon: '⚡',
    tierLabel: '18h+',
    requirementType: 'single-fast-hours',
    requirementValue: 18,
    tint: 'secondary',
  },
  {
    slug: 'guerreiro-20-4',
    title: 'Guerreiro 20:4',
    description: 'Sustentou a janela de 4h da dieta do guerreiro.',
    icon: '🛡️',
    tierLabel: '20h+',
    requirementType: 'single-fast-hours',
    requirementValue: 20,
    tint: 'tertiary',
  },
  {
    slug: 'autofagia-nivel-1',
    title: 'Autofagia Nível 1',
    description: 'Alcance 24h de jejum para ativar a autofagia profunda.',
    icon: '🧬',
    tierLabel: '24h',
    requirementType: 'single-fast-hours',
    requirementValue: 24,
    tint: 'tertiary',
  },
  {
    slug: 'disciplina-extrema',
    title: 'Disciplina Extrema',
    description: 'Completou um jejum OMAD de 23 horas.',
    icon: '🗿',
    tierLabel: 'OMAD',
    requirementType: 'single-fast-hours',
    requirementValue: 23,
    tint: 'error',
  },
  {
    slug: 'primeira-semana',
    title: 'Primeira Semana',
    description: 'Sete jejuns registrados no seu histórico.',
    icon: '🗓️',
    tierLabel: '7 Jejuns',
    requirementType: 'total-fasts',
    requirementValue: 7,
    tint: 'secondary',
  },
  {
    slug: 'constancia-de-ferro',
    title: 'Constância de Ferro',
    description: 'Trinta jejuns concluídos sem abandonar o protocolo.',
    icon: '🧱',
    tierLabel: '30 Jejuns',
    requirementType: 'total-fasts',
    requirementValue: 30,
    tint: 'primary',
  },
  {
    slug: 'meta-batida',
    title: 'Meta Batida',
    description: 'Manteve 90% de eficácia entre metas e jejuns concluídos.',
    icon: '🎯',
    tierLabel: '90%',
    requirementType: 'goal-efficacy',
    requirementValue: 90,
    tint: 'secondary',
  },
  {
    slug: 'eficacia-perfeita',
    title: 'Eficácia Perfeita',
    description: 'Fechou o ciclo com 100% das metas atingidas.',
    icon: '💎',
    tierLabel: '100%',
    requirementType: 'goal-efficacy',
    requirementValue: 100,
    tint: 'tertiary',
  },
  {
    slug: 'hidratacao-mestre',
    title: 'Hidratação Mestre',
    description: 'Bateu a meta de água durante sete dias seguidos.',
    icon: '💧',
    tierLabel: '7 Dias',
    requirementType: 'water-goal-days',
    requirementValue: 7,
    tint: 'secondary',
  },
  {
    slug: 'constelacao-metabolica',
    title: 'Constelação Metabólica',
    description: 'Quatorze dias consecutivos de jejum dentro da meta.',
    icon: '🌟',
    tierLabel: '14 Dias',
    requirementType: 'streak-days',
    requirementValue: 14,
    tint: 'tertiary',
  },
]

function metricFor(
  requirementType: AchievementRequirementType,
  stats: AchievementStats,
): number {
  switch (requirementType) {
    case 'streak-days':
      return Math.max(stats.streak.current, stats.streak.record)
    case 'single-fast-hours':
      return stats.longestFastHours
    case 'total-fasts':
      return stats.totalFasts
    case 'goal-efficacy':
      return stats.goalEfficacyPercent
    case 'water-goal-days':
      return stats.waterGoalDays
  }
}

function remainingLabel(
  rule: AchievementRule,
  metric: number,
  unlocked: boolean,
): string {
  if (unlocked) {
    return 'Conquistada'
  }

  const missing = Math.max(0, rule.requirementValue - metric)

  switch (rule.requirementType) {
    case 'single-fast-hours':
      return `Faltam ${Math.ceil(missing)}h para desbloquear ${rule.requirementValue}h`
    case 'streak-days':
      return `Faltam ${Math.ceil(missing)} dias de sequência`
    case 'total-fasts':
      return `Faltam ${Math.ceil(missing)} jejuns`
    case 'water-goal-days':
      return `Faltam ${Math.ceil(missing)} dias de hidratação`
    case 'goal-efficacy':
      return `${Math.round(metric)}% de ${rule.requirementValue}%`
  }
}

export function evaluateAchievements(
  stats: AchievementStats,
): AchievementEvaluation[] {
  return ACHIEVEMENT_RULES.map((rule) => {
    const metric = metricFor(rule.requirementType, stats)
    const unlocked = metric >= rule.requirementValue
    const progressPercent = unlocked
      ? 100
      : Math.min(
          100,
          Math.max(0, Math.round((metric / rule.requirementValue) * 100)),
        )

    return {
      ...rule,
      unlocked,
      progressPercent,
      progressLabel: remainingLabel(rule, metric, unlocked),
    }
  }).sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
}
