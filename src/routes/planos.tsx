import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { ActiveProtocolCard } from '#/components/ActiveProtocolCard'
import { CustomProtocolCard } from '#/components/CustomProtocolCard'
import { ProtocolCard } from '#/components/ProtocolCard'
import { ProtocolFilters } from '#/components/ProtocolFilters'
import { Sheet } from '#/components/Sheet'
import { useAction } from '#/components/useAction'
import type { ProtocolCategory } from '#/domain/types'
import {
  getProtocols,
  postCreateCustomProtocol,
  postSaveGoals,
  postSelectProtocol,
} from '#/server/actions'

export const Route = createFileRoute('/planos')({
  loader: () => getProtocols(),
  component: ProtocolsScreen,
})

function ProtocolsScreen() {
  const view = Route.useLoaderData()
  const [filter, setFilter] = useState<ProtocolCategory | 'todos'>('todos')
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [targetHours, setTargetHours] = useState(view.profile.dailyTargetHours)

  const selectProtocol = useAction(async (protocolId: number) => {
    await postSelectProtocol({ data: { protocolId } })
  })
  const createCustom = useAction(
    async (input: { fastingHours: number; windowStart: string }) => {
      await postCreateCustomProtocol({ data: input })
    },
  )
  const saveGoals = useAction(async () => {
    await postSaveGoals({ data: { dailyTargetHours: targetHours } })
    setGoalsOpen(false)
  })

  const protocols = useMemo(
    () =>
      filter === 'todos'
        ? view.protocols
        : view.protocols.filter((protocol) => protocol.category === filter),
    [filter, view.protocols],
  )

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
      <div className="flex flex-col w-full px-margin pb-space-xl gap-space-lg select-none">
        <div className="relative pt-space-sm">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-space-xs">
              <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  tune
                </span>
                Arquitetura Metabólica
              </span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold tracking-tight">
                Protocolos de Jejum
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                Escolha o protocolo ideal para o seu objetivo, ritmo biológico e
                rotina diária.
              </p>
            </div>
          </div>
        </div>

        {view.activeProtocol ? (
          <ActiveProtocolCard
            goalHours={view.goalHours}
            updatedAt={view.now}
            adherenceMet={view.adherenceMet}
            adherencePercent={view.adherencePercent}
            adherenceTotal={view.adherenceTotal}
            currentStage={view.currentStage}
            onEditGoals={() => setGoalsOpen(true)}
            protocol={view.activeProtocol}
          />
        ) : null}

        <ProtocolFilters
          active={filter}
          categories={view.categories}
          onChange={setFilter}
        />

        <div className="flex flex-col space-y-space-md">
          {protocols.map((protocol) => (
            <ProtocolCard
              activating={selectProtocol.pending}
              isActive={protocol.id === view.profile.activeProtocolId}
              key={protocol.slug}
              onActivate={(protocolId) => void selectProtocol.run(protocolId)}
              protocol={protocol}
            />
          ))}
        </div>

        <CustomProtocolCard
          onConfigure={(input) => void createCustom.run(input)}
          pending={createCustom.pending}
        />

        {view.tip ? (
          <div className="relative overflow-hidden rounded-lg bg-surface-container p-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary-container/40 to-primary-container/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px] text-on-surface">
                  lightbulb
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                  {view.tip.title}
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">
                  {view.tip.body}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Sheet
        description="Ajuste a meta de horas de jejum do protocolo ativo."
        onClose={() => setGoalsOpen(false)}
        open={goalsOpen}
        title="Editar Metas"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Meta diária de jejum
            </span>
            <span className="font-timer-display-mobile text-xs font-bold text-primary tabular-nums">
              {targetHours}h jejum / {24 - targetHours}h janela
            </span>
          </div>
          <input
            aria-label="Horas de jejum"
            className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
            max={23}
            min={12}
            onChange={(event) => setTargetHours(Number(event.target.value))}
            type="range"
            value={targetHours}
          />
        </div>
        <button
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline-sm text-body-lg font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98 transition-transform disabled:opacity-60"
          disabled={saveGoals.pending}
          onClick={() => void saveGoals.run()}
          type="button"
        >
          {saveGoals.pending ? 'Salvando...' : 'Salvar Meta'}
        </button>
      </Sheet>
    </main>
  )
}
