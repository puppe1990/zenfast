import { beforeEach, describe, expect, it } from 'vitest'

import type { Db } from '#/db/client'
import { createAccount } from '#/db/repositories/accounts'
import { logMood, logWater, logWeight } from '#/db/repositories/logs'
import { activateProtocol, findProfileById } from '#/db/repositories/profile'
import { findProtocolBySlug } from '#/db/repositories/protocols'
import { endSession, startSession } from '#/db/repositories/sessions'
import { createTestDb, createTestTenant } from '#/db/testing/helpers'

import { buildDashboard } from './dashboard'
import { buildProfileView } from './profile'
import { buildProgressView } from './progress'
import { buildProtocolsView } from './protocols'

describe('tenant isolation', () => {
  const now = new Date(2026, 1, 25, 14, 0)
  let db: Db
  let protocolId: number

  const fast = (profileId: number, start: Date, hours: number) => {
    const session = startSession(db, {
      profileId,
      protocolId,
      startedAt: start,
      targetHours: 16,
    })

    return endSession(db, session.id, {
      endedAt: new Date(start.getTime() + hours * 3600_000),
    })
  }

  beforeEach(() => {
    db = createTestDb()
    protocolId = findProtocolBySlug(db, '16-8-diario')!.id
  })

  it('never leaks day data between two tenants', () => {
    const ana = createTestTenant(db, { name: 'Ana' })
    const bruno = createTestTenant(db, { name: 'Bruno' })

    logWater(db, {
      amountMl: 1500,
      loggedAt: new Date(2026, 1, 25, 8, 0),
      profileId: ana.id,
    })
    logWater(db, {
      amountMl: 4000,
      loggedAt: new Date(2026, 1, 25, 8, 0),
      profileId: bruno.id,
    })

    logMood(db, {
      level: 'otima',
      note: 'Foco mental aguçado',
      loggedAt: new Date(2026, 1, 25, 9, 0),
      profileId: ana.id,
    })
    logMood(db, {
      level: 'baixa',
      note: 'Sem energia',
      loggedAt: new Date(2026, 1, 25, 9, 0),
      profileId: bruno.id,
    })

    const anaView = buildDashboard(db, ana.id, now)
    const brunoView = buildDashboard(db, bruno.id, now)

    expect(anaView.hydration.consumedMl).toBe(1500)
    expect(anaView.mood?.label).toBe('Ótima energia')
    expect(brunoView.hydration.consumedMl).toBe(4000)
    expect(brunoView.mood?.label).toBe('Energia baixa')
  })

  it('never leaks fasting history, KPIs or weight between tenants', () => {
    const ana = createTestTenant(db, { name: 'Ana' })
    const bruno = createTestTenant(db, { name: 'Bruno' })

    fast(ana.id, new Date(2026, 1, 23, 20, 0), 16)
    fast(ana.id, new Date(2026, 1, 24, 20, 0), 16)
    fast(bruno.id, new Date(2026, 1, 24, 20, 0), 14)

    logWeight(db, {
      weightKg: 74,
      loggedAt: new Date(2026, 1, 24, 8, 0),
      profileId: ana.id,
    })
    logWeight(db, {
      weightKg: 88,
      loggedAt: new Date(2026, 1, 24, 8, 0),
      profileId: bruno.id,
    })

    const anaView = buildProgressView(db, ana.id, now)
    const brunoView = buildProgressView(db, bruno.id, now)

    expect(anaView.history).toHaveLength(2)
    expect(brunoView.history).toHaveLength(1)
    expect(
      anaView.history.every((entry) => entry.statusTone === 'secondary'),
    ).toBe(true)
    expect(brunoView.history[0].statusLabel).toBe('Parcial')

    expect(anaView.efficacy).toEqual({ met: 2, total: 2, percent: 100 })
    expect(brunoView.efficacy).toEqual({ met: 0, total: 1, percent: 0 })

    expect(anaView.weight?.currentWeightKg).toBe(74)
    expect(brunoView.weight?.currentWeightKg).toBe(88)
  })

  it('unlocks achievements per tenant', () => {
    const ana = createTestTenant(db, { name: 'Ana' })
    const bruno = createTestTenant(db, { name: 'Bruno' })

    fast(ana.id, new Date(2026, 1, 24, 20, 0), 19)

    const anaView = buildProgressView(db, ana.id, now)
    const brunoView = buildProgressView(db, bruno.id, now)

    expect(anaView.unlockedCount).toBeGreaterThanOrEqual(3)
    expect(brunoView.unlockedCount).toBe(0)
  })

  it('keeps the protocol catalog shared but the active plan per tenant', () => {
    const ana = createTestTenant(db, { name: 'Ana' })
    const bruno = createTestTenant(db, { name: 'Bruno' })
    const advanced = findProtocolBySlug(db, '18-6-avancado')!

    activateProtocol(db, ana.id, advanced.id)

    const anaView = buildProtocolsView(db, ana.id, now)
    const brunoView = buildProtocolsView(db, bruno.id, now)

    expect(anaView.protocols).toHaveLength(5)
    expect(brunoView.protocols).toHaveLength(5)
    expect(anaView.activeProtocol?.slug).toBe('18-6-avancado')
    expect(brunoView.activeProtocol?.slug).toBe('16-8-diario')
    expect(findProfileById(db, bruno.id)?.dailyTargetHours).toBe(16)
  })

  it('scopes the profile view to the signed in account', () => {
    const account = createAccount(db, {
      name: 'Matheus',
      email: 'matheus@zenfast.dev',
      password: 'jejum-16-8',
    })
    const guest = createTestTenant(db, { name: 'Visitante', isGuest: true })

    fast(account.id, new Date(2026, 1, 24, 20, 0), 16)

    const accountView = buildProfileView(db, account.id, now)
    const guestView = buildProfileView(db, guest.id, now)

    expect(accountView.profile.email).toBe('matheus@zenfast.dev')
    expect(accountView.totals.sessions).toBe(1)
    expect(guestView.profile.isGuest).toBe(true)
    expect(guestView.profile.email).toBeNull()
    expect(guestView.totals.sessions).toBe(0)
  })

  it('refuses to build a view for an unknown tenant', () => {
    expect(() => buildDashboard(db, 4242, now)).toThrow(/profile not found/i)
    expect(() => buildProgressView(db, 4242, now)).toThrow(/profile not found/i)
    expect(() => buildProtocolsView(db, 4242, now)).toThrow(
      /profile not found/i,
    )
  })
})
