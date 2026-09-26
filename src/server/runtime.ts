import '@tanstack/react-start/server-only'

import {
  getRequestHeader,
  getRequestHost,
  getRequestProtocol,
  setResponseHeader,
} from '@tanstack/react-start/server'

import {
  DEFAULT_TENANT_NAME,
  createTenant,
  ensureCatalog,
} from '#/db/bootstrap'
import { getDb } from '#/db/client'
import type { Db } from '#/db/client'
import {
  authenticate,
  endSession,
  isEmailTaken,
  purgeExpiredSessions,
  resolveSession,
  startSession,
} from '#/db/repositories/accounts'
import { logMood, logWater, logWeight } from '#/db/repositories/logs'
import { activateProtocol } from '#/db/repositories/profile'
import { insertProtocol, listProtocols } from '#/db/repositories/protocols'
import {
  endSession as endFastingSession,
  findActiveSession,
  listSessions,
  startSession as startFastingSession,
} from '#/db/repositories/sessions'
import { buildCustomProtocol } from '#/domain/protocol-catalog'
import { computeStreak } from '#/domain/stats'
import type { MoodLevel, Profile, ProtocolCategory } from '#/domain/types'
import { hashPassword } from '#/lib/password'
import { buildOrigin } from '#/lib/site-meta'
import {
  parseSessionToken,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  sessionTtlMs,
} from '#/lib/session-cookie'

import { syncAchievements } from './services/achievements'
import { buildDashboard } from './services/dashboard'
import { applyGoalChange } from './services/goals'
import { buildProfileView } from './services/profile'
import { buildProgressView } from './services/progress'
import { buildProtocolsView } from './services/protocols'

export class UnauthorizedError extends Error {
  constructor() {
    super('Sessão expirada. Entre novamente para continuar.')
    this.name = 'UnauthorizedError'
  }
}

function withDb<T>(run: (db: Db) => T): T {
  const db = getDb()
  ensureCatalog(db)

  return run(db)
}

function readSessionToken(): string | null {
  try {
    return parseSessionToken(getRequestHeader('cookie'))
  } catch {
    return null
  }
}

function isSecureRequest(): boolean {
  try {
    return getRequestProtocol({ xForwardedProto: true }) === 'https'
  } catch {
    return false
  }
}

function writeSessionCookie(token: string): void {
  setResponseHeader(
    'set-cookie',
    serializeSessionCookie(token, {
      maxAgeSeconds: Math.floor(sessionTtlMs() / 1000),
      secure: isSecureRequest(),
    }),
  )
}

function clearSessionCookie(): void {
  setResponseHeader('set-cookie', serializeClearedSessionCookie())
}

export function currentProfile(db: Db): Profile | null {
  return resolveSession(db, readSessionToken())
}

export function requireProfile(db: Db): Profile {
  const profile = currentProfile(db)

  if (!profile) {
    throw new UnauthorizedError()
  }

  return profile
}

