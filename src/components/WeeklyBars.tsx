import { formatHoursValue } from '#/domain/format'
import type { WeekBar } from '#/domain/stats'

export interface WeeklyBarsProps {
  bars: WeekBar[]
  totalHours: number
  averageHours: number
  averageDelta: number
  verdict: string
  targetHours: number
}

function barClasses(bar: WeekBar): string {
  if (bar.hours <= 0) {
    return 'bg-surface-container-highest/60'
  }

  if (!bar.meetsTarget) {
    return 'bg-surface-container-highest'
  }

  if (bar.isBest) {
    return 'bg-gradient-to-t from-tertiary/40 to-tertiary shadow-[0_0_14px_rgba(213,195,255,0.35)]'
  }

  return 'bg-gradient-to-t from-primary/40 to-primary shadow-[0_0_10px_rgba(245,158,11,0.2)]'
}

function valueClasses(bar: WeekBar): string {
  if (!bar.meetsTarget) {
    return 'text-on-surface-variant'
  }

  return bar.isBest ? 'text-tertiary font-bold' : 'text-secondary font-bold'
}

export function WeeklyBars({
  bars,
  totalHours,
  averageHours,
  averageDelta,
  verdict,
  targetHours,
}: WeeklyBarsProps) {
  const scaleMax = Math.max(
    targetHours * 1.25,
    ...bars.map((bar) => bar.hours),
    1,
  )

  return (
    <div className="rounded-lg bg-surface-container-low p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">
              Consistência
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">
              Meta {targetHours}h
            </span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
            Esta Semana
          </h2>
        </div>
        <div className="text-right">
          <span className="font-timer-display-mobile text-timer-display-mobile text-primary font-bold tabular-nums">
            {formatHoursValue(totalHours)}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant block">
            horas totais
          </span>
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        <div className="absolute left-0 right-0 top-16 flex items-center z-10 pointer-events-none">
          <div className="w-full border-t border-dashed border-primary/30" />
          <span className="pl-2 font-label-caps text-label-caps text-primary/80 whitespace-nowrap">
            Meta {targetHours}h
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
          {bars.map((bar) => (
            <div
              className="flex flex-col items-center gap-2 h-full justify-end group"
              key={bar.label}
            >
              <span
                className={`font-label-caps text-label-caps text-[10px] tabular-nums ${
                  bar.isToday
                    ? 'text-primary font-bold animate-pulse'
                    : bar.hours > 0
                      ? valueClasses(bar)
                      : 'text-on-surface-variant'
                }`}
              >
                {formatHoursValue(bar.hours)}
              </span>
              <div
                className={`w-full max-w-[28px] rounded-t-full transition-transform active:scale-95 ${barClasses(
                  bar,
                )}`}
                style={{
                  height: `${Math.max(4, Math.round((bar.hours / scaleMax) * 100))}%`,
                }}
              />
              <span
                className={`font-body-sm text-body-sm font-medium ${
                  bar.isToday
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                {bar.isToday ? 'Hoje' : bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 flex items-center justify-between rounded-lg bg-surface-container px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            bolt
          </span>
          <span className="font-body-sm text-body-sm text-on-surface tabular-nums">
            Média de <strong>{formatHoursValue(averageHours)}h</strong> por dia
            ({averageDelta >= 0 ? '+' : ''}
            {formatHoursValue(averageDelta)}h vs meta).
          </span>
        </div>
        <span
          className={`font-label-caps text-label-caps font-bold uppercase tracking-wider ${
            averageDelta >= 0 ? 'text-secondary' : 'text-primary'
          }`}
        >
          {verdict}
        </span>
      </div>
    </div>
  )
}
