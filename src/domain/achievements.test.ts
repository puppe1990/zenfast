import { describe, expect, it } from 'vitest'

import { ACHIEVEMENT_RULES, evaluateAchievements } from './achievements'
import type { AchievementStats } from './achievements'

const baseStats: AchievementStats = {
  streak: { current: 0, record: 0 },
  longestFastHours: 0,
  totalFasts: 0,
  goalEfficacyPercent: 0,
  waterGoalDays: 0,
}

describe('ACHIEVEMENT_RULES', () => {
  it('ships the twelve badges mapped from the design', () => {
    expect(ACHIEVEMENT_RULES).toHaveLength(12)
    expect(ACHIEVEMENT_RULES.map((rule) => rule.slug)).toContain(
      'pioneiro-do-jejum',
    )
    expect(ACHIEVEMENT_RULES.map((rule) => rule.slug)).toContain(
      'fogo-metabolico',
    )
    expect(ACHIEVEMENT_RULES.map((rule) => rule.slug)).toContain(
      'mestre-da-cetose',
    )
    expect(ACHIEVEMENT_RULES.map((rule) => rule.slug)).toContain(
      'autofagia-nivel-1',
    )
  })
})

describe('evaluateAchievements', () => {
  it('unlocks a badge when the requirement is met', () => {
    const stats: AchievementStats = {
      ...baseStats,
      totalFasts: 1,
      longestFastHours: 16,
    }
    const pioneer = evaluateAchievements(stats).find(
      (achievement) => achievement.slug === 'pioneiro-do-jejum',
    )

    expect(pioneer?.unlocked).toBe(true)
    expect(pioneer?.progressPercent).toBe(100)
  })

  it('reports partial progress towards the autophagy badge', () => {
    const stats: AchievementStats = { ...baseStats, longestFastHours: 20 }
    const autophagy = evaluateAchievements(stats).find(
      (achievement) => achievement.slug === 'autofagia-nivel-1',
    )

    expect(autophagy?.unlocked).toBe(false)
    expect(autophagy?.progressPercent).toBe(83)
    expect(autophagy?.progressLabel).toBe('Faltam 4h para desbloquear 24h')
  })

  it('tracks the seven day streak badge', () => {
    const stats: AchievementStats = {
      ...baseStats,
      streak: { current: 7, record: 9 },
    }
    const fire = evaluateAchievements(stats).find(
      (achievement) => achievement.slug === 'fogo-metabolico',
    )

    expect(fire?.unlocked).toBe(true)
  })

  it('keeps badges locked when stats are empty', () => {
    const evaluated = evaluateAchievements(baseStats)

    expect(evaluated.every((achievement) => !achievement.unlocked)).toBe(true)
    expect(
      evaluated.every((achievement) => achievement.progressPercent === 0),
    ).toBe(true)
  })

  it('orders unlocked badges first', () => {
    const stats: AchievementStats = {
      ...baseStats,
      totalFasts: 30,
      longestFastHours: 24,
    }
    const evaluated = evaluateAchievements(stats)

    const firstLocked = evaluated.findIndex(
      (achievement) => !achievement.unlocked,
    )
    const lastUnlocked = evaluated.map((a) => a.unlocked).lastIndexOf(true)

    expect(lastUnlocked).toBeLessThan(firstLocked)
  })
})
