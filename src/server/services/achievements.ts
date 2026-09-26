import { evaluateAchievements } from '#/domain/achievements'
import type {
  AchievementEvaluation,
  AchievementStats,
} from '#/domain/achievements'
import {
  startOfDay,
  computeEfficacy,
  computeStreak,
  longestFastHours,
} from '#/domain/stats'

import type { Db } from '#/db/client'
import {
  listUnlockedAchievements,
  unlockAchievement,
} from '#/db/repositories/achievements'
import { listWaterLogs } from '#/db/repositories/logs'
import { listSessions } from '#/db/repositories/sessions'

export interface AchievementTimelineEntry extends AchievementEvaluation {
  unlockedAt: string | null
}

export function computeAchievementStats(
  db: Db,
  profileId: number,
  now: Date,
): AchievementStats {
  const sessions = listSessions(db, { profileId, limit: 500 })
  const waterLogs = listWaterLogs(db, { profileId, limit: 2000 })
  const waterByDay = new Map<string, number>()

  for (const log of waterLogs) {
    const key = startOfDay(new Date(log.loggedAt)).toDateString()
    waterByDay.set(key, (waterByDay.get(key) ?? 0) + log.amountMl)
  }

  const profile = db
    .prepare<[number], { water_goal_ml: number }>(
      'select water_goal_ml from profiles where id = ?',
    )
    .get(profileId)

  const waterGoalDays = [...waterByDay.values()].filter(
    (total) => total >= (profile?.water_goal_ml ?? 2500),
  ).length

  return {
    streak: computeStreak(sessions, now),
    longestFastHours: longestFastHours(sessions, now),
    totalFasts: sessions.filter((session) => session.status !== 'active')
      .length,
    goalEfficacyPercent: computeEfficacy(sessions, now).percent,
    waterGoalDays,
  }
}

export function achievementTimeline(
  db: Db,
  profileId: number,
  now: Date,
): AchievementTimelineEntry[] {
  const stats = computeAchievementStats(db, profileId, now)
  const unlockedDates = new Map(
    listUnlockedAchievements(db, profileId).map((entry) => [
      entry.slug,
      entry.unlockedAt,
    ]),
  )

  return evaluateAchievements(stats).map((achievement) => ({
    ...achievement,
    unlockedAt: unlockedDates.get(achievement.slug) ?? null,
  }))
}

export function syncAchievements(
  db: Db,
  profileId: number,
  now: Date = new Date(),
): string[] {
  const stats = computeAchievementStats(db, profileId, now)

  return evaluateAchievements(stats)
    .filter((achievement) => achievement.unlocked)
    .filter((achievement) =>
      unlockAchievement(db, achievement.slug, { profileId, unlockedAt: now }),
    )
    .map((achievement) => achievement.slug)
}
