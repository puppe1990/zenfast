import type { Profile } from '#/domain/types'

import type { Db } from '#/db/client'
import { findProfileById } from '#/db/repositories/profile'

export function requireProfile(db: Db, profileId: number): Profile {
  const profile = findProfileById(db, profileId)

  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`)
  }

  return profile
}
