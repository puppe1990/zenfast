import { PROTOCOL_CATALOG } from '#/domain/protocol-catalog'
import { EXPERT_TIPS } from '#/domain/tips-catalog'
import type { MoodLevel } from '#/domain/types'

import type { Db } from './client'
import { createDeterministicRandom } from './random'
import type { SeedRandom } from './random'
import { logMood, logWater, logWeight } from './repositories/logs'
import { activateProtocol, updateProfile } from './repositories/profile'
import { findProtocolBySlug, seedProtocols } from './repositories/protocols'
import { endSession, listSessions, startSession } from './repositories/sessions'
import { seedTips } from './repositories/tips'
import { unlockAchievement } from './repositories/achievements'
import { evaluateAchievements } from '#/domain/achievements'
import {
  computeEfficacy,
  computeStreak,
  longestFastHours,
  startOfDay,
} from '#/domain/stats'

export interface SeedOptions {
  profileId: number
  now?: Date
  days?: number
  seed?: number
  random?: SeedRandom
  reset?: boolean
}

export interface SeedSummary {
  sessions: number
  waterLogs: number
  moodLogs: number
  weightLogs: number
  achievementsUnlocked: number
}

const WATER_SERVING_SIZES = [250, 300, 500]
const MOOD_LADDER: MoodLevel[] = ['otima', 'alta', 'otima', 'media', 'alta']
const BREAK_FOODS = [
  'Caldo de ossos + Ovos mexidos',
  'Salmão grelhado com salada de folhas',
  'Iogurte natural com frutas vermelhas',
  'Frango grelhado, abacate e brócolis',
  'Tapioca de queijo com ovo e café puro',
]
const MOOD_NOTES = [
  'Alta energia & clareza mental',
  'Foco mental aguçado',
  'Disposição estável durante o jejum',
  'Leve cansaço no fim da manhã',
]
const PARTIAL_NOTES = [
  'Encerramento antecipado social',
  'Almoço de família fora do horário',
  'Treino intenso pediu energia antes do previsto',
]
const BALANCE_NOTES = [
  'Excelente recuperação celular mantida',
  'Boa adaptação, sem fome reativa',
  'Cetose leve sustentada com tranquilidade',
]

export function resetDatabase(db: Db, profileId: number): void {
  db.prepare<[number]>('delete from achievements where profile_id = ?').run(
    profileId,
  )
  db.prepare<[number]>('delete from fasting_sessions where profile_id = ?').run(
    profileId,
  )
  db.prepare<[number]>('delete from water_logs where profile_id = ?').run(
    profileId,
  )
  db.prepare<[number]>('delete from mood_logs where profile_id = ?').run(
    profileId,
  )
  db.prepare<[number]>('delete from weight_logs where profile_id = ?').run(
    profileId,
  )
}

export function seedDatabase(db: Db, options: SeedOptions): SeedSummary {
  const now = options.now ?? new Date()
  const days = options.days ?? 45
  const random = options.random ?? createDeterministicRandom(options.seed ?? 42)

  seedProtocols(db, PROTOCOL_CATALOG)
  seedTips(db, EXPERT_TIPS)

  const protocol =
    findProtocolBySlug(db, '16-8-diario') ??
    findProtocolBySlug(db, PROTOCOL_CATALOG[0].slug)
  if (!protocol) {
    throw new Error('Protocol catalog is empty')
  }

  const profile = updateProfile(db, options.profileId, {
    waterGoalMl: 2500,
    startWeightKg: 76.5,
    targetWeightKg: 71.5,
  })
  activateProtocol(db, profile.id, protocol.id)

  if (options.reset) {
    resetDatabase(db, profile.id)
  }

  let sessions = 0
  let waterLogs = 0
  let moodLogs = 0
  let weightLogs = 0

  for (let offset = days; offset >= 0; offset -= 1) {
    const day = startOfDay(new Date(now.getTime() - offset * 86_400_000))
    const isToday = offset === 0

    if (isToday) {
      startSession(db, {
        profileId: profile.id,
        protocolId: protocol.id,
        startedAt: new Date(now.getTime() - (14 * 3600 + 25 * 60 + 41) * 1000),
        targetHours: profile.dailyTargetHours,
      })
      sessions += 1
    } else if (random.float(0, 1) > 0.04) {
      const startHour = random.float(19.5, 21)
      const startedAt = new Date(day.getTime() + (startHour - 24) * 3_600_000)
      const missedTarget = random.float(0, 1) > 0.88
      const duration = missedTarget
        ? random.float(14.6, 15.9)
        : random.float(16, 18.6)
      const targetMet = duration >= profile.dailyTargetHours

      const session = startSession(db, {
        profileId: profile.id,
        protocolId: protocol.id,
        startedAt,
        targetHours: profile.dailyTargetHours,
      })

      endSession(db, session.id, {
        endedAt: new Date(startedAt.getTime() + duration * 3_600_000),
        breakFood:
          targetMet && random.boolean(0.5) ? random.pick(BREAK_FOODS) : null,
        moodNote:
          targetMet && random.boolean(0.6) ? random.pick(MOOD_NOTES) : null,
        notes: targetMet
          ? random.pick(BALANCE_NOTES)
          : random.pick(PARTIAL_NOTES),
      })
      sessions += 1
    }

    const servings = random.int(isToday ? 5 : 4, isToday ? 7 : 11)
    for (let index = 0; index < servings; index += 1) {
      const hour = random.float(7, isToday ? Math.max(8, now.getHours()) : 21)
      logWater(db, {
        amountMl: random.pick(WATER_SERVING_SIZES),
        loggedAt: new Date(day.getTime() + hour * 3_600_000),
        profileId: profile.id,
      })
      waterLogs += 1
    }

    logMood(db, {
      level: random.pick(MOOD_LADDER),
      note: random.boolean(0.7) ? random.pick(MOOD_NOTES) : null,
      loggedAt: new Date(day.getTime() + 9.5 * 3_600_000),
      profileId: profile.id,
    })
    moodLogs += 1

    if (offset % 3 === 0 || isToday) {
      const progress = 1 - offset / Math.max(days, 1)
      logWeight(db, {
        weightKg: Number(
          (76.5 - 2.8 * progress + random.float(-0.25, 0.25)).toFixed(1),
        ),
        loggedAt: new Date(day.getTime() + 8.25 * 3_600_000),
        profileId: profile.id,
      })
      weightLogs += 1
    }
  }

  const history = listSessions(db, { profileId: profile.id, limit: 500 })
  const achievements = evaluateAchievements({
    streak: computeStreak(history, now),
    longestFastHours: longestFastHours(history, now),
    totalFasts: history.filter((session) => session.status !== 'active').length,
    goalEfficacyPercent: computeEfficacy(history, now).percent,
    waterGoalDays: days,
  })

  let achievementsUnlocked = 0
  for (const achievement of achievements) {
    if (achievement.unlocked) {
      unlockAchievement(db, achievement.slug, {
        unlockedAt: history[0] ? new Date(history[0].startedAt) : now,
        profileId: profile.id,
      })
      achievementsUnlocked += 1
    }
  }

  return {
    sessions,
    waterLogs,
    moodLogs,
    weightLogs,
    achievementsUnlocked,
  }
}
