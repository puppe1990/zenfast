import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '#/db/client'
import { endSession, startSession } from '#/db/repositories/sessions'
import { createTestDb, createTestTenant } from '#/db/testing/helpers'
import { findProtocolBySlug } from '#/db/repositories/protocols'

import { buildProtocolsView } from './protocols'

describe('buildProtocolsView', () => {
  const now = new Date(2026, 1, 25, 10, 25, 41)
  let db: Db
  let profile: ReturnType<typeof createTestTenant>

  beforeEach(() => {
    db = createTestDb()
    profile = createTestTenant(db)
  })

  it('exposes the protocol catalog with the active plan', () => {
    const view = buildProtocolsView(db, profile.id, now)

    expect(view.protocols).toHaveLength(5)
    expect(view.activeProtocol?.slug).toBe('16-8-diario')
    expect(view.categories.map((category) => category.id)).toContain(
      'personalizado',
    )
    expect(view.tip).not.toBeNull()
  })

  it('filters the catalog by category', () => {
    const view = buildProtocolsView(db, profile.id, now, 'iniciante')

    expect(view.protocols.map((protocol) => protocol.slug)).toEqual([
      '16-8-diario',
      '14-10-suave',
    ])
  })

  it('computes the adherence of the active protocol', () => {
    const protocol = findProtocolBySlug(db, '16-8-diario')!

    for (let day = 20; day <= 24; day += 1) {
      const session = startSession(db, {
        profileId: profile.id,
        protocolId: protocol.id,
        startedAt: new Date(2026, 1, day - 1, 20, 0),
        targetHours: 16,
      })
      endSession(db, session.id, {
        endedAt: new Date(2026, 1, day, day === 22 ? 11 : 12, 0),
      })
    }

    const view = buildProtocolsView(db, profile.id, now)

    expect(view.adherencePercent).toBe(80)
    expect(view.adherenceMet).toBe(4)
    expect(view.adherenceTotal).toBe(5)
  })

  it('reports the current metabolic stage of the active fast', () => {
    const protocol = findProtocolBySlug(db, '16-8-diario')!
    startSession(db, {
      profileId: profile.id,
      protocolId: protocol.id,
      startedAt: new Date(2026, 1, 24, 20, 0),
      targetHours: 16,
    })

    const view = buildProtocolsView(db, profile.id, now)

    expect(view.currentStage?.id).toBe('cetose')
  })
})
