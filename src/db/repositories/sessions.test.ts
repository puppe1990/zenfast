import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '../client'
import { createTestDb, createTestTenant } from '../testing/helpers'
import { findProtocolBySlug } from './protocols'
import {
  countSessions,
  endSession,
  findActiveSession,
  listSessions,
  startSession,
} from './sessions'

describe('sessions repository', () => {
  let db: Db
  let protocolId: number
  let profileId: number

  beforeEach(() => {
    db = createTestDb()
    profileId = createTestTenant(db).id
    protocolId = findProtocolBySlug(db, '16-8-diario')!.id
  })

  it('opens an active fasting session for the profile', () => {
    const session = startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    expect(session.status).toBe('active')
    expect(session.endedAt).toBeNull()
    expect(session.targetHours).toBe(16)
    expect(findActiveSession(db, profileId)?.id).toBe(session.id)
    expect(countSessions(db, profileId)).toBe(1)
  })

  it('closes the previous fast when a new one starts', () => {
    const previous = startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 22, 20, 0),
      targetHours: 16,
    })

    startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 23, 20, 0),
      targetHours: 16,
    })

    const closed = listSessions(db, { profileId }).find(
      (session) => session.id === previous.id,
    )

    expect(closed?.status).toBe('completed')
    expect(closed?.endedAt).toBe(new Date(2026, 1, 23, 20, 0).toISOString())
    expect(listSessions(db, { profileId })).toHaveLength(2)
  })

  it('marks an interrupted fast as partial', () => {
    startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 22, 20, 0),
      targetHours: 16,
    })

    startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 23, 10, 0),
      targetHours: 16,
    })

    const interrupted = listSessions(db, { profileId }).at(-1)

    expect(interrupted?.status).toBe('partial')
  })

  it('closes a session with the goal status and journal fields', () => {
    const session = startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 23, 20, 0),
      targetHours: 16,
    })

    const completed = endSession(db, session.id, {
      endedAt: new Date(2026, 1, 24, 12, 0),
      breakFood: 'Caldo de ossos + Ovos mexidos',
      moodNote: 'Alta energia & clareza mental',
      notes: 'Excelente recuperação celular mantida',
    })

    expect(completed.status).toBe('completed')
    expect(completed.breakFood).toBe('Caldo de ossos + Ovos mexidos')
    expect(completed.moodNote).toBe('Alta energia & clareza mental')
    expect(findActiveSession(db, profileId)).toBeNull()
  })

  it('closes early as partial when the target was not reached', () => {
    const session = startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 23, 20, 0),
      targetHours: 16,
    })

    const closed = endSession(db, session.id, {
      endedAt: new Date(2026, 1, 24, 11, 30),
      notes: 'Encerramento antecipado social',
    })

    expect(closed.status).toBe('partial')
  })

  it('lists sessions from the most recent to the oldest', () => {
    startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 20, 20, 0),
      targetHours: 16,
    })
    startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 22, 20, 0),
      targetHours: 16,
    })
    startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    const sessions = listSessions(db, { profileId, limit: 2 })

    expect(sessions).toHaveLength(2)
    expect(sessions[0].startedAt).toBe(
      new Date(2026, 1, 24, 20, 0).toISOString(),
    )
    expect(sessions[1].startedAt).toBe(
      new Date(2026, 1, 22, 20, 0).toISOString(),
    )
  })

  it('keeps each tenant fasts private', () => {
    const other = createTestTenant(db, { name: 'Outro tenant' })

    startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    expect(countSessions(db, profileId)).toBe(1)
    expect(countSessions(db, other.id)).toBe(0)
    expect(listSessions(db, { profileId: other.id })).toHaveLength(0)
    expect(findActiveSession(db, other.id)).toBeNull()
  })

  it('throws when ending an unknown session', () => {
    expect(() =>
      endSession(db, 123, { endedAt: new Date(2026, 1, 24, 12, 0) }),
    ).toThrow(/session not found/i)
  })
})
