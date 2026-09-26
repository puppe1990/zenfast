import type { MetabolicTone } from './types'

export type MetabolicStageId =
  'digestao' | 'insulina-baixa' | 'gordura' | 'cetose' | 'autofagia'

export interface MetabolicStage {
  id: MetabolicStageId
  label: string
  rangeLabel: string
  startsAtHour: number
  endsAtHour: number | null
  icon: string
  badge: string
  title: string
  description: string
  tone: MetabolicTone
}

export const METABOLIC_STAGES: MetabolicStage[] = [
  {
    id: 'digestao',
    label: 'Digestão',
    rangeLabel: '0 - 4h',
    startsAtHour: 0,
    endsAtHour: 4,
    icon: 'restaurant',
    badge: 'Glicogênio Residual',
    title: 'Digestão em Andamento',
    description:
      'Seu corpo processa a última refeição e mantém a glicose estável para as atividades do dia.',
    tone: 'neutral',
  },
  {
    id: 'insulina-baixa',
    label: 'Insulina Baixa',
    rangeLabel: '4 - 8h',
    startsAtHour: 4,
    endsAtHour: 8,
    icon: 'bolt',
    badge: 'Transição Metabólica',
    title: 'Insulina em Queda',
    description:
      'A insulina recua e o organismo começa a mobilizar as reservas de energia armazenadas.',
    tone: 'secondary',
  },
  {
    id: 'gordura',
    label: 'Gordura',
    rangeLabel: '8 - 14h',
    startsAtHour: 8,
    endsAtHour: 14,
    icon: 'local_fire_department',
    badge: 'Lipólise Alta',
    title: 'Queima Acelerada de Gordura',
    description:
      'Glicogênio hepático esgotado. Seu metabolismo migrou primariamente para oxidação de ácidos graxos livres.',
    tone: 'primary',
  },
  {
    id: 'cetose',
    label: 'Cetose',
    rangeLabel: '14 - 16h',
    startsAtHour: 14,
    endsAtHour: 16,
    icon: 'bolt',
    badge: 'Cetose Ativa',
    title: 'Produção de Corpos Cetônicos',
    description:
      'O fígado converte ácidos graxos em cetonas, combustível cerebral de alta eficiência.',
    tone: 'tertiary',
  },
  {
    id: 'autofagia',
    label: 'Autofagia',
    rangeLabel: '16h+',
    startsAtHour: 16,
    endsAtHour: null,
    icon: 'autorenew',
    badge: 'Autofagia Ativa',
    title: 'Renovação Celular Profunda',
    description:
      'Reciclagem de proteínas danificadas e estímulo à longevidade celular. Zona de reparo máximo.',
    tone: 'tertiary',
  },
]

export function stageForElapsedHours(elapsedHours: number): MetabolicStage {
  if (!Number.isFinite(elapsedHours) || elapsedHours < 0) {
    return METABOLIC_STAGES[0]
  }

  return (
    METABOLIC_STAGES.find(
      (stage) =>
        elapsedHours >= stage.startsAtHour &&
        (stage.endsAtHour === null || elapsedHours < stage.endsAtHour),
    ) ?? METABOLIC_STAGES[METABOLIC_STAGES.length - 1]
  )
}

export function stageIndexForElapsedHours(elapsedHours: number): number {
  return METABOLIC_STAGES.indexOf(stageForElapsedHours(elapsedHours))
}

export function cycleCompletionPercent(
  elapsedHours: number,
  targetHours: number,
): number {
  if (targetHours <= 0) {
    return 0
  }

  return Math.min(100, Math.round((elapsedHours / targetHours) * 100))
}
