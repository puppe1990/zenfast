import type { MetabolicStage } from '#/domain/metabolic'
import { TONE_CHIP, TONE_SOFT_BG, TONE_TEXT } from './tone'

export interface PhaseCardProps {
  stage: MetabolicStage
}

export function PhaseCard({ stage }: PhaseCardProps) {
  return (
    <div className="p-space-md rounded-2xl bg-surface-container-high/60 backdrop-blur-xl shadow-lg relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-start gap-space-sm relative z-10">
        <div
          className={`w-10 h-10 rounded-xl ${TONE_SOFT_BG[stage.tone]} flex items-center justify-center shrink-0 shadow-inner`}
        >
          <span
            className={`material-symbols-outlined ${TONE_TEXT[stage.tone]} text-[22px] animate-pulse`}
          >
            {stage.icon}
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-label-badge text-label-badge uppercase tracking-wider font-bold ${TONE_TEXT[stage.tone]}`}
            >
              Fase Atual
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full font-label-caps text-label-caps font-bold ${TONE_CHIP[stage.tone]}`}
            >
              {stage.badge}
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
            {stage.title}
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed mt-0.5">
            {stage.description}
          </p>
        </div>
      </div>
    </div>
  )
}
