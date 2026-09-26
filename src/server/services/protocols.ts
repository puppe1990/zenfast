import { computeFastingProgress, sessionMeetsGoal } from '#/domain/fasting'
import { stageForElapsedHours } from '#/domain/metabolic'
import type { MetabolicStage } from '#/domain/metabolic'
import type { Protocol, ProtocolCategory, Tip } from '#/domain/types'

import type { Db } from '#/db/client'
import { listTips } from '#/db/repositories/tips'
import { getProfile } from '#/db/repositories/profile'
import { findProtocolById, listProtocols } from '#/db/repositories/protocols'
import { findActiveSession, listSessions } from '#/db/repositories/sessions'
import type { FastingProgress } from '#/domain/fasting'

export interface ProtocolCategoryOption {
  id: ProtocolCategory | 'todos'
  label: string
}

export const PROTOCOL_CATEGORIES: ProtocolCategoryOption[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'iniciante', label: 'Iniciante' },
  { id: 'intermediario', label: 'Intermediário' },
  { id: 'avancado', label: 'Avançado' },
  { id: 'personalizado', label: 'Personalizado' },
]

export interface ProtocolsView {
  now: string
  profile: ReturnType<typeof getProfile>
  activeProtocol: Protocol | null
  protocols: Protocol[]
  categories: ProtocolCategoryOption[]
  tip: Tip | null
  adherencePercent: number
  adherenceMet: number
  adherenceTotal: number
  currentStage: MetabolicStage | null
  currentProgress: FastingProgress | null
}

const ADHERENCE_WINDOW_DAYS = 30

export function buildProtocolsView(
  db: Db,
  now: Date,
  category?: ProtocolCategory,
): ProtocolsView {
  const profile = getProfile(db)
  const activeProtocol = profile.activeProtocolId
    ? findProtocolById(db, profile.activeProtocolId)
    : null

  const activeSession = findActiveSession(db, profile.id)
  const currentProgress = activeSession
    ? computeFastingProgress(
        activeSession.startedAt,
        activeSession.targetHours,
        now,
      )
    : null

  const windowStart = now.getTime() - ADHERENCE_WINDOW_DAYS * 86_400_000
  const recentSessions = listSessions(db, { profileId: profile.id, limit: 200 })
    .filter((session) => session.status !== 'active')
    .filter((session) => {
      const endedAt = new Date(session.endedAt ?? session.startedAt).getTime()
      return endedAt >= windowStart
    })

  const met = recentSessions.filter((session) =>
    sessionMeetsGoal(session, now),
  ).length

  return {
    now: now.toISOString(),
    profile,
    activeProtocol,
    protocols: listProtocols(db, category),
    categories: PROTOCOL_CATEGORIES,
    tip: listTips(db)[0] ?? null,
    adherenceMet: met,
    adherenceTotal: recentSessions.length,
    adherencePercent:
      recentSessions.length === 0
        ? 0
        : Math.round((met / recentSessions.length) * 100),
    currentStage: currentProgress
      ? stageForElapsedHours(currentProgress.elapsedHours)
      : null,
    currentProgress,
  }
}
