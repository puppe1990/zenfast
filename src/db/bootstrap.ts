import { PROTOCOL_CATALOG } from '#/domain/protocol-catalog'
import { EXPERT_TIPS } from '#/domain/tips-catalog'
import type { Profile } from '#/domain/types'

import type { Db } from './client'
import { getProfile } from './repositories/profile'
import { seedProtocols } from './repositories/protocols'
import { seedTips } from './repositories/tips'

export function ensureCatalog(db: Db): Profile {
  seedProtocols(db, PROTOCOL_CATALOG)
  seedTips(db, EXPERT_TIPS)

  return getProfile(db)
}
