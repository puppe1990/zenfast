import { formatTime } from './format'
import type { FastingSession } from './types'

const MS_PER_HOUR = 60 * 60 * 1000

export interface FastingProgress {
  elapsedSeconds: number
  elapsedHours: number
  targetHours: number
  remainingSeconds: number
  remainingLabel: string
  targetTimeLabel: string
  percent: number
  percentCapped: number
  isTargetReached: boolean
}

export const MINUTE_TOLERANCE_HOURS = 1 / 60
export const MAX_BACKDATE_HOURS = 72
export const MIN_FAST_MINUTES = 1

export function parseFastingStart(value: string, now: Date): Date {
  const start = new Date(value)

  if (Number.isNaN(start.getTime())) {
    throw new Error('Horário de início inválido.')
  }

  if (start.getTime() > now.getTime()) {
    throw new Error('O início do jejum não pode estar no futuro.')
  }

  if (now.getTime() - start.getTime() > MAX_BACKDATE_HOURS * MS_PER_HOUR) {
    throw new Error(
      `O início do jejum não pode ser anterior a ${
        MAX_BACKDATE_HOURS / 24
      } dias.`,
    )
  }

  return start
}

export interface FastingInterval {
  startedAt: Date
  endedAt: Date
}

export function parseFastingInterval(
  startedAt: string,
  endedAt: string,
  now: Date,
): FastingInterval {
  const start = new Date(startedAt)
  const end = new Date(endedAt)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Informe início e término válidos.')
  }

  if (start.getTime() > now.getTime()) {
    throw new Error('O início do jejum não pode estar no futuro.')
  }

  if (end.getTime() > now.getTime()) {
    throw new Error('O término do jejum não pode estar no futuro.')
  }

  if (end.getTime() - start.getTime() < MIN_FAST_MINUTES * 60_000) {
    throw new Error('O término deve ser depois do início.')
  }

  return { startedAt: start, endedAt: end }
}

export function roundUpDurationLabel(hours: number): string {
  const totalMinutes = Math.ceil(Math.max(0, hours) * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function computeFastingProgress(
  startedAt: Date | string,
  targetHours: number,
  now: Date,
): FastingProgress {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt
  const elapsedSeconds = Math.max(0, (now.getTime() - start.getTime()) / 1000)
  const elapsedHours = elapsedSeconds / 3600
  const targetSeconds = targetHours * 3600
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds)
  const percent = targetSeconds > 0 ? (elapsedSeconds / targetSeconds) * 100 : 0
  const isTargetReached = elapsedSeconds >= targetSeconds

  return {
    elapsedSeconds,
    elapsedHours,
    targetHours,
    remainingSeconds,
    remainingLabel: isTargetReached
      ? 'Meta atingida'
      : roundUpDurationLabel(remainingSeconds / 3600),
    targetTimeLabel: formatTime(
      new Date(start.getTime() + targetSeconds * 1000),
    ),
    percent,
    percentCapped: Math.min(100, percent),
    isTargetReached,
  }
}

export function fastingDurationHours(
  session: FastingSession,
  now: Date,
): number {
  const start = new Date(session.startedAt).getTime()
  const end = session.endedAt
    ? new Date(session.endedAt).getTime()
    : now.getTime()

  return Math.max(0, (end - start) / MS_PER_HOUR)
}

export function sessionMeetsGoal(session: FastingSession, now: Date): boolean {
  return (
    fastingDurationHours(session, now) >=
    session.targetHours - MINUTE_TOLERANCE_HOURS
  )
}
