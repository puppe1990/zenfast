import type { MoodLevel, MoodLog, WaterLog, WeightLog } from '#/domain/types'

import type { Db } from '../client'
import { getProfile } from './profile'

interface WaterRow {
  id: number
  logged_at: string
  amount_ml: number
}

interface MoodRow {
  id: number
  logged_at: string
  level: string
  note: string | null
}

interface WeightRow {
  id: number
  logged_at: string
  weight_kg: number
}

export interface LogRangeOptions {
  profileId?: number
  since?: Date
  until?: Date
  limit?: number
}

export interface LogWaterInput {
  amountMl: number
  loggedAt: Date
  profileId?: number
}

export interface LogMoodInput {
  level: MoodLevel
  note?: string | null
  loggedAt: Date
  profileId?: number
}

export interface LogWeightInput {
  weightKg: number
  loggedAt: Date
  profileId?: number
}

export function logWater(db: Db, input: LogWaterInput): WaterLog {
  const profileId = input.profileId ?? getProfile(db).id

  const row = db
    .prepare<[number, string, number], WaterRow>(
      `insert into water_logs (profile_id, logged_at, amount_ml)
       values (?, ?, ?) returning *`,
    )
    .get(profileId, input.loggedAt.toISOString(), input.amountMl)

  const water = row as WaterRow

  return {
    id: water.id,
    loggedAt: water.logged_at,
    amountMl: water.amount_ml,
  }
}

export function listWaterLogs(
  db: Db,
  options: LogRangeOptions = {},
): WaterLog[] {
  const conditions: string[] = []
  const params: Array<number | string> = []

  if (options.profileId !== undefined) {
    conditions.push('profile_id = ?')
    params.push(options.profileId)
  }
  if (options.since) {
    conditions.push('logged_at >= ?')
    params.push(options.since.toISOString())
  }
  if (options.until) {
    conditions.push('logged_at <= ?')
    params.push(options.until.toISOString())
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''
  const limit = options.limit ?? 200

  const rows = db
    .prepare<Array<number | string>, WaterRow>(
      `select * from water_logs ${where} order by logged_at desc limit ${limit}`,
    )
    .all(...params)

  return rows.map((row) => ({
    id: row.id,
    loggedAt: row.logged_at,
    amountMl: row.amount_ml,
  }))
}

export function waterTotal(db: Db, options: LogRangeOptions = {}): number {
  return listWaterLogs(db, options).reduce(
    (total, log) => total + log.amountMl,
    0,
  )
}

export function logMood(db: Db, input: LogMoodInput): MoodLog {
  const profileId = input.profileId ?? getProfile(db).id

  const row = db
    .prepare<[number, string, string, string | null], MoodRow>(
      `insert into mood_logs (profile_id, logged_at, level, note)
       values (?, ?, ?, ?) returning *`,
    )
    .get(
      profileId,
      input.loggedAt.toISOString(),
      input.level,
      input.note ?? null,
    )

  const mood = row as MoodRow

  return {
    id: mood.id,
    loggedAt: mood.logged_at,
    level: mood.level as MoodLevel,
    note: mood.note,
  }
}

export function latestMood(db: Db, profileId?: number): MoodLog | null {
  const row = profileId
    ? db
        .prepare<[number], MoodRow>(
          'select * from mood_logs where profile_id = ? order by logged_at desc limit 1',
        )
        .get(profileId)
    : db
        .prepare<[], MoodRow>(
          'select * from mood_logs order by logged_at desc limit 1',
        )
        .get()

  return row
    ? {
        id: row.id,
        loggedAt: row.logged_at,
        level: row.level as MoodLevel,
        note: row.note,
      }
    : null
}

export function logWeight(db: Db, input: LogWeightInput): WeightLog {
  const profileId = input.profileId ?? getProfile(db).id

  const row = db
    .prepare<[number, string, number], WeightRow>(
      `insert into weight_logs (profile_id, logged_at, weight_kg)
       values (?, ?, ?) returning *`,
    )
    .get(profileId, input.loggedAt.toISOString(), input.weightKg)

  const weight = row as WeightRow

  return {
    id: weight.id,
    loggedAt: weight.logged_at,
    weightKg: weight.weight_kg,
  }
}

export function listWeightLogs(
  db: Db,
  options: LogRangeOptions = {},
): WeightLog[] {
  const limit = options.limit ?? 365
  const rows = options.profileId
    ? db
        .prepare<[number, number], WeightRow>(
          `select * from weight_logs where profile_id = ?
           order by logged_at asc limit ?`,
        )
        .all(options.profileId, limit)
    : db
        .prepare<[number], WeightRow>(
          'select * from weight_logs order by logged_at asc limit ?',
        )
        .all(limit)

  return rows.map((row) => ({
    id: row.id,
    loggedAt: row.logged_at,
    weightKg: row.weight_kg,
  }))
}
