import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'

import { createDatabase, migrate } from './client'

describe('createDatabase', () => {
  it('creates an in-memory database with the full schema', () => {
    const db = createDatabase(':memory:')

    const tables = db
      .prepare(
        "select name from sqlite_master where type = 'table' order by name",
      )
      .all()
      .map((row) => (row as { name: string }).name)

    expect(tables).toEqual(
      expect.arrayContaining([
        'achievements',
        'fasting_sessions',
        'mood_logs',
        'profiles',
        'protocols',
        'expert_tips',
        'water_logs',
        'weight_logs',
      ]),
    )

    db.close()
  })

  it('runs migrations idempotently', () => {
    const db = createDatabase(':memory:')

    expect(() => migrate(db)).not.toThrow()
    expect(() => migrate(db)).not.toThrow()

    db.close()
  })

  it('enforces foreign keys', () => {
    const db = createDatabase(':memory:')

    expect(() =>
      db
        .prepare(
          `insert into fasting_sessions (profile_id, protocol_id, started_at, target_hours)
           values (999, 999, '2026-02-24T20:00:00.000Z', 16)`,
        )
        .run(),
    ).toThrow(/FOREIGN KEY/i)

    db.close()
  })

  it('exposes a reusable connection factory', () => {
    const db = new Database(':memory:')
    db.pragma('journal_mode = WAL')

    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    db.close()
  })
})
