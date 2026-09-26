export interface NextWindowCardProps {
  startLabel: string
  endLabel: string
  durationHours: number
  hint: string | null
}

export function NextWindowCard({
  startLabel,
  endLabel,
  durationHours,
  hint,
}: NextWindowCardProps) {
  return (
    <div className="flex items-center gap-space-md p-space-md rounded-2xl bg-surface-container-low shadow-sm">
      <div className="w-11 h-11 rounded-2xl bg-secondary-container/20 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-secondary text-[24px]">
          restaurant_menu
        </span>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-caps text-label-caps text-secondary uppercase font-bold tracking-wider">
            Próxima Janela
          </span>
          <span className="font-label-badge text-label-badge text-on-surface-variant font-medium">
            Duração: {durationHours}h
          </span>
        </div>
        <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5 truncate tabular-nums">
          {startLabel} às {endLabel}
        </span>
        {hint ? (
          <span className="font-body-sm text-body-sm text-on-surface-variant/80 line-clamp-2">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  )
}
