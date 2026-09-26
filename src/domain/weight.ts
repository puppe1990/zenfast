import type { WeightLog } from './types'

export interface WeightProgress {
  startWeightKg: number
  currentWeightKg: number
  startDate: string
  currentDate: string
  deltaKg: number
  remainingKg: number
  percentToGoal: number
  series: number[]
}

export function weightProgress(
  logs: WeightLog[],
  goalWeightKg: number | null,
): WeightProgress | null {
  if (logs.length === 0) {
    return null
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  )

  const start = sorted[0]
  const current = sorted[sorted.length - 1]
  const deltaKg = current.weightKg - start.weightKg
  const denominator = goalWeightKg === null ? 0 : start.weightKg - goalWeightKg

  const rawPercent =
    denominator === 0
      ? 0
      : ((start.weightKg - current.weightKg) / denominator) * 100

  return {
    startWeightKg: start.weightKg,
    currentWeightKg: current.weightKg,
    startDate: start.loggedAt,
    currentDate: current.loggedAt,
    deltaKg: Math.round(deltaKg * 10) / 10,
    remainingKg:
      goalWeightKg === null
        ? 0
        : Math.round((current.weightKg - goalWeightKg) * 10) / 10,
    percentToGoal: Math.min(100, Math.max(0, Math.round(rawPercent))),
    series: sorted.map((log) => log.weightKg),
  }
}
