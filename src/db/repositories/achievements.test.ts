import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '../client'
import { createTestDb, testProfile } from '../testing/helpers'
import { listUnlockedAchievements, unlockAchievement } from './achievements'

describe('achievements repository', () => {
  let db: Db
  let profileId: number

  beforeEach(() => {
    db = createTestDb()
    profileId = testProfile(db).id
  })

  it('unlocks a badge with its timestamp', () => {
    unlockAchievement(db, 'pioneiro-do-jejum', {
      unlockedAt: new Date(2026, 1, 20, 12, 0),
    })

    const unlocked = listUnlockedAchievements(db)

    expect(unlocked).toHaveLength(1)
    expect(unlocked[0].slug).toBe('pioneiro-do-jejum')
    expect(new Date(unlocked[0].unlockedAt).getTime()).toBe(
      new Date(2026, 1, 20, 12, 0).getTime(),
    )
  })

  it('keeps the first unlock date when called twice', () => {
    unlockAchievement(db, 'fogo-metabolico', {
      unlockedAt: new Date(2026, 1, 20, 12, 0),
    })
    unlockAchievement(db, 'fogo-metabolico', {
      unlockedAt: new Date(2026, 1, 25, 12, 0),
    })

    expect(listUnlockedAchievements(db)).toHaveLength(1)
    expect(new Date(listUnlockedAchievements(db)[0].unlockedAt).getTime()).toBe(
      new Date(2026, 1, 20, 12, 0).getTime(),
    )
  })

  it('scopes the unlock list to the profile', () => {
    unlockAchievement(db, 'mestre-da-cetose', {
      unlockedAt: new Date(2026, 1, 20, 12, 0),
      profileId,
    })

    expect(listUnlockedAchievements(db, profileId)).toHaveLength(1)
    expect(listUnlockedAchievements(db, 999)).toHaveLength(0)
  })
})
