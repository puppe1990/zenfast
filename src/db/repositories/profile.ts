import type { Profile } from '#/domain/types'

import type { Db } from '../client'
import { findProtocolBySlug } from './protocols'

interface ProfileRow {
  id: number
  name: string
  email: string | null
  password_hash: string | null
  is_guest: number
  avatar_seed: string | null
  active_protocol_id: number | null
  daily_target_hours: number
  water_goal_ml: number
  start_weight_kg: number | null
  target_weight_kg: number | null
  created_at: string
}

export interface ProfileRowWithSecret {
  profile: Profile
  passwordHash: string | null
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

export interface NewProfile {
  name: string
  email?: string | null
  passwordHash?: string | null
  isGuest?: boolean
  avatarSeed?: string | null
  waterGoalMl?: number
  dailyTargetHours?: number
  startWeightKg?: number | null
  targetWeightKg?: number | null
}

const DEFAULT_NAME = 'Atleta ZenFast'

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isGuest: row.is_guest === 1,
    avatarSeed: row.avatar_seed,
    activeProtocolId: row.active_protocol_id,
    dailyTargetHours: row.daily_target_hours,
    waterGoalMl: row.water_goal_ml,
    startWeightKg: row.start_weight_kg,
    targetWeightKg: row.target_weight_kg,
    createdAt: row.created_at,
  }
}

function mapProfileWithSecret(row: ProfileRow): ProfileRowWithSecret {
  return { profile: mapProfile(row), passwordHash: row.password_hash }
}

export function createProfile(db: Db, input: NewProfile): Profile {
  const defaultProtocol = findProtocolBySlug(db, '16-8-diario')

  const row = db
    .prepare<
      [
        string,
        string | null,
        string | null,
        number,
        string | null,
        number | null,
        number,
        number,
        number | null,
        number | null,
      ],
      ProfileRow
    >(
      `insert into profiles (
         name, email, password_hash, is_guest, avatar_seed, active_protocol_id,
         daily_target_hours, water_goal_ml, start_weight_kg, target_weight_kg
       ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       returning *`,
    )
    .get(
      input.name.trim() || DEFAULT_NAME,
      input.email?.toLowerCase() ?? null,
      input.passwordHash ?? null,
      input.isGuest ? 1 : 0,
      input.avatarSeed ?? 'zenfast-atleta',
      defaultProtocol?.id ?? null,
      input.dailyTargetHours ?? 16,
      input.waterGoalMl ?? 2500,
      input.startWeightKg ?? null,
      input.targetWeightKg ?? null,
    )

  return mapProfile(row as ProfileRow)
}

export function findFirstGuestProfile(db: Db): Profile | null {
  const row = db
    .prepare<[], ProfileRow>(
      'select * from profiles where is_guest = 1 order by id asc limit 1',
    )
    .get()

  return row ? mapProfile(row) : null
}

export function findProfileById(db: Db, id: number): Profile | null {
  const row = db
    .prepare<[number], ProfileRow>('select * from profiles where id = ?')
    .get(id)

  return row ? mapProfile(row) : null
}

export function findProfileByEmail(db: Db, email: string): Profile | null {
  return findProfileWithSecretByEmail(db, email)?.profile ?? null
}

export function findProfileWithSecretByEmail(
  db: Db,
  email: string,
): ProfileRowWithSecret | null {
  const row = db
    .prepare<[string], ProfileRow>(
      'select * from profiles where email = ? collate nocase',
    )
    .get(email.trim().toLowerCase())

  return row ? mapProfileWithSecret(row) : null
}

export function updateProfile(
  db: Db,
  profileId: number,
  patch: ProfilePatch,
): Profile {
  const current = findProfileById(db, profileId)

  if (!current) {
    throw new Error(`Profile not found: ${profileId}`)
  }

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
      profileId,
    )

  return mapProfile(row as ProfileRow)
}

export function activateProtocol(
  db: Db,
  profileId: number,
  protocolId: number,
): Profile {
  const protocol = db
    .prepare<[number], { fasting_hours: number }>(
      'select fasting_hours from protocols where id = ?',
    )
    .get(protocolId)

  if (!protocol) {
    throw new Error(`Protocol ${protocolId} not found`)
  }

  return updateProfile(db, profileId, {
    activeProtocolId: protocolId,
    dailyTargetHours: protocol.fasting_hours,
  })
}
