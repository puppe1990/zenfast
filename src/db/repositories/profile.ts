import type { Profile } from '#/domain/types'

import type { Db } from '../client'
import { findProtocolBySlug } from './protocols'

interface ProfileRow {
  id: number
  name: string
  avatar_seed: string | null
  active_protocol_id: number | null
  daily_target_hours: number
  water_goal_ml: number
  start_weight_kg: number | null
  target_weight_kg: number | null
  created_at: string
}

export type ProfilePatch = Partial<
  Pick<
    Profile,
    | 'name'
    | 'avatarSeed'
    | 'activeProtocolId'
    | 'dailyTargetHours'
    | 'waterGoalMl'
    | 'startWeightKg'
    | 'targetWeightKg'
  >
>

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    avatarSeed: row.avatar_seed,
    activeProtocolId: row.active_protocol_id,
    dailyTargetHours: row.daily_target_hours,
    waterGoalMl: row.water_goal_ml,
    startWeightKg: row.start_weight_kg,
    targetWeightKg: row.target_weight_kg,
    createdAt: row.created_at,
  }
}

export function getProfile(db: Db): Profile {
  const existing = db
    .prepare<[], ProfileRow>('select * from profiles order by id asc limit 1')
    .get()

  if (existing) {
    return mapProfile(existing)
  }

  const defaultProtocol = findProtocolBySlug(db, '16-8-diario')

  const inserted = db
    .prepare<[string, string, number | null, number], ProfileRow>(
      `insert into profiles (name, avatar_seed, active_protocol_id, daily_target_hours)
       values (?, ?, ?, ?)
       returning *`,
    )
    .get('Atleta ZenFast', 'zenfast-atleta', defaultProtocol?.id ?? null, 16)

  return mapProfile(inserted as ProfileRow)
}

export function updateProfile(db: Db, patch: ProfilePatch): Profile {
  const current = getProfile(db)

  const merged = {
    name: patch.name ?? current.name,
    avatarSeed: patch.avatarSeed ?? current.avatarSeed,
    activeProtocolId: patch.activeProtocolId ?? current.activeProtocolId,
    dailyTargetHours: patch.dailyTargetHours ?? current.dailyTargetHours,
    waterGoalMl: patch.waterGoalMl ?? current.waterGoalMl,
    startWeightKg: patch.startWeightKg ?? current.startWeightKg,
    targetWeightKg: patch.targetWeightKg ?? current.targetWeightKg,
  }

  const row = db
    .prepare<
      [
        string,
        string | null,
        number | null,
        number,
        number,
        number | null,
        number | null,
        number,
      ],
      ProfileRow
    >(
      `update profiles set
         name = ?, avatar_seed = ?, active_protocol_id = ?, daily_target_hours = ?,
         water_goal_ml = ?, start_weight_kg = ?, target_weight_kg = ?
       where id = ?
       returning *`,
    )
    .get(
      merged.name,
      merged.avatarSeed,
      merged.activeProtocolId,
      merged.dailyTargetHours,
      merged.waterGoalMl,
      merged.startWeightKg,
      merged.targetWeightKg,
      current.id,
    )

  return mapProfile(row as ProfileRow)
}

export function activateProtocol(db: Db, protocolId: number): Profile {
  const protocol = db
    .prepare<[number], { fasting_hours: number }>(
      'select fasting_hours from protocols where id = ?',
    )
    .get(protocolId)

  if (!protocol) {
    throw new Error(`Protocol ${protocolId} not found`)
  }

  return updateProfile(db, {
    activeProtocolId: protocolId,
    dailyTargetHours: protocol.fasting_hours,
  })
}
