import { PROTOCOL_CATALOG } from '#/domain/protocol-catalog'
import { EXPERT_TIPS } from '#/domain/tips-catalog'
import type { Profile } from '#/domain/types'

import type { Db } from './client'
import { createProfile } from './repositories/profile'
import { seedProtocols } from './repositories/protocols'
import { countSessions } from './repositories/sessions'
import { seedTips } from './repositories/tips'
import { seedDatabase } from './seeding'

export const DEMO_DATA_FLAG = 'ZENFAST_DEMO_DATA'
export const DEFAULT_TENANT_NAME = 'Atleta ZenFast'

export interface NewTenant {
  name: string
  email?: string | null
  passwordHash?: string | null
  isGuest?: boolean
}

export function ensureCatalog(db: Db): void {
  seedProtocols(db, PROTOCOL_CATALOG)
  seedTips(db, EXPERT_TIPS)
}

export function demoDataEnabled(): boolean {
  return process.env[DEMO_DATA_FLAG] === '1'
}

export function seedTenantDemoData(
  db: Db,
  profileId: number,
  now: Date = new Date(),
): boolean {
  if (!demoDataEnabled()) {
    return false
  }

  if (countSessions(db, profileId) > 0) {
    return false
  }

  seedDatabase(db, { profileId, now, days: 45, seed: 99 })

  return true
}

export function createTenant(
  db: Db,
  input: NewTenant,
  now: Date = new Date(),
): Profile {
  ensureCatalog(db)

  const profile = createProfile(db, {
    name: input.name,
    email: input.email ?? null,
    passwordHash: input.passwordHash ?? null,
    isGuest: input.isGuest ?? false,
  })

  if (profile.isGuest) {
    seedTenantDemoData(db, profile.id, now)
  }

  return profile
}
