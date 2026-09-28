import { useState } from 'react'

import { DETAIL_TONE_TEXT } from './tone'
import type { HistoryEntry } from '#/server/services/progress'

export interface HistoryListProps {
  entries: HistoryEntry[]
  initialVisible?: number
  onCreate?: () => void
  onEdit?: (entry: HistoryEntry) => void
  onDelete?: (entry: HistoryEntry) => void
}

function entryIcon(entry: HistoryEntry) {
  if (entry.statusTone === 'secondary') {
    return {
      icon: 'check_circle',
      classes: 'bg-secondary-container/20 text-secondary',
    }
  }

  if (entry.statusTone === 'tertiary') {
    return { icon: 'bolt', classes: 'bg-tertiary/15 text-tertiary' }
  }

  return { icon: 'done', classes: 'bg-primary/20 text-primary' }
}

export function HistoryList({
  entries,
  initialVisible = 3,
  onCreate,
  onEdit,
  onDelete,
}: HistoryListProps) {
  const [expanded, setExpanded] = useState<number | null>(
    entries[0]?.id ?? null,
  )
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? entries : entries.slice(0, initialVisible)

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">
            history
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Histórico Recente
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {onCreate ? (
            <button
              className="flex items-center gap-1 font-label-badge text-label-badge text-primary font-bold hover:underline"
              onClick={onCreate}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_circle
              </span>
              Adicionar
            </button>
          ) : null}
          {entries.length > initialVisible ? (
            <button
              className="font-label-badge text-label-badge text-primary font-bold hover:underline"
              onClick={() => setShowAll((value) => !value)}
              type="button"
            >
              {showAll ? 'Ver Menos' : 'Ver Todos'}
            </button>
          ) : null}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg bg-surface-container-low p-4 font-body-sm text-body-sm text-on-surface-variant">
          Nenhum jejum no histórico ainda. Use “Adicionar” para registrar um
          jejum passado.
        </p>
      ) : null}

      <div className="space-y-2.5">
        {visible.map((entry) => {
          const isOpen = expanded === entry.id
          const { icon, classes } = entryIcon(entry)

          return (
            <div
              className="rounded-lg bg-surface-container-low p-4 shadow-sm transition-all duration-200"
              key={entry.id}
            >
              <button
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between text-left"
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${classes}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body-md text-body-md text-on-surface font-bold">
                        {entry.dateLabel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-badge text-label-badge font-bold ${classes}`}
                      >
                        {entry.statusLabel}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">
                      Início {entry.startedAtLabel} • Término{' '}
                      {entry.endedAtLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-timer-display-mobile text-timer-display-mobile text-on-surface text-[18px] font-bold tabular-nums">
                    {entry.durationLabel}
                  </span>
                  <span
                    className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </div>
              </button>

              {isOpen ? (
                <div className="mt-3 pt-3 border-t border-surface-container-high/40 text-sm space-y-2">
                  {entry.details.map((detail) => (
                    <div
                      className="flex justify-between gap-3 font-body-sm text-body-sm"
                      key={`${entry.id}-${detail.label}`}
                    >
                      <span className="text-on-surface-variant">
                        {detail.label}:
                      </span>
                      <span
                        className={`font-medium text-right ${DETAIL_TONE_TEXT[detail.tone]}`}
                      >
                        {detail.value}
                      </span>
                    </div>
                  ))}

                  {onEdit || onDelete ? (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      {onEdit ? (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:text-primary font-label-badge text-label-badge transition-colors"
                          onClick={() => onEdit(entry)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                          Editar
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-error/10 text-error font-label-badge text-label-badge transition-colors"
                          onClick={() => onDelete(entry)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            delete
                          </span>
                          Excluir
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
