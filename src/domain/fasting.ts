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
