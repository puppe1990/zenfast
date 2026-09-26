import type { Db } from '../client'
import { getProfile } from './profile'

interface AchievementRow {
  slug: string
  unlocked_at: string
}

export interface UnlockInput {
  unlockedAt: Date
  profileId?: number
}

export function unlockAchievement(
  db: Db,
  slug: string,
  input: UnlockInput,
): void {
  const profileId = input.profileId ?? getProfile(db).id

  db.prepare<[number, string, string]>(
    `insert into achievements (profile_id, slug, unlocked_at)
     values (?, ?, ?)
     on conflict (profile_id, slug) do nothing`,
  ).run(profileId, slug, input.unlockedAt.toISOString())
}

export function listUnlockedAchievements(
  db: Db,
  profileId?: number,
): Array<{ slug: string; unlockedAt: string }> {
  const rows = profileId
    ? db
        .prepare<[number], AchievementRow>(
          'select slug, unlocked_at from achievements where profile_id = ? order by unlocked_at asc',
        )
        .all(profileId)
    : db
        .prepare<[], AchievementRow>(
          'select slug, unlocked_at from achievements order by unlocked_at asc',
        )
        .all()

  return rows.map((row) => ({ slug: row.slug, unlockedAt: row.unlocked_at }))
}
