import { formatDecimal } from '#/domain/format'
import type { Efficacy, MonthlyHours, StreakStats } from '#/domain/stats'

export interface KpiGridProps {
  streak: StreakStats
  monthly: MonthlyHours
  efficacy: Efficacy
  weightDeltaKg: number | null
  weightTargetDeltaKg: number | null
}

function KpiCard({
  label,
  icon,
  tone,
  children,
}: {
  label: string
  icon: string
  tone: 'primary' | 'secondary' | 'tertiary'
  children: React.ReactNode
}) {
  const toneClasses = {
    primary: {
      glow: 'bg-primary/10',
      badge:
        'bg-primary/15 text-primary shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    },
    secondary: {
      glow: 'bg-secondary/10',
      badge: 'bg-secondary/15 text-secondary',
    },
    tertiary: {
      glow: 'bg-tertiary/10',
      badge: 'bg-tertiary/15 text-tertiary',
    },
  }[tone]

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-container-low p-4 flex flex-col justify-between shadow-md">
      <div
        className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-xl pointer-events-none ${toneClasses.glow}`}
      />
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
          {label}
        </span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${toneClasses.badge}`}
        >
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export function KpiGrid({
  streak,
  monthly,
  efficacy,
  weightDeltaKg,
  weightTargetDeltaKg,
}: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <KpiCard icon="local_fire_department" label="Sequência" tone="primary">
        <div className="flex items-baseline gap-1">
          <span className="font-timer-display-mobile text-timer-display-mobile text-primary font-bold tabular-nums">
            {streak.current}
          </span>
          <span className="font-body-md text-body-md text-on-surface-variant font-semibold">
            Dias
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1 tabular-nums">
          <span className="material-symbols-outlined text-[14px] text-primary">
            emoji_events
          </span>
          Recorde: {streak.record} dias
        </p>
      </KpiCard>

      <KpiCard icon="timelapse" label="Neste Mês" tone="secondary">
        <div className="flex items-baseline gap-1">
          <span className="font-timer-display-mobile text-timer-display-mobile text-on-surface font-bold tabular-nums">
            {Math.round(monthly.hours)}
          </span>
          <span className="font-body-md text-body-md text-on-surface-variant font-semibold">
            horas
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-secondary font-medium mt-1 flex items-center gap-0.5 tabular-nums">
          <span className="material-symbols-outlined text-[14px]">
            {monthly.deltaHours >= 0 ? 'trending_up' : 'trending_down'}
          </span>
          {formatDecimal(monthly.deltaHours)}h vs mês passado
        </p>
      </KpiCard>

      <KpiCard icon="verified" label="Eficácia" tone="tertiary">
        <div className="flex items-baseline gap-1">
          <span className="font-timer-display-mobile text-timer-display-mobile text-on-surface font-bold tabular-nums">
            {efficacy.percent}%
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 tabular-nums">
          {efficacy.met} de {efficacy.total} metas
        </p>
      </KpiCard>

      <KpiCard icon="scale" label="Peso Total" tone="secondary">
        <div className="flex items-baseline gap-1">
          <span className="font-timer-display-mobile text-timer-display-mobile text-secondary font-bold tabular-nums">
            {weightDeltaKg === null ? '--' : formatDecimal(weightDeltaKg)}
          </span>
          <span className="font-body-md text-body-md text-on-surface-variant font-semibold">
            kg
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 tabular-nums">
          {weightTargetDeltaKg === null
            ? 'Defina sua meta'
            : `Meta: ${formatDecimal(weightTargetDeltaKg)} kg`}
        </p>
      </KpiCard>
    </div>
  )
}
