import { formatRelativeTime, formatWater } from '#/domain/format'

export interface HydrationCardProps {
  consumedMl: number
  goalMl: number
  segments: number[]
  lastLogAt: string | null
  now: Date
  onAdd: () => void
  disabled?: boolean
}

export function HydrationCard({
  consumedMl,
  goalMl,
  segments,
  lastLogAt,
  now,
  onAdd,
  disabled = false,
}: HydrationCardProps) {
  return (
    <div className="p-space-md rounded-2xl bg-surface-container-high/50 backdrop-blur-md flex flex-col justify-between shadow-sm min-h-[148px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary-fixed-dim text-[20px]">
            water_drop
          </span>
          <span className="font-label-badge text-label-badge text-on-surface font-semibold">
            Hidratação
          </span>
        </div>
        <button
          aria-label="Adicionar 250ml de água"
          className="w-7 h-7 rounded-full bg-surface-container-highest text-secondary-fixed-dim flex items-center justify-center hover:bg-secondary-container hover:text-on-secondary transition-all active:scale-90 disabled:opacity-50"
          disabled={disabled}
          onClick={onAdd}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>
      </div>
      <div className="my-2">
        <div className="flex items-baseline gap-1">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold tabular-nums">
            {formatWater(consumedMl)}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">
            / {formatWater(goalMl)} ml
          </span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {segments.map((fill, index) => (
            <span
              className="w-full h-1.5 rounded-full overflow-hidden bg-surface-container-highest"
              key={index}
            >
              <span
                className="block h-full rounded-full bg-secondary-fixed-dim transition-all duration-500"
                style={{ width: `${Math.round(fill * 100)}%` }}
              />
            </span>
          ))}
        </div>
      </div>
      <span className="font-label-caps text-label-caps text-on-surface-variant/80 text-[10px]">
        {lastLogAt
          ? `+250ml ${formatRelativeTime(lastLogAt, now)}`
          : 'Nenhum registro hoje'}
      </span>
    </div>
  )
}
