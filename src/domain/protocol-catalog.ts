import type { Protocol } from './types'

export type ProtocolSeed = Omit<Protocol, 'id'>

export const CUSTOM_PROTOCOL_BOUNDS = {
  minFastingHours: 12,
  maxFastingHours: 23,
} as const

export const PROTOCOL_CATALOG: ProtocolSeed[] = [
  {
    slug: '16-8-diario',
    name: '16:8 Diário',
    method: 'Leangains',
    category: 'iniciante',
    tagline: 'Mais Popular',
    description:
      '16h de jejum, janela alimentar de 8h (ex: 12:00 às 20:00). Ideal para queima sustentável de gordura e clareza mental estável.',
    fastingHours: 16,
    eatingHours: 8,
    badgeLabel: 'Fácil de manter',
    badgeTone: 'neutral',
    suggestedWindowStart: '12:00',
    suggestedWindowEnd: '20:00',
    popularity: 100,
    biomarkers: [
      { icon: 'psychology', label: 'Foco', value: 'Elevado', tone: 'primary' },
      { icon: 'bolt', label: 'Insulina', value: 'Sensível', tone: 'secondary' },
      {
        icon: 'autorenew',
        label: 'Autofagia',
        value: 'Moderada',
        tone: 'tertiary',
      },
    ],
  },
  {
    slug: '14-10-suave',
    name: '14:10 Suave',
    method: 'Circadiano',
    category: 'iniciante',
    tagline: 'Iniciante',
    description:
      '14h de jejum, 10h de janela. Transição suave para quem está começando hoje e deseja regular ciclos circadianos.',
    fastingHours: 14,
    eatingHours: 10,
    badgeLabel: 'Transição Natural',
    badgeTone: 'secondary',
    suggestedWindowStart: '10:00',
    suggestedWindowEnd: '20:00',
    popularity: 80,
    biomarkers: [
      { icon: 'bedtime', label: 'Sono', value: 'Otimizado', tone: 'secondary' },
      { icon: 'restaurant', label: 'Digestão', value: 'Leve', tone: 'primary' },
      {
        icon: 'trending_up',
        label: 'Esforço',
        value: 'Baixo',
        tone: 'neutral',
      },
    ],
  },
  {
    slug: '18-6-avancado',
    name: '18:6 Avançado',
    method: 'Queima Intensa',
    category: 'intermediario',
    tagline: 'Intermediário',
    description:
      '18h de jejum, 6h de alimentação. Maximize a autofagia celular, cetose prolongada e queima de gordura obstinada.',
    fastingHours: 18,
    eatingHours: 6,
    badgeLabel: 'Queima Intensa',
    badgeTone: 'primary',
    suggestedWindowStart: '13:00',
    suggestedWindowEnd: '19:00',
    popularity: 70,
    biomarkers: [
      {
        icon: 'autorenew',
        label: 'Autofagia',
        value: 'Ativa',
        tone: 'tertiary',
      },
      {
        icon: 'local_fire_department',
        label: 'Cetose',
        value: 'Intensa',
        tone: 'primary',
      },
      {
        icon: 'offline_bolt',
        label: 'Insulina',
        value: 'Minimizada',
        tone: 'secondary',
      },
    ],
  },
  {
    slug: '20-4-guerreiro',
    name: '20:4 A Dieta do Guerreiro',
    method: 'Warrior Diet',
    category: 'avancado',
    tagline: 'Avançado',
    description:
      '20h de jejum com 1 refeição principal farta na janela de 4h. Reparo mitocondrial profundo e estímulo da longevidade.',
    fastingHours: 20,
    eatingHours: 4,
    badgeLabel: 'Reparo Celular',
    badgeTone: 'neutral',
    suggestedWindowStart: '16:00',
    suggestedWindowEnd: '20:00',
    popularity: 40,
    biomarkers: [
      { icon: 'verified', label: 'Autofagia', value: 'Pico', tone: 'tertiary' },
      {
        icon: 'shield',
        label: 'Imunidade',
        value: 'Regenerativa',
        tone: 'primary',
      },
      { icon: 'speed', label: 'Dificuldade', value: 'Alta', tone: 'error' },
    ],
  },
  {
    slug: 'omad-23-1',
    name: 'OMAD (Uma Refeição por Dia)',
    method: 'OMAD',
    category: 'avancado',
    tagline: 'Extremo',
    description:
      '23h de jejum rigoroso com 1 hora para alimentação altamente nutritiva e balanceada. Disciplina metabólica máxima.',
    fastingHours: 23,
    eatingHours: 1,
    badgeLabel: 'Biohacking',
    badgeTone: 'neutral',
    suggestedWindowStart: '19:00',
    suggestedWindowEnd: '20:00',
    popularity: 20,
    biomarkers: [
      {
        icon: 'strikethrough_s',
        label: 'Rejuvenescimento',
        value: 'Profundo',
        tone: 'error',
      },
      { icon: 'psychology', label: 'Clareza', value: 'Laser', tone: 'primary' },
      {
        icon: 'warning',
        label: 'Adaptação',
        value: 'Exigente',
        tone: 'neutral',
      },
    ],
  },
]

export function buildCustomProtocol(
  fastingHours: number,
  windowStart: string,
): ProtocolSeed {
  const clampedFasting = Math.min(
    CUSTOM_PROTOCOL_BOUNDS.maxFastingHours,
    Math.max(CUSTOM_PROTOCOL_BOUNDS.minFastingHours, Math.round(fastingHours)),
  )
  const eatingHours = 24 - clampedFasting

  return {
    slug: `personalizado-${clampedFasting}-${windowStart.replace(':', '')}`,
    name: `Personalizado ${clampedFasting}:${eatingHours}`,
    method: 'Protocolo Personalizado',
    category: 'personalizado',
    tagline: 'Sob medida',
    description: `${clampedFasting}h de jejum e ${eatingHours}h de janela ajustadas ao seu ritmo de treinos e rotina.`,
    fastingHours: clampedFasting,
    eatingHours,
    badgeLabel: 'Sob medida',
    badgeTone: 'primary',
    suggestedWindowStart: windowStart,
    suggestedWindowEnd: shiftWindow(windowStart, eatingHours),
    popularity: 10,
    biomarkers: [
      {
        icon: 'tune',
        label: 'Janela',
        value: `${eatingHours}h para comer`,
        tone: 'primary',
      },
      {
        icon: 'bolt',
        label: 'Insulina',
        value: clampedFasting >= 18 ? 'Minimizada' : 'Sensível',
        tone: 'secondary',
      },
      {
        icon: 'autorenew',
        label: 'Autofagia',
        value:
          clampedFasting >= 18
            ? 'Ativa'
            : clampedFasting >= 16
              ? 'Moderada'
              : 'Leve',
        tone: 'tertiary',
      },
    ],
  }
}

export function shiftWindow(start: string, durationHours: number): string {
  const [hours, minutes] = start.split(':').map(Number)
  const total = (hours + durationHours) % 24
  const normalized = (total + 24) % 24

  return `${String(normalized).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`
}
