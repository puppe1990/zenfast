import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '../client'
import { createTestDb } from '../testing/helpers'
import {
  activateProtocol,
  createProfile,
  findFirstGuestProfile,
  findProfileByEmail,
  findProfileById,
  findProfileWithSecretByEmail,
  updateProfile,
} from './profile'
import { findProtocolBySlug } from './protocols'

describe('createProfile', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('starts a tenant on the 16:8 protocol with sensible goals', () => {
    const profile = createProfile(db, { name: 'Ana' })
    const protocol = findProtocolBySlug(db, '16-8-diario')

    expect(profile.id).toBeGreaterThan(0)
    expect(profile.name).toBe('Ana')
    expect(profile.activeProtocolId).toBe(protocol?.id)
    expect(profile.dailyTargetHours).toBe(16)
    expect(profile.waterGoalMl).toBe(2500)
    expect(profile.isGuest).toBe(false)
    expect(profile.email).toBeNull()
  })

  it('normalizes emails and flags guests', () => {
    const guest = createProfile(db, { name: 'Visitante', isGuest: true })
    const account = createProfile(db, {
      name: 'Bruno',
      email: 'Bruno@ZenFast.DEV',
      passwordHash: 'scrypt$sal$hash',
    })

    expect(guest.isGuest).toBe(true)
    expect(account.email).toBe('bruno@zenfast.dev')
    expect(account.isGuest).toBe(false)
  })

  it('refuses two accounts on the same email', () => {
    createProfile(db, { name: 'A', email: 'duplicado@zenfast.dev' })

    expect(() =>
      createProfile(db, { name: 'B', email: 'duplicado@zenfast.dev' }),
    ).toThrow(/unique/i)
  })
})

describe('profile lookups', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('finds tenants by id and by email', () => {
    const profile = createProfile(db, {
      name: 'Clara',
      email: 'clara@zenfast.dev',
    })

    expect(findProfileById(db, profile.id)?.name).toBe('Clara')
    expect(findProfileByEmail(db, 'CLARA@zenfast.dev')?.id).toBe(profile.id)
    expect(findProfileById(db, 999)).toBeNull()
    expect(findProfileByEmail(db, 'ninguem@zenfast.dev')).toBeNull()
  })

  it('keeps the password hash out of the public profile', () => {
    createProfile(db, {
      name: 'Dora',
      email: 'dora@zenfast.dev',
      passwordHash: 'scrypt$sal$hash',
    })

    expect(findProfileByEmail(db, 'dora@zenfast.dev')).not.toHaveProperty(
      'passwordHash',
    )
    expect(
      findProfileWithSecretByEmail(db, 'dora@zenfast.dev')?.passwordHash,
    ).toBe('scrypt$sal$hash')
  })

  it('finds the oldest guest tenant for the dev CLI', () => {
    createProfile(db, { name: 'Conta', email: 'conta@zenfast.dev' })
    const first = createProfile(db, { name: 'Guest 1', isGuest: true })
    createProfile(db, { name: 'Guest 2', isGuest: true })

    expect(findFirstGuestProfile(db)?.id).toBe(first.id)
  })
})

describe('updateProfile', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('patches only the requested tenant', () => {
    const first = createProfile(db, { name: 'Um' })
    const second = createProfile(db, { name: 'Dois' })

    updateProfile(db, first.id, { name: 'Um atualizado', waterGoalMl: 3000 })

    expect(findProfileById(db, first.id)).toMatchObject({
      name: 'Um atualizado',
      waterGoalMl: 3000,
    })
    expect(findProfileById(db, second.id)).toMatchObject({
      name: 'Dois',
      waterGoalMl: 2500,
    })
  })

  it('refuses to patch an unknown tenant', () => {
    expect(() => updateProfile(db, 999, { name: 'Fantasma' })).toThrow(
      /profile not found/i,
    )
  })

  it('activates a protocol for the tenant and syncs the daily target', () => {
    const profile = createProfile(db, { name: 'Eva' })
    const advanced = findProtocolBySlug(db, '18-6-avancado')

    const updated = activateProtocol(db, profile.id, advanced!.id)

    expect(updated.activeProtocolId).toBe(advanced!.id)
    expect(updated.dailyTargetHours).toBe(18)
  })
})