export interface SessionState {
  authenticated: boolean
  profileName: string | null
  email: string | null
  isGuest: boolean
  streakDays: number
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

export function loadSession(): SessionState {
  return withDb((db) => {
    const profile = currentProfile(db)

    if (!profile) {
      return {
        authenticated: false,
        profileName: null,
        email: null,
        isGuest: false,
        streakDays: 0,
      }
    }

    const streak = computeStreak(
      listSessions(db, { profileId: profile.id, limit: 200 }),
      new Date(),
    )

    return {
      authenticated: true,
      profileName: profile.name,
      email: profile.email,
      isGuest: profile.isGuest,
      streakDays: streak.current,
    }
  })
}

export interface SignUpInput {
  name: string
  email: string
  password: string
}

export type AuthResult =
  { ok: true; session: SessionState } | { ok: false; message: string }

export function signUp(input: SignUpInput): AuthResult {
  return withDb((db) => {
    if (isEmailTaken(db, input.email)) {
      return { ok: false, message: 'Este e-mail já tem uma conta no ZenFast.' }
    }

    const profile = createTenant(db, {
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
      isGuest: false,
    })

    writeSessionCookie(startSession(db, profile.id))

    return { ok: true, session: loadSession() }
  })
}

export interface SignInInput {
  email: string
  password: string
}

export function signIn(input: SignInInput): AuthResult {
  return withDb((db) => {
    purgeExpiredSessions(db)

    const profile = authenticate(db, input.email, input.password)

    if (!profile) {
      return { ok: false, message: 'E-mail ou senha inválidos.' }
    }

    writeSessionCookie(startSession(db, profile.id))

    return { ok: true, session: loadSession() }
  })
}

export function startGuestSession(): SessionState {
  return withDb((db) => {
    const profile = createTenant(db, {
      name: DEFAULT_TENANT_NAME,
      isGuest: true,
    })

    writeSessionCookie(startSession(db, profile.id))

    return loadSession()
  })
}

export function signOut(): SessionState {
  return withDb((db) => {
    const token = readSessionToken()

    if (token) {
      endSession(db, token)
    }

    clearSessionCookie()

    return {
      authenticated: false,
      profileName: null,
      email: null,
      isGuest: false,
      streakDays: 0,
    }
  })
}

export function loadDashboard() {
  return withDb((db) => buildDashboard(db, requireProfile(db).id, new Date()))
}

export function loadProgress() {
  return withDb((db) =>
    buildProgressView(db, requireProfile(db).id, new Date()),
  )
}

export function loadProtocols(category?: ProtocolCategory) {
  return withDb((db) =>
    buildProtocolsView(db, requireProfile(db).id, new Date(), category),
  )
}

export function loadProfile() {
  return withDb((db) => buildProfileView(db, requireProfile(db).id, new Date()))
}

export interface StartFastInput {
  protocolId?: number
}

export function startFast(input: StartFastInput = {}) {
  return withDb((db) => {
    const profile = requireProfile(db)
    const protocolId =
      input.protocolId ??
      profile.activeProtocolId ??
      listProtocols(db).at(0)?.id ??
      null

    if (protocolId === null) {
      throw new Error('Nenhum protocolo disponível para iniciar o jejum')
    }

    const session = startFastingSession(db, {
      profileId: profile.id,
      protocolId,
      startedAt: new Date(),
      targetHours: profile.dailyTargetHours,
    })

    syncAchievements(db, profile.id)

    return session
  })
}

export interface EndFastInput {
  breakFood?: string
  moodNote?: string
  notes?: string
}

export function endFast(input: EndFastInput = {}) {
  return withDb((db) => {
    const profile = requireProfile(db)
    const active = findActiveSession(db, profile.id)

    if (!active) {
      return null
    }

    const closed = endFastingSession(db, active.id, {
      endedAt: new Date(),
      breakFood: input.breakFood ?? null,
      moodNote: input.moodNote ?? null,
      notes: input.notes ?? null,
    })

    syncAchievements(db, profile.id)

    return closed
  })
}

export function addWater(amountMl: number) {
  return withDb((db) => {
    const profile = requireProfile(db)

    const water = logWater(db, {
      amountMl,
      loggedAt: new Date(),
      profileId: profile.id,
    })

    syncAchievements(db, profile.id)

    return water
  })
}

export interface SaveMoodInput {
  level: MoodLevel
  note?: string
}

export function saveMood(input: SaveMoodInput) {
  return withDb((db) => {
    const profile = requireProfile(db)

    const mood = logMood(db, {
      level: input.level,
      note: input.note ?? null,
      loggedAt: new Date(),
      profileId: profile.id,
    })

    syncAchievements(db, profile.id)

    return mood
  })
}

export function saveWeight(weightKg: number) {
  return withDb((db) => {
    const profile = requireProfile(db)

    const weight = logWeight(db, {
      weightKg,
      loggedAt: new Date(),
      profileId: profile.id,
    })

    syncAchievements(db, profile.id)

    return weight
  })
}

export function selectProtocol(protocolId: number) {
  return withDb((db) => {
    const profile = requireProfile(db)

    return activateProtocol(db, profile.id, protocolId)
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
    const profile = requireProfile(db)

    return applyGoalChange(db, profile.id, input)
  })
}

export interface CreateCustomProtocolInput {
  fastingHours: number
  windowStart: string
}

export function createCustomProtocol(input: CreateCustomProtocolInput) {
  return withDb((db) => {
    const profile = requireProfile(db)
    const protocol = insertProtocol(
      db,
      buildCustomProtocol(input.fastingHours, input.windowStart),
    )

    return activateProtocol(db, profile.id, protocol.id)
  })
}
