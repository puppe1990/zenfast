import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '#/db/client'
import { listProtocols } from '#/db/repositories/protocols'
import { listSessions, startSession } from '#/db/repositories/sessions'
import { createTestDb, createTestTenant } from '#/db/testing/helpers'

import {
  createHistoryEntry,
  deleteHistoryEntry,
  updateHistoryEntry,
} from './history'

describe('history service', () => {
  const now = new Date(2026, 1, 25, 18, 0)
  let db: Db
  let profileId: number

  beforeEach(() => {
    db = createTestDb()
    profileId = createTestTenant(db).id
  })

  it('creates a closed manual entry for the tenant', () => {
    const entry = createHistoryEntry(
      db,
      profileId,
      {
        startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
        endedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
        breakFood: '  Caldo de ossos  ',
        moodNote: 'Alta energia',
        notes: 'Jejum de recuperação',
      },
      now,
    )

    expect(entry.status).toBe('completed')
    expect(entry.breakFood).toBe('Caldo de ossos')
    expect(entry.moodNote).toBe('Alta energia')
    expect(entry.notes).toBe('Jejum de recuperação')
    expect(listSessions(db, { profileId })).toHaveLength(1)
  })

  it('stores empty notes as null', () => {
    const entry = createHistoryEntry(
      db,
      profileId,
      {
        startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
        endedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
        breakFood: '   ',
        moodNote: '',
        notes: '  ',
      },
      now,
    )

    expect(entry.breakFood).toBeNull()
    expect(entry.moodNote).toBeNull()
    expect(entry.notes).toBeNull()
  })

  it('rejects an interval that ends before it starts', () => {
    expect(() =>
      createHistoryEntry(
        db,
        profileId,
        {
          startedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
          endedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
        },
        now,
      ),
    ).toThrow(/depois do início/i)
  })

  it('updates an existing entry and recomputes the status', () => {
    const entry = createHistoryEntry(
      db,
      profileId,
      {
        startedAt: new Date(2026, 1, 23, 20, 0).toISOString(),
        endedAt: new Date(2026, 1, 24, 8, 0).toISOString(),
      },
      now,
    )

    const updated = updateHistoryEntry(
      db,
      profileId,
      entry.id,
      {
        startedAt: new Date(2026, 1, 23, 20, 0).toISOString(),
        endedAt: new Date(2026, 1, 24, 12, 0).toISOString(),
        breakFood: 'Salmão',
        moodNote: 'Clareza mental',
        notes: 'Corrigido',
      },
      now,
    )

    expect(updated.status).toBe('completed')
    expect(updated.endedAt).toBe(new Date(2026, 1, 24, 12, 0).toISOString())
    expect(updated.breakFood).toBe('Salmão')
  })

  it('refuses to edit an active fast', () => {
    const protocolId = listProtocols(db).at(0)!.id
    const active = startSession(db, {
      profileId,
      protocolId,
      startedAt: new Date(2026, 1, 25, 12, 0),
      targetHours: 16,
    })

    expect(() =>
      updateHistoryEntry(
        db,
        profileId,
        active.id,
        {
          startedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
          endedAt: new Date(2026, 1, 25, 17, 0).toISOString(),
        },
        now,
      ),
    ).toThrow(/jejum ativo/i)
  })

  it('deletes an owned entry and reports unknown ids', () => {
    const entry = createHistoryEntry(
      db,
      profileId,
      {
        startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
        endedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
      },
      now,
    )

    deleteHistoryEntry(db, profileId, entry.id)

    expect(listSessions(db, { profileId })).toHaveLength(0)
    expect(() => deleteHistoryEntry(db, profileId, entry.id)).toThrow(
      /não encontrado/i,
    )
  })

  it('keeps edits and deletes isolated between tenants', () => {
    const other = createTestTenant(db, { name: 'Outro tenant' })
    const entry = createHistoryEntry(
      db,
      other.id,
      {
        startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
        endedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
      },
      now,
    )

    expect(() =>
      updateHistoryEntry(
        db,
        profileId,
        entry.id,
        {
          startedAt: new Date(2026, 1, 24, 20, 0).toISOString(),
          endedAt: new Date(2026, 1, 25, 12, 0).toISOString(),
        },
        now,
      ),
    ).toThrow(/não encontrado/i)

    expect(() => deleteHistoryEntry(db, profileId, entry.id)).toThrow(
      /não encontrado/i,
    )
    expect(listSessions(db, { profileId: other.id })).toHaveLength(1)
  })
})
