import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '../client'
import { createTestDb } from '../testing/helpers'
import { activateProtocol, getProfile, updateProfile } from './profile'
import { findProtocolBySlug } from './protocols'

describe('profile repository', () => {
  let db: Db

  beforeEach(() => {
    db = createTestDb()
  })

  it('creates a default profile once', () => {
    const first = getProfile(db)
    const second = getProfile(db)

    expect(first.id).toBe(second.id)
    expect(first.waterGoalMl).toBe(2500)
    expect(first.dailyTargetHours).toBe(16)
    expect(first.name).toBe('Atleta ZenFast')
  })

  it('patches goals and identity', () => {
    const updated = updateProfile(db, {
      name: 'Matheus',
      waterGoalMl: 3000,
      targetWeightKg: 71.5,
      startWeightKg: 76.5,
    })

    expect(updated.name).toBe('Matheus')
    expect(updated.waterGoalMl).toBe(3000)
    expect(updated.targetWeightKg).toBe(71.5)
    expect(getProfile(db).startWeightKg).toBe(76.5)
  })

  it('activates a protocol and syncs the daily target', () => {
    const advanced = findProtocolBySlug(db, '18-6-avancado')
    const profile = activateProtocol(db, advanced!.id)

    expect(profile.activeProtocolId).toBe(advanced!.id)
    expect(profile.dailyTargetHours).toBe(18)
  })

  it('keeps an existing profile when the app restarts', () => {
    updateProfile(db, { name: 'Persistente' })

    expect(getProfile(db).name).toBe('Persistente')
  })
})
