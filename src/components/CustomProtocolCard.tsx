import { useState } from 'react'

import { CUSTOM_PROTOCOL_BOUNDS } from '#/domain/protocol-catalog'

export interface CustomProtocolCardProps {
  onConfigure: (input: { fastingHours: number; windowStart: string }) => void
  pending?: boolean
}

export function CustomProtocolCard({
  onConfigure,
  pending = false,
}: CustomProtocolCardProps) {
  const [fastingHours, setFastingHours] = useState(17)
  const [windowStart, setWindowStart] = useState('13:00')
  const eatingHours = 24 - fastingHours

  return (
    <section className="relative overflow-hidden rounded-lg bg-surface-container-high p-space-md shadow-xl">
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-start gap-space-md">
        <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary flex-shrink-0">
          <span className="material-symbols-outlined text-[28px]">tune</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Criar Protocolo Personalizado
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-label-caps text-label-caps font-bold">
              PRO
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Ajuste horários específicos para sincronizar com sua rotina de
            treinos pesados, plantões ou reuniões.
          </p>

          <div className="mt-space-md space-y-2 bg-surface-container-lowest/70 p-3 rounded-2xl">
            <div className="flex justify-between items-center text-xs gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Jejum Personalizado
              </span>
              <span className="font-timer-display-mobile text-xs font-bold text-primary tabular-nums">
                {fastingHours}h Jejum / {eatingHours}h Janela
              </span>
            </div>
            <input
              aria-label="Horas de jejum"
              className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
              max={CUSTOM_PROTOCOL_BOUNDS.maxFastingHours}
              min={CUSTOM_PROTOCOL_BOUNDS.minFastingHours}
              onChange={(event) => setFastingHours(Number(event.target.value))}
              type="range"
              value={fastingHours}
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-label-caps">
              <span>{CUSTOM_PROTOCOL_BOUNDS.minFastingHours}h</span>
              <span>16h</span>
              <span>20h</span>
              <span>{CUSTOM_PROTOCOL_BOUNDS.maxFastingHours}h</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <label
                className="font-label-caps text-label-caps text-on-surface-variant"
                htmlFor="custom-window-start"
              >
                Início da janela
              </label>
              <input
                className="bg-surface-container rounded-2xl px-3 py-1.5 text-on-surface font-label-badge text-label-badge focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
                id="custom-window-start"
                onChange={(event) => setWindowStart(event.target.value)}
                type="time"
                value={windowStart}
              />
            </div>
          </div>

          <button
            className="mt-space-md w-full py-3 rounded-full bg-gradient-to-r from-primary-container to-surface-tint text-on-primary-container font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 active:scale-98 transition-transform disabled:opacity-60"
            disabled={pending}
            onClick={() => onConfigure({ fastingHours, windowStart })}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_circle
            </span>
            Configurar Meu Próprio Horário
          </button>
        </div>
      </div>
    </section>
  )
}
