import { PROTOCOL_CATALOG } from '#/domain/protocol-catalog'
import { EXPERT_TIPS } from '#/domain/tips-catalog'

import { createDatabase } from '../client'
import type { Db } from '../client'
import { createProfile } from '../repositories/profile'
import type { NewProfile } from '../repositories/profile'
import { seedProtocols } from '../repositories/protocols'
import { seedTips } from '../repositories/tips'

export function createTestDb(): Db {
  const db = createDatabase(':memory:')
  seedProtocols(db, PROTOCOL_CATALOG)
  seedTips(db, EXPERT_TIPS)

  return db
}

export function createTestTenant(db: Db, overrides: Partial<NewProfile> = {}) {
  return createProfile(db, { name: 'Atleta de teste', ...overrides })
}
