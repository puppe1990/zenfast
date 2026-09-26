import { randomBytes } from 'node:crypto'

import { hashPassword, verifyPassword } from '#/lib/password'
import { sessionTtlMs } from '#/lib/session-cookie'
import type { Profile } from '#/domain/types'

import type { Db } from '../client'
import {
  createProfile,
  findProfileById,
  findProfileWithSecretByEmail,
} from './profile'

export interface SignUpInput {
  email: string
  password: string
  name: string
}

export interface SessionRecord {
  token: string
  createdAt: string
  expiresAt: string
}

export function isEmailTaken(db: Db, email: string): boolean {
  return findProfileWithSecretByEmail(db, email) !== null
}

export function createAccount(db: Db, input: SignUpInput): Profile {
  return createProfile(db, {
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    isGuest: false,
  })
}

export function authenticate(
  db: Db,
  email: string,
  password: string,
): Profile | null {
  const record = findProfileWithSecretByEmail(db, email)

  if (!record || !record.passwordHash) {
    return null
  }

  return verifyPassword(password, record.passwordHash) ? record.profile : null
}

export function startSession(
  db: Db,
  profileId: number,
  now: Date = new Date(),
  ttlMs: number = sessionTtlMs(),
): string {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(now.getTime() + ttlMs)

  db.prepare<[string, number, string, string]>(
    `insert into sessions (token, profile_id, created_at, expires_at)
     values (?, ?, ?, ?)`,
  ).run(token, profileId, now.toISOString(), expiresAt.toISOString())

  return token
}

export function resolveSession(
  db: Db,
  token: string | null,
  now: Date = new Date(),
): Profile | null {
  if (!token) {
    return null
  }

  const row = db
    .prepare<[string], { profile_id: number; expires_at: string }>(
      'select profile_id, expires_at from sessions where token = ?',
    )
    .get(token)

  if (!row) {
    return null
  }

  if (new Date(row.expires_at).getTime() <= now.getTime()) {
    endSession(db, token)

    return null
  }

  return findProfileById(db, row.profile_id)
}

export function endSession(db: Db, token: string): void {
  db.prepare<[string]>('delete from sessions where token = ?').run(token)
}

export function purgeExpiredSessions(db: Db, now: Date = new Date()): number {
  const result = db
    .prepare<[string]>('delete from sessions where expires_at <= ?')
    .run(now.toISOString())

  return result.changes
}

export function listSessions(db: Db, profileId: number): SessionRecord[] {
  return db
    .prepare<
      [number],
      { token: string; created_at: string; expires_at: string }
    >(
      `select token, created_at, expires_at from sessions
       where profile_id = ? order by created_at desc`,
    )
    .all(profileId)
    .map((row) => ({
      token: row.token,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }))
}
