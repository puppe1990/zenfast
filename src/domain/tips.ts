import type { Tip } from './types'

export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - start.getTime()

  return Math.floor(diff / 86_400_000) + 1
}

export function tipForDay(tips: Tip[], date: Date, offset = 0): Tip | null {
  if (tips.length === 0) {
    return null
  }

  const index = (dayOfYear(date) - 1 + offset) % tips.length

  return tips[index] ?? tips[0]
}
