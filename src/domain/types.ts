export type ProtocolCategory =
  'iniciante' | 'intermediario' | 'avancado' | 'personalizado'

export type MetabolicTone =
  'primary' | 'secondary' | 'tertiary' | 'error' | 'neutral'

export type SessionStatus = 'active' | 'completed' | 'partial'

export type MoodLevel = 'baixa' | 'media' | 'alta' | 'otima'

export interface Biomarker {
  icon: string
  label: string
  value: string
  tone: MetabolicTone
}

export interface Protocol {
  id: number
  slug: string
  name: string
  method: string
  category: ProtocolCategory
  tagline: string | null
  description: string
  fastingHours: number
  eatingHours: number
  badgeLabel: string | null
  badgeTone: MetabolicTone
  suggestedWindowStart: string
  suggestedWindowEnd: string
  biomarkers: Biomarker[]
  popularity: number
}

export interface FastingSession {
  id: number
  protocolId: number
  startedAt: string
  endedAt: string | null
  targetHours: number
  status: SessionStatus
  breakFood: string | null
  moodNote: string | null
  notes: string | null
}

export interface WaterLog {
  id: number
  loggedAt: string
  amountMl: number
}

export interface MoodLog {
  id: number
  loggedAt: string
  level: MoodLevel
  note: string | null
}

export interface WeightLog {
  id: number
  loggedAt: string
  weightKg: number
}

export interface Profile {
  id: number
  name: string
  email: string | null
  isGuest: boolean
  avatarSeed: string | null
  activeProtocolId: number | null
  dailyTargetHours: number
  waterGoalMl: number
  startWeightKg: number | null
  targetWeightKg: number | null
  createdAt: string
}

export type AchievementRequirementType =
  | 'streak-days'
  | 'single-fast-hours'
  | 'total-fasts'
  | 'goal-efficacy'
  | 'water-goal-days'

export interface Achievement {
  id: number
  slug: string
  title: string
  description: string
  icon: string
  tierLabel: string
  requirementType: AchievementRequirementType
  requirementValue: number
  unlockedAt: string | null
}

export interface Tip {
  id: number
  title: string
  body: string
}
