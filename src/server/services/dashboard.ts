import { computeFastingProgress } from '#/domain/fasting'
import type { FastingProgress } from '#/domain/fasting'
import { hydrationProgress } from '#/domain/hydration'
import type { HydrationProgress } from '#/domain/hydration'
import {
  cycleCompletionPercent,
  stageForElapsedHours,
  stageIndexForElapsedHours,
} from '#/domain/metabolic'
import type { MetabolicStage } from '#/domain/metabolic'
import { moodOption } from '#/domain/mood'
import { shiftWindow } from '#/domain/protocol-catalog'
import { computeStreak, startOfDay, todayHours } from '#/domain/stats'
import type {
  FastingSession,
  MoodLevel,
  Profile,
  Protocol,
} from '#/domain/types'

import type { Db } from '#/db/client'

import { requireProfile } from './tenant'
import { latestMood, listWaterLogs, waterTotal } from '#/db/repositories/logs'
import {
  findProtocolById,
  findProtocolBySlug,
  listProtocols,
} from '#/db/repositories/protocols'
import { findActiveSession, listSessions } from '#/db/repositories/sessions'

export interface DashboardMood {
  level: MoodLevel
  label: string
  emoji: string
  note: string | null
  loggedAt: string
}

export interface DashboardView {
  now: string
  profile: Profile
  protocol: Protocol
  activeSession: FastingSession | null
  progress: FastingProgress | null
  goalHours: number
  timerTargetHours: number
  stage: MetabolicStage
  stageIndex: number
  cyclePercent: number
  hydration: HydrationProgress & { lastLogAt: string | null }
  mood: DashboardMood | null
  nextWindow: {
    startLabel: string
    endLabel: string
    durationHours: number
  }
  streakDays: number
  todayHours: number
}

export function buildDashboard(
  db: Db,
  profileId: number,
  now: Date,
): DashboardView {
  const profile = requireProfile(db, profileId)
  const protocol =
    (profile.activeProtocolId
      ? findProtocolById(db, profile.activeProtocolId)
      : null) ??
    findProtocolBySlug(db, '16-8-diario') ??
    listProtocols(db)[0]

  const activeSession = findActiveSession(db, profile.id)
  const progress = activeSession
    ? computeFastingProgress(
        activeSession.startedAt,
        activeSession.targetHours,
        now,
      )
    : null

  const elapsedHours = progress?.elapsedHours ?? 0
  const stage = stageForElapsedHours(elapsedHours)

  const dayStart = startOfDay(now)
  const dayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  )
  const waterLogs = listWaterLogs(db, {
    profileId: profile.id,
    since: dayStart,
    until: dayEnd,
  })
  const consumedMl = waterTotal(db, {
    profileId: profile.id,
    since: dayStart,
    until: dayEnd,
  })

  const moodLog = latestMood(db, profile.id)
  const mood = moodLog
    ? {
        level: moodLog.level,
        label: moodOption(moodLog.level).label,
        emoji: moodOption(moodLog.level).emoji,
        note: moodLog.note,
        loggedAt: moodLog.loggedAt,
      }
    : null

  const goalHours = profile.dailyTargetHours
  const eatingHours = Math.max(0, 24 - goalHours)
  const windowStart = progress?.targetTimeLabel ?? protocol.suggestedWindowStart

  return {
    now: now.toISOString(),
    profile,
    protocol,
    activeSession,
    progress,
    goalHours,
    timerTargetHours: progress?.targetHours ?? goalHours,
    stage,
    stageIndex: stageIndexForElapsedHours(elapsedHours),
    cyclePercent: progress
      ? cycleCompletionPercent(progress.elapsedHours, progress.targetHours)
      : 0,
    hydration: {
      ...hydrationProgress(consumedMl, profile.waterGoalMl),
      lastLogAt: waterLogs[0]?.loggedAt ?? null,
    },
    mood,
    nextWindow: {
      startLabel: windowStart,
      endLabel: shiftWindow(windowStart, eatingHours),
      durationHours: eatingHours,
    },
    streakDays: computeStreak(listSessions(db, { profileId: profile.id }), now)
      .current,
    todayHours: todayHours(listSessions(db, { profileId: profile.id }), now),
  }
}
