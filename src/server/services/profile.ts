import type { Db } from '#/db/client'
import { listUnlockedAchievements } from '#/db/repositories/achievements'
import { listWeightLogs } from '#/db/repositories/logs'
import { findProtocolById } from '#/db/repositories/protocols'
import { listSessions } from '#/db/repositories/sessions'
import {
  computeEfficacy,
  computeStreak,
  longestFastHours,
} from '#/domain/stats'
import type { Profile, Protocol } from '#/domain/types'
import { weightProgress } from '#/domain/weight'
import type { WeightProgress } from '#/domain/weight'
import { ACHIEVEMENT_RULES } from '#/domain/achievements'

import { requireProfile } from './tenant'

export interface ProfileView {
  profile: Profile
  protocol: Protocol | null
  totals: {
    sessions: number
    hours: number
    streak: number
    record: number
    longestFastHours: number
    efficacyPercent: number
  }
  weight: WeightProgress | null
  achievements: {
    unlocked: number
    total: number
  }
}

export function buildProfileView(
  db: Db,
  profileId: number,
  now: Date,
): ProfileView {
  const profile = requireProfile(db, profileId)
  const sessions = listSessions(db, { profileId: profile.id, limit: 500 })
  const finished = sessions.filter((session) => session.status !== 'active')

  const hours = finished.reduce((total, session) => {
    const start = new Date(session.startedAt).getTime()
    const end = new Date(session.endedAt ?? session.startedAt).getTime()
    return total + (end - start) / 3_600_000
  }, 0)

  const streak = computeStreak(sessions, now)

  return {
    profile,
    protocol: profile.activeProtocolId
      ? findProtocolById(db, profile.activeProtocolId)
      : null,
    totals: {
      sessions: finished.length,
      hours: Math.round(hours),
      streak: streak.current,
      record: streak.record,
      longestFastHours: Math.round(longestFastHours(sessions, now) * 10) / 10,
      efficacyPercent: computeEfficacy(sessions, now).percent,
    },
    weight: weightProgress(
      listWeightLogs(db, { profileId: profile.id }),
      profile.targetWeightKg,
    ),
    achievements: {
      unlocked: listUnlockedAchievements(db, profile.id).length,
      total: ACHIEVEMENT_RULES.length,
    },
  }
}
