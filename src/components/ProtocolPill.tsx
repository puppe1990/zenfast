import { Link } from '@tanstack/react-router'

import { formatDayPhrase, formatTime } from '#/domain/format'

export interface ProtocolPillProps {
  protocolName: string
  targetHours: number
  activeSession: { startedAt: string } | null
  now: Date
}

export function ProtocolPill({
  protocolName,
  targetHours,
  activeSession,
  now,
}: ProtocolPillProps) {
  return (
    <div className="flex items-center justify-between p-space-md rounded-2xl bg-surface-container/70 backdrop-blur-md shadow-md mt-space-sm">
      <div className="flex items-center gap-space-sm min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[20px]">
            hourglass_top
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-label-badge text-label-badge text-primary uppercase font-bold tracking-wider">
              {`Protocolo ${targetHours}:${24 - targetHours}`}
            </span>
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                activeSession
                  ? 'bg-secondary animate-pulse'
                  : 'bg-on-surface-variant'
              }`}
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {activeSession ? 'Janela de Jejum' : 'Sem jejum ativo'}
            </span>
          </div>
          <span className="font-label-caps text-label-caps text-on-surface-variant/80 mt-0.5">
            {activeSession
              ? `Iniciado ${formatDayPhrase(activeSession.startedAt, now)} às ${formatTime(
                  activeSession.startedAt,
                )}`
              : `${protocolName} pronto para começar`}
          </span>
        </div>
      </div>
      <Link
        aria-label="Editar protocolo"
        className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 shrink-0"
        to="/planos"
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
      </Link>
    </div>
  )
}
