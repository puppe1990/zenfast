import { parseFastingInterval } from '#/domain/fasting'
import type { FastingSession } from '#/domain/types'

import type { Db } from '#/db/client'
import { listProtocols } from '#/db/repositories/protocols'
import {
  deleteSession,
  findSessionForProfile,
  insertClosedSession,
  updateSession,
} from '#/db/repositories/sessions'

import { requireProfile } from './tenant'

export interface CreateHistoryEntryInput {
  startedAt: string
  endedAt: string
  breakFood?: string | null
  moodNote?: string | null
  notes?: string | null
}

export interface UpdateHistoryEntryInput {
  startedAt: string
  endedAt: string
  breakFood?: string | null
  moodNote?: string | null
  notes?: string | null
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}

export function createHistoryEntry(
  db: Db,
  profileId: number,
  input: CreateHistoryEntryInput,
  now: Date,
): FastingSession {
  const profile = requireProfile(db, profileId)
  const protocolId =
    profile.activeProtocolId ?? listProtocols(db).at(0)?.id ?? null

  if (protocolId === null) {
    throw new Error('Nenhum protocolo disponível para registrar o jejum.')
  }

  const interval = parseFastingInterval(input.startedAt, input.endedAt, now)

  return insertClosedSession(db, {
    profileId: profile.id,
    protocolId,
    startedAt: interval.startedAt,
    endedAt: interval.endedAt,
    targetHours: profile.dailyTargetHours,
    breakFood: normalizeText(input.breakFood),
    moodNote: normalizeText(input.moodNote),
    notes: normalizeText(input.notes),
  })
}

export function updateHistoryEntry(
  db: Db,
  profileId: number,
  sessionId: number,
  input: UpdateHistoryEntryInput,
  now: Date,
): FastingSession {
  const existing = findSessionForProfile(db, sessionId, profileId)

  if (!existing) {
    throw new Error('Jejum não encontrado no seu histórico.')
  }

  if (existing.status === 'active') {
    throw new Error('Encerre o jejum ativo antes de editá-lo.')
  }

  const interval = parseFastingInterval(input.startedAt, input.endedAt, now)

  const updated = updateSession(db, sessionId, profileId, {
    startedAt: interval.startedAt,
    endedAt: interval.endedAt,
    breakFood: normalizeText(input.breakFood),
    moodNote: normalizeText(input.moodNote),
    notes: normalizeText(input.notes),
  })

  if (!updated) {
    throw new Error('Jejum não encontrado no seu histórico.')
  }

  return updated
}

export function deleteHistoryEntry(
  db: Db,
  profileId: number,
  sessionId: number,
): void {
  if (!deleteSession(db, sessionId, profileId)) {
    throw new Error('Jejum não encontrado no seu histórico.')
  }
}
