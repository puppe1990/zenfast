import type { MetabolicStage } from '#/domain/metabolic'
import type { Protocol } from '#/domain/types'

export interface ActiveProtocolCardProps {
  protocol: Protocol
  goalHours: number
  adherencePercent: number
  adherenceMet: number
  adherenceTotal: number
  currentStage: MetabolicStage | null
  onEditGoals: () => void
}

const RING_RADIUS = 30
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function ActiveProtocolCard({
  protocol,
  goalHours,
  adherencePercent,
  adherenceMet,
  adherenceTotal,
  currentStage,
  onEditGoals,
}: ActiveProtocolCardProps) {
  const progressOffset =
    RING_CIRCUMFERENCE * (1 - Math.min(100, adherencePercent) / 100)

  return (
    <section className="relative overflow-hidden rounded-lg bg-surface-container-high shadow-xl p-space-md">
      <div className="absolute top-0 right-0 w-36 h-36 bg-primary-container/15 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between pb-space-sm mb-space-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-badge text-label-badge font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Ativo Agora
          </span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">
            Sincronizado
          </span>
        </div>
        <button
          className="flex items-center gap-1 text-primary hover:text-primary-fixed-dim transition-colors text-xs font-semibold py-1 px-2 rounded-full bg-surface-container"
          onClick={onEditGoals}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Editar Metas
        </button>
      </div>

      <div className="flex items-center gap-space-md">
        <div className="relative flex-shrink-0 w-20 h-20 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox="0 0 72 72"
          >
            <circle
              className="text-surface-variant fill-none"
              cx="36"
              cy="36"
              r={RING_RADIUS}
              stroke="currentColor"
              strokeWidth="5"
            />
            <circle
              className="text-primary-container fill-none drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              cx="36"
              cy="36"
              r={RING_RADIUS}
              stroke="currentColor"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              strokeWidth="5"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-timer-display-mobile text-sm font-bold text-on-surface leading-none tabular-nums">
              {goalHours}:{24 - goalHours}
            </span>
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase mt-0.5">
              {protocol.method}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
            {protocol.name}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            {goalHours}h jejum • {24 - goalHours}h alimentação aberta
            {goalHours === protocol.fastingHours
              ? null
              : ` • ${protocol.name} sugere ${protocol.fastingHours}h`}
          </p>
          <div className="mt-space-sm flex items-center gap-space-md flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[16px]">
                check_circle
              </span>
              <span className="font-label-badge text-label-badge text-on-surface">
                Adesão:{' '}
                <strong className="text-secondary font-timer-display-mobile text-xs tabular-nums">
                  {adherencePercent}%
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">
                local_fire_department
              </span>
              <span className="font-label-badge text-label-badge text-on-surface">
                Fase:{' '}
                <span className="text-primary font-semibold">
                  {currentStage?.badge ?? 'Repouso metabólico'}
                </span>
              </span>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant/70 mt-1 tabular-nums">
            {adherenceMet} de {adherenceTotal} jejuns dentro da meta (30 dias)
          </p>
        </div>
      </div>
    </section>
  )
}
