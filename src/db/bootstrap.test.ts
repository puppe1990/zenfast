import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Db } from './client'
import { DEMO_DATA_FLAG, ensureBootstrapped, ensureDemoData } from './bootstrap'
import { countSessions } from './repositories/sessions'
import { createTestDb } from './testing/helpers'

describe('ensureDemoData', () => {
  const now = new Date(2026, 1, 25, 10, 25, 41)
  let db: Db

  beforeEach(() => {
    db = createTestDb()
    delete process.env[DEMO_DATA_FLAG]
  })

  afterEach(() => {
    delete process.env[DEMO_DATA_FLAG]
  })

  it('does nothing unless the demo flag is enabled', () => {
    expect(ensureDemoData(db, now)).toBe(false)
    expect(countSessions(db)).toBe(0)
  })

  it('fills an empty database with a month of demo history', () => {
    process.env[DEMO_DATA_FLAG] = '1'

    expect(ensureDemoData(db, now)).toBe(true)
    expect(countSessions(db)).toBeGreaterThan(20)
  })

  it('never overwrites real data', () => {
    process.env[DEMO_DATA_FLAG] = '1'
    ensureDemoData(db, now)
    const seeded = countSessions(db)

    expect(ensureDemoData(db, now)).toBe(false)
    expect(countSessions(db)).toBe(seeded)
  })

  it('bootstraps the catalog and the demo data together', () => {
    process.env[DEMO_DATA_FLAG] = '1'

    const profile = ensureBootstrapped(db, now)

    expect(profile.name).toBe('Atleta ZenFast')
    expect(countSessions(db)).toBeGreaterThan(20)
  })
})
