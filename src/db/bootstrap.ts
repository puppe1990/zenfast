import { PROTOCOL_CATALOG } from '#/domain/protocol-catalog'
import { EXPERT_TIPS } from '#/domain/tips-catalog'
import type { Profile } from '#/domain/types'

import type { Db } from './client'
import { getProfile } from './repositories/profile'
import { seedProtocols } from './repositories/protocols'
import { countSessions } from './repositories/sessions'
import { seedTips } from './repositories/tips'
import { seedDatabase } from './seeding'

export const DEMO_DATA_FLAG = 'ZENFAST_DEMO_DATA'

export function ensureCatalog(db: Db): Profile {
  seedProtocols(db, PROTOCOL_CATALOG)
  seedTips(db, EXPERT_TIPS)

  return getProfile(db)
}

export function ensureDemoData(db: Db, now: Date = new Date()): boolean {
  if (process.env[DEMO_DATA_FLAG] !== '1') {
    return false
  }

  if (countSessions(db) > 0) {
    return false
  }

  seedDatabase(db, { now, days: 45, seed: 99 })

  return true
}

export function ensureBootstrapped(db: Db, now: Date = new Date()): Profile {
  const profile = ensureCatalog(db)
  ensureDemoData(db, now)

  return profile
}
