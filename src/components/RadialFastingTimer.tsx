import { useEffect, useState } from 'react'

import { computeFastingProgress } from '#/domain/fasting'
import type { FastingProgress } from '#/domain/fasting'
import { formatClockFromSeconds } from '#/domain/format'

const RADIUS = 110
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface RadialFastingTimerProps {
  initialProgress: FastingProgress | null
  startedAt: string | null
  targetHours: number
}

export function RadialFastingTimer({
  initialProgress,
  startedAt,
  targetHours,
}: RadialFastingTimerProps) {
  const [progress, setProgress] = useState(initialProgress)

  useEffect(() => {
    if (!startedAt) {
      setProgress(null)
      return
    }

    const tick = () => {
      setProgress(computeFastingProgress(startedAt, targetHours, new Date()))
    }

    tick()
    const interval = window.setInterval(tick, 1000)

    return () => window.clearInterval(interval)
  }, [startedAt, targetHours])

  const percent = progress?.percentCapped ?? 0
  const dashOffset = CIRCUMFERENCE * (1 - percent / 100)

  return (
    <div className="relative flex flex-col items-center justify-center py-space-sm">
      <div className="absolute w-64 h-64 rounded-full bg-primary-container/15 blur-[60px] pointer-events-none -z-10" />
      <div className="relative w-72 h-72 flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox="0 0 260 260"
        >
          <defs>
            <linearGradient
              id="amberGlowGradient"
              x1="0%"
              x2="100%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#ffb95f" />
              <stop offset="100%" stopColor="#ffc174" />
            </linearGradient>
            <filter height="140%" id="softGlow" width="140%" x="-20%" y="-20%">
              <feGaussianBlur result="blur" stdDeviation="4" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle
            className="stroke-surface-container-high"
            cx="130"
            cy="130"
            fill="none"
            opacity="0.4"
            r={RADIUS}
            strokeLinecap="round"
            strokeWidth="12"
          />
          <circle
            className="stroke-surface-container-highest"
            cx="130"
            cy="130"
            fill="none"
            opacity="0.6"
            r={RADIUS}
            strokeDasharray="3 8"
            strokeWidth="12"
          />
          <circle
            className="transition-all duration-1000 ease-out"
            cx="130"
            cy="130"
            fill="none"
            filter="url(#softGlow)"
            r={RADIUS}
            stroke="url(#amberGlowGradient)"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="14"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-space-md pointer-events-none">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
            Tempo decorrido
          </span>
          <div className="flex items-baseline justify-center my-1">
            <span
              className="font-timer-display-mobile text-timer-display-mobile text-on-surface tracking-tighter drop-shadow-sm font-bold tabular-nums"
              role="timer"
            >
              {formatClockFromSeconds(progress?.elapsedSeconds ?? 0)}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 backdrop-blur-md mt-1 shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[14px]">
              restaurant
            </span>
            <span className="font-label-badge text-label-badge text-on-surface font-semibold">
              {progress
                ? progress.isTargetReached
                  ? 'Meta atingida • Janela liberada'
                  : `Faltam ${progress.remainingLabel} • Meta ${progress.targetTimeLabel}`
                : 'Nenhum jejum em andamento'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
