import type { Biomarker, Protocol } from '#/domain/types'
import { TONE_TEXT } from './tone'

export interface ProtocolCardProps {
  protocol: Protocol
  isActive: boolean
  onActivate: (protocolId: number) => void
  activating?: boolean
}

const CHIP_TONE: Record<string, string> = {
  primary: 'bg-primary-container/20 text-primary',
  secondary: 'bg-secondary-container/20 text-secondary',
  tertiary: 'bg-tertiary-container/20 text-tertiary',
  error: 'bg-error-container/40 text-error',
  neutral: 'bg-surface-variant text-on-surface',
}

const VALUE_TONE: Record<Biomarker['tone'], string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  error: 'text-error',
  neutral: 'text-on-surface',
}

export function ProtocolCard({
  protocol,
  isActive,
  onActivate,
  activating = false,
}: ProtocolCardProps) {
  return (
    <article className="group relative bg-surface-container rounded-lg p-space-md shadow-md transition-all duration-200 hover:bg-surface-container-high">
      <div className="flex items-start justify-between gap-space-sm mb-space-sm">
        <div className="flex flex-wrap items-center gap-2">
          {protocol.tagline ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-badge text-label-badge font-bold ${
                CHIP_TONE[protocol.badgeTone] ?? CHIP_TONE.neutral
              }`}
            >
              {protocol.category === 'iniciante' &&
              protocol.tagline === 'Mais Popular' ? (
                <span className="material-symbols-outlined text-[14px]">
                  star
                </span>
              ) : null}
              {protocol.tagline}
            </span>
          ) : null}
          {protocol.badgeLabel ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-variant text-on-surface font-label-caps text-label-caps">
              {protocol.badgeLabel}
            </span>
          ) : null}
        </div>
        <div className="text-right">
          <span
            className={`font-timer-display-mobile text-headline-sm font-bold tabular-nums ${TONE_TEXT[protocol.badgeTone === 'neutral' ? 'primary' : protocol.badgeTone]}`}
          >
            {protocol.fastingHours}:{protocol.eatingHours}
          </span>
        </div>
      </div>

      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
        {protocol.name}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
        {protocol.description}
      </p>

      <div className="mt-space-md pt-space-sm grid grid-cols-3 gap-2">
        {protocol.biomarkers.map((biomarker) => (
          <div
            className="flex items-center gap-1.5 p-2 rounded-2xl bg-surface-container-lowest/60 min-w-0"
            key={biomarker.label}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${VALUE_TONE[biomarker.tone]}`}
            >
              {biomarker.icon}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-[10px] text-on-surface-variant">
                {biomarker.label}
              </span>
              <span
                className={`font-label-badge text-xs font-semibold truncate ${VALUE_TONE[biomarker.tone]}`}
              >
                {biomarker.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-space-md flex items-center justify-between pt-2 gap-2">
        <div className="flex items-center gap-1.5 text-on-surface-variant font-label-caps text-label-caps">
          <span className="material-symbols-outlined text-[16px] text-primary">
            schedule
          </span>
          Janela Sugerida: {protocol.suggestedWindowStart} -{' '}
          {protocol.suggestedWindowEnd}
        </div>
        <button
          className={`px-4 py-2 rounded-full font-label-badge text-label-badge font-bold transition-transform active:scale-95 shrink-0 disabled:opacity-60 ${
            isActive
              ? 'bg-primary-container text-on-primary-container shadow-sm'
              : 'bg-surface-bright hover:bg-surface-variant text-on-surface'
          }`}
          disabled={isActive || activating}
          onClick={() => onActivate(protocol.id)}
          type="button"
        >
          {isActive
            ? 'Plano Selecionado'
            : `Ativar ${protocol.fastingHours}:${protocol.eatingHours}`}
        </button>
      </div>
    </article>
  )
}
