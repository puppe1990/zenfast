import { evaluateAchievements } from '#/domain/achievements'
import type { AchievementEvaluation } from '#/domain/achievements'
import { fastingDurationHours, sessionMeetsGoal } from '#/domain/fasting'
import {
  formatDateLabel,
  formatDurationFromHours,
  formatTime,
  formatWaterLiters,
} from '#/domain/format'
import { stageForElapsedHours } from '#/domain/metabolic'
import {
  averageHours,
  computeEfficacy,
  computeStreak,
  longestFastHours,
  monthlyHours,
  sessionEndDate,
  startOfDay,
  weeklyBars,
} from '#/domain/stats'
import type {
  Efficacy,
  MonthlyHours,
  StreakStats,
  WeekBar,
} from '#/domain/stats'
import type { FastingSession } from '#/domain/types'
import { weightProgress } from '#/domain/weight'
import type { WeightProgress } from '#/domain/weight'

import type { Db } from '#/db/client'
import { listWaterLogs, listWeightLogs } from '#/db/repositories/logs'
import { getProfile } from '#/db/repositories/profile'
import { listSessions } from '#/db/repositories/sessions'

export type DetailTone =
  'on-surface' | 'on-surface-variant' | 'primary' | 'secondary' | 'tertiary'

export interface HistoryDetail {
  label: string
  value: string
  tone: DetailTone
}

export interface HistoryEntry {
  id: number
  dateLabel: string
  statusLabel: string
  statusTone: DetailTone
  durationLabel: string
  startedAtLabel: string
  endedAtLabel: string
  details: HistoryDetail[]
}

export interface ProgressView {
  now: string
  streak: StreakStats
  monthly: MonthlyHours
  efficacy: Efficacy
  weekBars: WeekBar[]
  averageHours: number
  averageDelta: number
  insightVerdict: string
  targetHours: number
  waterGoalDays: number
  weight: WeightProgress | null
  targetWeightKg: number | null
  achievements: AchievementEvaluation[]
  unlockedCount: number
  totalAchievements: number
  history: HistoryEntry[]
}

function statusFor(session: FastingSession, now: Date) {
  const hours = fastingDurationHours(session, now)

  if (!sessionMeetsGoal(session, now)) {
    return { label: 'Parcial', tone: 'on-surface-variant' as DetailTone }
  }

  if (hours >= session.targetHours + 2) {
    return {
      label: `${Math.floor(hours)}h Recorde`,
      tone: 'tertiary' as DetailTone,
    }
  }

  return {
    label: `${session.targetHours}:${24 - session.targetHours} Atingido`,
    tone: 'secondary' as DetailTone,
  }
}

function historyDetails(
  session: FastingSession,
  now: Date,
  waterByDay: Map<string, number>,
): HistoryDetail[] {
  const details: HistoryDetail[] = []
  const hours = fastingDurationHours(session, now)
  const end = sessionEndDate(session, now)
  const dayKey = end.toDateString()
  const water = waterByDay.get(dayKey) ?? 0

  details.push({
    label: 'Fase Atingida',
    value: stageForElapsedHours(hours).badge,
    tone: 'tertiary',
  })

  if (hours >= 8) {
    const peakEnd = Math.min(hours, 14)
    details.push({
      label: 'Pico de Queima de Gordura',
      value: `8h às ${Math.round(peakEnd)}h (${Math.round(peakEnd - 8)}h ativas)`,
      tone: 'primary',
    })
  }

  if (water > 0) {
    details.push({
      label: 'Hidratação Registrada',
      value: `${formatWaterLiters(water)} de água pura`,
      tone: 'on-surface',
    })
  }

  if (session.breakFood) {
    details.push({
      label: 'Quebra de Jejum',
      value: session.breakFood,
      tone: 'on-surface',
    })
  }

  if (session.moodNote) {
    details.push({
      label: 'Sensação Somática',
      value: session.moodNote,
      tone: 'secondary',
    })
  }

  if (session.notes) {
    details.push(
      sessionMeetsGoal(session, now)
        ? { label: 'Balanço', value: session.notes, tone: 'primary' }
        : {
            label: 'Meta Pretendida',
            value: session.notes,
            tone: 'on-surface-variant',
          },
    )
  }

  return details
}

export function buildProgressView(db: Db, now: Date): ProgressView {
  const profile = getProfile(db)
  const sessions = listSessions(db, { profileId: profile.id, limit: 200 })
  const targetHours = profile.dailyTargetHours
  const bars = weeklyBars(sessions, now, targetHours)
  const average = averageHours(bars)

  const waterLogs = listWaterLogs(db, { profileId: profile.id, limit: 2000 })
  const waterByDay = new Map<string, number>()
  for (const log of waterLogs) {
    const key = startOfDay(new Date(log.loggedAt)).toDateString()
    waterByDay.set(key, (waterByDay.get(key) ?? 0) + log.amountMl)
  }

  const waterGoalDays = [...waterByDay.values()].filter(
    (total) => total >= profile.waterGoalMl,
  ).length

  const efficacy = computeEfficacy(sessions, now)
  const streak = computeStreak(sessions, now)
  const longest = longestFastHours(sessions, now)

  const achievements = evaluateAchievements({
    streak,
    longestFastHours: longest,
    totalFasts: sessions.filter((session) => session.status !== 'active')
      .length,
    goalEfficacyPercent: efficacy.percent,
    waterGoalDays,
  })

  const history = sessions
    .filter((session) => session.status !== 'active')
    .slice(0, 20)
    .map((session) => {
      const end = sessionEndDate(session, now)
      const status = statusFor(session, now)
      const hours = fastingDurationHours(session, now)

      return {
        id: session.id,
        dateLabel: formatDateLabel(end, now),
        statusLabel: status.label,
        statusTone: status.tone,
        durationLabel: formatDurationFromHours(hours),
        startedAtLabel: formatTime(session.startedAt),
        endedAtLabel: session.endedAt ? formatTime(session.endedAt) : '--:--',
        details: historyDetails(session, now, waterByDay),
      } satisfies HistoryEntry
    })

  return {
    now: now.toISOString(),
    streak,
    monthly: monthlyHours(sessions, now),
    efficacy,
    weekBars: bars,
    averageHours: average,
    averageDelta: Math.round((average - targetHours) * 10) / 10,
    insightVerdict: average >= targetHours ? 'Ótimo' : 'Atenção',
    targetHours,
    waterGoalDays,
    weight: weightProgress(
      listWeightLogs(db, { profileId: profile.id }),
      profile.targetWeightKg,
    ),
    targetWeightKg: profile.targetWeightKg,
    achievements,
    unlockedCount: achievements.filter((achievement) => achievement.unlocked)
      .length,
    totalAchievements: achievements.length,
    history,
  }
}
