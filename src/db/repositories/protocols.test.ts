import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '../client'
import { createTestDb } from '../testing/helpers'
import {
  findProtocolById,
  findProtocolBySlug,
  listProtocols,
  seedProtocols,
} from './protocols'
import { PROTOCOL_CATALOG } from '#/domain/protocol-catalog'

describe('protocols repository', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('lists every seeded protocol ordered by popularity', () => {
    const protocols = listProtocols(db)

    expect(protocols).toHaveLength(PROTOCOL_CATALOG.length)
    expect(protocols[0].slug).toBe('16-8-diario')
    expect(protocols.at(-1)?.slug).toBe('omad-23-1')
  })

  it('filters protocols by category', () => {
    const iniciante = listProtocols(db, 'iniciante')

    expect(iniciante.map((protocol) => protocol.slug)).toEqual([
      '16-8-diario',
      '14-10-suave',
    ])
  })

  it('hydrates the biomarker json', () => {
    const protocol = findProtocolBySlug(db, '18-6-avancado')

    expect(protocol?.biomarkers).toHaveLength(3)
    expect(protocol?.biomarkers[0]).toEqual({
      icon: 'autorenew',
      label: 'Autofagia',
      value: 'Ativa',
      tone: 'tertiary',
    })
  })

  it('returns null for unknown protocols', () => {
    expect(findProtocolBySlug(db, 'nao-existe')).toBeNull()
    expect(findProtocolById(db, 999)).toBeNull()
  })

  it('re-seeding updates existing rows instead of duplicating them', () => {
    const before = findProtocolBySlug(db, '16-8-diario')

    seedProtocols(db, [
      { ...PROTOCOL_CATALOG[0], name: '16:8 Diário Atualizado' },
    ])

    const after = findProtocolBySlug(db, '16-8-diario')

    expect(listProtocols(db)).toHaveLength(PROTOCOL_CATALOG.length)
    expect(after?.name).toBe('16:8 Diário Atualizado')
    expect(after?.id).toBe(before?.id)
  })
})
