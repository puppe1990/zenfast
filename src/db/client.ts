import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import Database from 'better-sqlite3'

import { SCHEMA_SQL } from './schema'

export type Db = Database.Database

export const DEFAULT_DB_FILE =
  process.env.ZENFAST_DB_FILE ?? resolve(process.cwd(), 'data/zenfast.db')

export function migrate(db: Db): void {
  db.exec(SCHEMA_SQL)
}

export function createDatabase(filename: string = DEFAULT_DB_FILE): Db {
  if (filename !== ':memory:') {
    mkdirSync(dirname(filename), { recursive: true })
  }

  const db = new Database(filename)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)

  return db
}

let connection: Db | null = null

export function getDb(): Db {
  connection ??= createDatabase()

  return connection
}

export function closeDb(): void {
  connection?.close()
  connection = null
}
