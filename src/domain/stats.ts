import { fastingDurationHours, sessionMeetsGoal } from './fasting'
import type { FastingSession } from './types'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000
const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export interface StreakStats {
  current: number
  record: number
}

export interface MonthlyHours {
  hours: number
  previousHours: number
  deltaHours: number
}

export interface Efficacy {
  met: number
  total: number
  percent: number
}

export interface WeekBar {
  label: string
  date: string
  hours: number
  meetsTarget: boolean
  isToday: boolean
  isBest: boolean
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function startOfWeek(date: Date): Date {
  const day = startOfDay(date)
  const weekday = (day.getDay() + 6) % 7
  return addDays(day, -weekday)
}

function dayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function sessionEndDate(session: FastingSession, now: Date): Date {
  return new Date(session.endedAt ?? now.getTime())
}

function sessionHours(session: FastingSession, now: Date): number {
  return Math.round(fastingDurationHours(session, now) * 100) / 100
}

export function computeStreak(
  sessions: FastingSession[],
  now: Date,
): StreakStats {
  const goalDays = new Set<string>()

  for (const session of sessions) {
    if (sessionMeetsGoal(session, now)) {
      goalDays.add(dayKey(sessionEndDate(session, now)))
    }
  }

  if (goalDays.size === 0) {
    return { current: 0, record: 0 }
  }

  let cursor = startOfDay(now)
  if (!goalDays.has(dayKey(cursor))) {
    cursor = addDays(cursor, -1)
  }

  let current = 0
  while (goalDays.has(dayKey(cursor))) {
    current += 1
    cursor = addDays(cursor, -1)
  }

  const sortedDays = [...goalDays].sort()
  let record = 0
  let run = 0
  let previous: Date | null = null

  for (const key of sortedDays) {
    const [year, month, day] = key.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    run =
      previous && date.getTime() - previous.getTime() === MS_PER_DAY
        ? run + 1
        : 1
    record = Math.max(record, run)
    previous = date
  }

  return { current, record }
}

export function monthlyHours(
  sessions: FastingSession[],
  now: Date,
): MonthlyHours {
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)

  let hours = 0
  let previousHours = 0

  for (const session of sessions) {
    const end = sessionEndDate(session, now)
    const duration = fastingDurationHours(session, now)

    if (end.getFullYear() === currentYear && end.getMonth() === currentMonth) {
      hours += duration
    } else if (
      end.getFullYear() === previousMonthDate.getFullYear() &&
      end.getMonth() === previousMonthDate.getMonth()
    ) {
      previousHours += duration
    }
  }

  const roundedHours = Math.round(hours * 10) / 10
  const roundedPrevious = Math.round(previousHours * 10) / 10

  return {
    hours: roundedHours,
    previousHours: roundedPrevious,
    deltaHours: Math.round((roundedHours - roundedPrevious) * 10) / 10,
  }
}

export function computeEfficacy(
  sessions: FastingSession[],
  now: Date,
): Efficacy {
  const finished = sessions.filter((session) => session.status !== 'active')
  const met = finished.filter((session) =>
    sessionMeetsGoal(session, now),
  ).length

  return {
    met,
    total: finished.length,
    percent:
      finished.length === 0 ? 0 : Math.round((met / finished.length) * 100),
  }
}

export function weeklyBars(
  sessions: FastingSession[],
  now: Date,
  targetHours: number,
): WeekBar[] {
  const weekStart = startOfWeek(now)
  const buckets = WEEK_LABELS.map((label, index) => {
    const date = addDays(weekStart, index)

    return {
      label,
      date,
      hours: 0,
    }
  })

  for (const session of sessions) {
    const end = sessionEndDate(session, now)
    const bucket = buckets.find(
      (entry) =>
        entry.date.getFullYear() === end.getFullYear() &&
        entry.date.getMonth() === end.getMonth() &&
        entry.date.getDate() === end.getDate(),
    )

    if (bucket) {
      bucket.hours += sessionHours(session, now)
    }
  }

  const bestHours = Math.max(...buckets.map((bucket) => bucket.hours))
  const today = startOfDay(now)

  return buckets.map((bucket) => ({
    label: bucket.label,
    date: bucket.date.toISOString(),
    hours: bucket.hours,
    meetsTarget: bucket.hours > 0 && bucket.hours >= targetHours,
    isToday: bucket.date.getTime() === today.getTime(),
    isBest: bestHours > 0 && bucket.hours === bestHours,
  }))
}

export function averageHours(bars: WeekBar[]): number {
  if (bars.length === 0) {
    return 0
  }

  return bars.reduce((total, bar) => total + bar.hours, 0) / bars.length
}

export function longestFastHours(
  sessions: FastingSession[],
  now: Date,
): number {
  return sessions.reduce(
    (longest, session) => Math.max(longest, fastingDurationHours(session, now)),
    0,
  )
}

export function todayHours(sessions: FastingSession[], now: Date): number {
  const today = startOfDay(now)
  const hours = sessions
    .filter((session) => {
      const end = sessionEndDate(session, now)
      return (
        end.getFullYear() === today.getFullYear() &&
        end.getMonth() === today.getMonth() &&
        end.getDate() === today.getDate()
      )
    })
    .reduce((total, session) => total + fastingDurationHours(session, now), 0)

  return Math.round(hours * 100) / 100
}

export function hoursSince(date: Date | string, now: Date): number {
  const value = typeof date === 'string' ? new Date(date) : date
  return Math.max(0, (now.getTime() - value.getTime()) / MS_PER_HOUR)
}

export function daysSince(date: Date | string, now: Date): number {
  const value = typeof date === 'string' ? new Date(date) : date
  return Math.max(
    0,
    Math.round(
      (startOfDay(now).getTime() - startOfDay(value).getTime()) / MS_PER_DAY,
    ),
  )
}
