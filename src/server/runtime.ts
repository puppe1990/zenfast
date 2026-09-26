import '@tanstack/react-start/server-only'

import {
  getRequestHost,
  getRequestProtocol,
} from '@tanstack/react-start/server'

import { ensureBootstrapped } from '#/db/bootstrap'
import { getDb } from '#/db/client'
import type { Db } from '#/db/client'
import { logMood, logWater, logWeight } from '#/db/repositories/logs'
import { activateProtocol, updateProfile } from '#/db/repositories/profile'
import { insertProtocol, listProtocols } from '#/db/repositories/protocols'
import {
  endSession,
  findActiveSession,
  listSessions,
  startSession,
} from '#/db/repositories/sessions'
import { buildCustomProtocol } from '#/domain/protocol-catalog'
import { computeStreak } from '#/domain/stats'
import type { MoodLevel, ProtocolCategory } from '#/domain/types'
import { buildOrigin } from '#/lib/site-meta'

import { buildDashboard } from './services/dashboard'
import { buildProfileView } from './services/profile'
import { buildProgressView } from './services/progress'
import { buildProtocolsView } from './services/protocols'

function withDb<T>(run: (db: Db) => T): T {
  const db = getDb()
  ensureBootstrapped(db)

  return run(db)
}

export function loadDashboard() {
  return withDb((db) => buildDashboard(db, new Date()))
}

export function loadOrigin(): string {
  try {
    const host = getRequestHost({ xForwardedHost: true })
    const protocol = getRequestProtocol({ xForwardedProto: true })

    return buildOrigin(
      host,
      protocol,
      process.env.VITE_SITE_URL ?? 'http://localhost:3000',
    )
  } catch {
    return process.env.VITE_SITE_URL ?? 'http://localhost:3000'
  }
}

export function loadShell() {
  return withDb((db) => {
    const profile = ensureBootstrapped(db)
    const now = new Date()
    const streak = computeStreak(
      listSessions(db, { profileId: profile.id, limit: 200 }),
      now,
    )

    return { profileName: profile.name, streakDays: streak.current }
  })
}

export function loadProgress() {
  return withDb((db) => buildProgressView(db, new Date()))
}

export function loadProtocols(category?: ProtocolCategory) {
  return withDb((db) => buildProtocolsView(db, new Date(), category))
}

export function loadProfile() {
  return withDb((db) => buildProfileView(db, new Date()))
}

export interface StartFastInput {
  protocolId?: number
}

export function startFast(input: StartFastInput = {}) {
  return withDb((db) => {
    const profile = ensureBootstrapped(db)
    const protocolId =
      input.protocolId ??
      profile.activeProtocolId ??
      listProtocols(db).at(0)?.id ??
      null

    if (protocolId === null) {
      throw new Error('Nenhum protocolo disponível para iniciar o jejum')
    }

    return startSession(db, {
      protocolId,
      startedAt: new Date(),
      targetHours: profile.dailyTargetHours,
      profileId: profile.id,
    })
  })
}

export interface EndFastInput {
  breakFood?: string
  moodNote?: string
  notes?: string
}

export function endFast(input: EndFastInput = {}) {
  return withDb((db) => {
    const profile = ensureBootstrapped(db)
    const active = findActiveSession(db, profile.id)

    if (!active) {
      return null
    }

    return endSession(db, active.id, {
      endedAt: new Date(),
      breakFood: input.breakFood ?? null,
      moodNote: input.moodNote ?? null,
      notes: input.notes ?? null,
    })
  })
}

export function addWater(amountMl: number) {
  return withDb((db) => {
    const profile = ensureBootstrapped(db)

    return logWater(db, {
      amountMl,
      loggedAt: new Date(),
      profileId: profile.id,
    })
  })
}

export interface SaveMoodInput {
  level: MoodLevel
  note?: string
}

export function saveMood(input: SaveMoodInput) {
  return withDb((db) => {
    const profile = ensureBootstrapped(db)

    return logMood(db, {
      level: input.level,
      note: input.note ?? null,
      loggedAt: new Date(),
      profileId: profile.id,
    })
  })
}

export function saveWeight(weightKg: number) {
  return withDb((db) => {
    const profile = ensureBootstrapped(db)

    return logWeight(db, {
      weightKg,
      loggedAt: new Date(),
      profileId: profile.id,
    })
  })
}

export function selectProtocol(protocolId: number) {
  return withDb((db) => {
    ensureBootstrapped(db)

    return activateProtocol(db, protocolId)
  })
}

export interface SaveGoalsInput {
  name?: string
  dailyTargetHours?: number
  waterGoalMl?: number
  startWeightKg?: number
  targetWeightKg?: number
}

export function saveGoals(input: SaveGoalsInput) {
  return withDb((db) => {
    ensureBootstrapped(db)

    return updateProfile(db, input)
  })
}

export interface CreateCustomProtocolInput {
  fastingHours: number
  windowStart: string
}

export function createCustomProtocol(input: CreateCustomProtocolInput) {
  return withDb((db) => {
    ensureBootstrapped(db)
    const protocol = insertProtocol(
      db,
      buildCustomProtocol(input.fastingHours, input.windowStart),
    )

    return activateProtocol(db, protocol.id)
  })
}
