import type { Profile } from '#/domain/types'

import type { Db } from '#/db/client'
import { updateProfile } from '#/db/repositories/profile'
import type { ProfilePatch } from '#/db/repositories/profile'
import { updateActiveSessionTarget } from '#/db/repositories/sessions'

export type GoalChange = ProfilePatch

export function applyGoalChange(
  db: Db,
  profileId: number,
  patch: GoalChange,
): Profile {
  const updated = updateProfile(db, profileId, patch)

  if (patch.dailyTargetHours !== undefined) {
    updateActiveSessionTarget(db, profileId, updated.dailyTargetHours)
  }

  return updated
}
