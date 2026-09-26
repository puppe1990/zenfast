import type { Db } from '../client'

interface AchievementRow {
  slug: string
  unlocked_at: string
}

export interface UnlockInput {
  unlockedAt: Date
  profileId: number
}

export function unlockAchievement(
  db: Db,
  slug: string,
  input: UnlockInput,
): boolean {
  const result = db
    .prepare<[number, string, string]>(
      `insert into achievements (profile_id, slug, unlocked_at)
     values (?, ?, ?)
     on conflict (profile_id, slug) do nothing`,
    )
    .run(input.profileId, slug, input.unlockedAt.toISOString())

  return result.changes > 0
}

export function listUnlockedAchievements(
  db: Db,
  profileId: number,
): Array<{ slug: string; unlockedAt: string }> {
  return db
    .prepare<[number], AchievementRow>(
      'select slug, unlocked_at from achievements where profile_id = ? order by unlocked_at asc',
    )
    .all(profileId)
    .map((row) => ({ slug: row.slug, unlockedAt: row.unlocked_at }))
}
