import { formatDecimal, formatMonthDay } from '#/domain/format'
import type { WeightProgress } from '#/domain/weight'

export interface WeightCardProps {
  progress: WeightProgress | null
  targetWeightKg: number | null
  onLog: () => void
}

function buildSparkline(series: number[]) {
  const points = series.slice(-24)
  if (points.length < 2) {
    return null
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const width = 320
  const height = 80

  const coordinates = points.map((value, index) => {
    const x = (index / (points.length - 1)) * width
    const y = ((value - min) / range) * height

    return { x, y }
  })

  const line = coordinates
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)},${point.y.toFixed(1)}`,
    )
    .join(' ')
  const area = `${line} L ${width},${height} L 0,${height} Z`

  return { line, area, coordinates }
}

export function WeightCard({
  progress,
  targetWeightKg,
  onLog,
}: WeightCardProps) {
  const sparkline = progress ? buildSparkline(progress.series) : null

  return (
    <div className="rounded-lg bg-surface-container-low p-5 shadow-lg relative">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">
            Composição Corporal
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">
            Progresso de Peso
          </h2>
        </div>
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-secondary-container text-on-secondary font-label-badge text-label-badge font-bold transition-all active:scale-95 shadow-[0_0_12px_rgba(0,165,114,0.3)]"
          onClick={onLog}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Registrar Peso
        </button>
      </div>

      {progress ? (
        <>
          <div className="flex items-end justify-between mt-4">
            <div>
              <span className="font-body-sm text-body-sm text-on-surface-variant block">
                Início ({formatMonthDay(progress.startDate)})
              </span>
              <span className="font-timer-display-mobile text-timer-display-mobile text-on-surface-variant font-bold tabular-nums">
                {formatDecimal(progress.startWeightKg)}{' '}
                <span className="text-sm font-normal">kg</span>
              </span>
            </div>
            <div className="flex flex-col items-center px-2 pb-1">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                {progress.deltaKg <= 0 ? 'trending_down' : 'trending_up'}
              </span>
              <span className="font-label-caps text-label-caps text-secondary font-bold tabular-nums">
                {formatDecimal(progress.deltaKg)} kg
              </span>
            </div>
            <div className="text-right">
              <span className="font-body-sm text-body-sm text-secondary block font-medium">
                Atual (Hoje)
              </span>
              <span className="font-timer-display-mobile text-timer-display-mobile text-secondary font-bold tabular-nums">
                {formatDecimal(progress.currentWeightKg)}{' '}
                <span className="text-sm font-normal">kg</span>
              </span>
            </div>
          </div>

          {sparkline ? (
            <div className="mt-3 relative w-full h-24 overflow-hidden rounded-md bg-surface-container/60 p-2">
              <svg
                className="w-full h-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 320 80"
              >
                <defs>
                  <linearGradient
                    id="weightGlow"
                    x1="0%"
                    x2="0%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#4edea3" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4edea3" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={sparkline.area} fill="url(#weightGlow)" />
                <path
                  d={sparkline.line}
                  stroke="#4edea3"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                {sparkline.coordinates.map((point, index) => (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="#4edea3"
                    key={index}
                    r={index === sparkline.coordinates.length - 1 ? 5 : 3}
                  />
                ))}
              </svg>
              <div className="absolute bottom-2 left-3 font-label-caps text-label-caps text-on-surface-variant">
                {formatMonthDay(progress.startDate)}
              </div>
              <div className="absolute bottom-2 right-3 font-label-caps text-label-caps text-secondary font-bold tabular-nums">
                Hoje: {formatDecimal(progress.currentWeightKg)} kg
              </div>
            </div>
          ) : null}

          <div className="mt-4 pt-2">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">
                {targetWeightKg === null
                  ? 'Defina uma meta de peso no perfil'
                  : `Progresso rumo aos ${formatDecimal(targetWeightKg)} kg (Meta)`}
              </span>
              <span className="font-label-caps text-label-caps text-secondary font-bold tabular-nums">
                {progress.percentToGoal}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-700"
                style={{ width: `${progress.percentToGoal}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="font-body-md text-body-md text-on-surface-variant mt-4">
          Nenhum registro de peso ainda. Registre o primeiro para acompanhar a
          composição corporal.
        </p>
      )}
    </div>
  )
}
