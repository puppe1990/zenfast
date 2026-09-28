import type { FastingSession, SessionStatus } from '#/domain/types'

import type { Db } from '../client'

interface SessionRow {
  id: number
  profile_id: number
  protocol_id: number
  started_at: string
  ended_at: string | null
  target_hours: number
  status: string
  break_food: string | null
  mood_note: string | null
  notes: string | null
}

export interface StartSessionInput {
  protocolId: number
  startedAt: Date
  targetHours: number
  profileId: number
}

export interface EndSessionInput {
  endedAt: Date
  breakFood?: string | null
  moodNote?: string | null
  notes?: string | null
}

export interface InsertClosedSessionInput extends StartSessionInput {
  endedAt: Date
  breakFood?: string | null
  moodNote?: string | null
  notes?: string | null
}

export interface UpdateSessionInput {
  startedAt: Date
  endedAt: Date
  breakFood: string | null
  moodNote: string | null
  notes: string | null
}

export interface ListSessionsOptions {
  profileId: number
  limit?: number
}

function mapSession(row: SessionRow): FastingSession {
  return {
    id: row.id,
    protocolId: row.protocol_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    targetHours: row.target_hours,
    status: row.status as SessionStatus,
    breakFood: row.break_food,
    moodNote: row.mood_note,
    notes: row.notes,
  }
}

function statusFor(
  startedAt: string,
  endedAt: string,
  targetHours: number,
): SessionStatus {
  const hours =
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 3_600_000

  return hours >= targetHours - 1 / 60 ? 'completed' : 'partial'
}

export function findSessionById(db: Db, id: number): FastingSession | null {
  const row = db
    .prepare<[number], SessionRow>(
      'select * from fasting_sessions where id = ?',
    )
    .get(id)

  return row ? mapSession(row) : null
}

export function findSessionForProfile(
  db: Db,
  id: number,
  profileId: number,
): FastingSession | null {
  const row = db
    .prepare<[number, number], SessionRow>(
      'select * from fasting_sessions where id = ? and profile_id = ?',
    )
    .get(id, profileId)

  return row ? mapSession(row) : null
}

export function findActiveSession(
  db: Db,
  profileId: number,
): FastingSession | null {
  const row = db
    .prepare<[number], SessionRow>(
      `select * from fasting_sessions
       where status = 'active' and profile_id = ?
       order by started_at desc limit 1`,
    )
    .get(profileId)

  return row ? mapSession(row) : null
}

export function listSessions(
  db: Db,
  options: ListSessionsOptions,
): FastingSession[] {
  const limit = options.limit ?? 100
  const rows = db
    .prepare<[number, number], SessionRow>(
      `select * from fasting_sessions
       where profile_id = ?
       order by started_at desc limit ?`,
    )
    .all(options.profileId, limit)

  return rows.map(mapSession)
}

export function countSessions(db: Db, profileId: number): number {
  const row = db
    .prepare<[number], { total: number }>(
      'select count(*) as total from fasting_sessions where profile_id = ?',
    )
    .get(profileId)

  return row?.total ?? 0
}

export function countAllSessions(db: Db): number {
  const row = db
    .prepare<[], { total: number }>(
      'select count(*) as total from fasting_sessions',
    )
    .get()

  return row?.total ?? 0
}

export function startSession(db: Db, input: StartSessionInput): FastingSession {
  const profileId = input.profileId
  const startedAt = input.startedAt.toISOString()

  const run = db.transaction((): FastingSession => {
    const active = findActiveSession(db, profileId)

    if (active) {
      db.prepare<[string, string, number]>(
        'update fasting_sessions set ended_at = ?, status = ? where id = ?',
      ).run(
        startedAt,
        statusFor(active.startedAt, startedAt, active.targetHours),
        active.id,
      )
    }

    const row = db
      .prepare<[number, number, string, number], SessionRow>(
        `insert into fasting_sessions (profile_id, protocol_id, started_at, target_hours, status)
         values (?, ?, ?, ?, 'active')
         returning *`,
      )
      .get(profileId, input.protocolId, startedAt, input.targetHours)

    return mapSession(row as SessionRow)
  })

  return run()
}

export function insertClosedSession(
  db: Db,
  input: InsertClosedSessionInput,
): FastingSession {
  const startedAt = input.startedAt.toISOString()
  const endedAt = input.endedAt.toISOString()
  const status = statusFor(startedAt, endedAt, input.targetHours)

  const row = db
    .prepare<
      [
        number,
        number,
        string,
        string,
        number,
        string,
        string | null,
        string | null,
        string | null,
      ],
      SessionRow
    >(
      `insert into fasting_sessions (
         profile_id, protocol_id, started_at, ended_at, target_hours, status,
         break_food, mood_note, notes
       ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
       returning *`,
    )
    .get(
      input.profileId,
      input.protocolId,
      startedAt,
      endedAt,
      input.targetHours,
      status,
      input.breakFood ?? null,
      input.moodNote ?? null,
      input.notes ?? null,
    )

  return mapSession(row as SessionRow)
}

export function updateSession(
  db: Db,
  id: number,
  profileId: number,
  input: UpdateSessionInput,
): FastingSession | null {
  const session = findSessionForProfile(db, id, profileId)

  if (!session) {
    return null
  }

  const startedAt = input.startedAt.toISOString()
  const endedAt = input.endedAt.toISOString()

  const row = db
    .prepare<
      [
        string,
        string,
        string,
        string | null,
        string | null,
        string | null,
        number,
        number,
      ],
      SessionRow
    >(
      `update fasting_sessions set
         started_at = ?, ended_at = ?, status = ?, break_food = ?,
         mood_note = ?, notes = ?
       where id = ? and profile_id = ?
       returning *`,
    )
    .get(
      startedAt,
      endedAt,
      statusFor(startedAt, endedAt, session.targetHours),
      input.breakFood,
      input.moodNote,
      input.notes,
      id,
      profileId,
    )

  return row ? mapSession(row) : null
}

export function deleteSession(db: Db, id: number, profileId: number): boolean {
  const result = db
    .prepare<[number, number]>(
      'delete from fasting_sessions where id = ? and profile_id = ?',
    )
    .run(id, profileId)

  return result.changes > 0
}

export function updateActiveSessionTarget(
  db: Db,
  profileId: number,
  targetHours: number,
): FastingSession | null {
  const active = findActiveSession(db, profileId)

  if (!active) {
    return null
  }

  const row = db
    .prepare<[number, number], SessionRow>(
      'update fasting_sessions set target_hours = ? where id = ? returning *',
    )
    .get(targetHours, active.id)

  return row ? mapSession(row) : null
}

export function endSession(
  db: Db,
  sessionId: number,
  input: EndSessionInput,
): FastingSession {
  const session = findSessionById(db, sessionId)

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`)
  }

  const endedAt = input.endedAt.toISOString()

  const row = db
    .prepare<
      [string, string, string | null, string | null, string | null, number],
      SessionRow
    >(
      `update fasting_sessions set
         ended_at = ?, status = ?, break_food = coalesce(?, break_food),
         mood_note = coalesce(?, mood_note), notes = coalesce(?, notes)
       where id = ?
       returning *`,
    )
    .get(
      endedAt,
      statusFor(session.startedAt, endedAt, session.targetHours),
      input.breakFood ?? null,
      input.moodNote ?? null,
      input.notes ?? null,
      sessionId,
    )

  return mapSession(row as SessionRow)
}
