export const WATER_GOAL_SEGMENTS = 5

export interface HydrationProgress {
  consumedMl: number
  goalMl: number
  percent: number
  segments: number[]
  isGoalReached: boolean
}

export function hydrationSegments(
  consumedMl: number,
  goalMl: number,
  count: number = WATER_GOAL_SEGMENTS,
): number[] {
  if (goalMl <= 0 || count <= 0) {
    return []
  }

  const perSegment = goalMl / count
  const consumed = Math.max(0, consumedMl)

  return Array.from({ length: count }, (_, index) => {
    const filled = consumed - index * perSegment
    return Math.min(1, Math.max(0, filled / perSegment))
  })
}

export function hydrationProgress(
  consumedMl: number,
  goalMl: number,
): HydrationProgress {
  const percent =
    goalMl <= 0 ? 0 : Math.min(100, Math.round((consumedMl / goalMl) * 100))

  return {
    consumedMl,
    goalMl,
    percent,
    segments: hydrationSegments(consumedMl, goalMl),
    isGoalReached: goalMl > 0 && consumedMl >= goalMl,
  }
}
