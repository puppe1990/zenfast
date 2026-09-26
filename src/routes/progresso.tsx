import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { AchievementsGrid } from '#/components/AchievementsGrid'
import { HistoryList } from '#/components/HistoryList'
import { KpiGrid } from '#/components/KpiGrid'
import { Sheet } from '#/components/Sheet'
import { useAction } from '#/components/useAction'
import { WeeklyBars } from '#/components/WeeklyBars'
import { WeightCard } from '#/components/WeightCard'
import { formatDecimal, formatTime } from '#/domain/format'
import { getProgress, postSaveWeight } from '#/server/actions'

export const Route = createFileRoute('/progresso')({
  loader: () => getProgress(),
  component: ProgressScreen,
})

function ProgressScreen() {
  const view = Route.useLoaderData()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [weight, setWeight] = useState(
    String(view.weight?.currentWeightKg ?? ''),
  )

  const saveWeight = useAction(async () => {
    await postSaveWeight({ data: { weightKg: Number(weight) } })
    setSheetOpen(false)
  })

  const weightTargetDelta =
    view.weight && view.targetWeightKg !== null
      ? view.targetWeightKg - view.weight.startWeightKg
      : null

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
      <div className="flex flex-col w-full px-margin pb-space-xl gap-space-lg">
        <div className="relative w-full pt-space-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">
                Bio-telemetria Pessoal
              </span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold tracking-tight mt-0.5">
                Evolução Metabólica
              </h1>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md shrink-0">
              <span className="material-symbols-outlined text-secondary text-[16px]">
                sync
              </span>
              <span className="font-label-badge text-label-badge text-secondary font-semibold tabular-nums">
                {`Atualizado às ${formatTime(view.now)}`}
              </span>
            </div>
          </div>
        </div>

        <KpiGrid
          efficacy={view.efficacy}
          monthly={view.monthly}
          streak={view.streak}
          weightDeltaKg={view.weight?.deltaKg ?? null}
          weightTargetDeltaKg={weightTargetDelta}
        />

        <WeeklyBars
          averageDelta={view.averageDelta}
          averageHours={view.averageHours}
          bars={view.weekBars}
          targetHours={view.targetHours}
          totalHours={view.weekBars.reduce(
            (total, bar) => total + bar.hours,
            0,
          )}
          verdict={view.insightVerdict}
        />

        <WeightCard
          onLog={() => setSheetOpen(true)}
          progress={view.weight}
          targetWeightKg={view.targetWeightKg}
        />

        <AchievementsGrid
          achievements={view.achievements}
          unlockedCount={view.unlockedCount}
        />

        <HistoryList entries={view.history} />
      </div>

      <Sheet
        description="Mantenha seu algoritmo bio-metabólico calibrado."
        onClose={() => setSheetOpen(false)}
        open={sheetOpen}
        title="Novo Registro de Peso"
      >
        <div className="space-y-2">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="weight-input"
          >
            Peso Atual (kg)
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-timer-display text-headline-lg font-bold focus:outline-none focus:ring-2 focus:ring-secondary/50 tabular-nums"
              id="weight-input"
              onChange={(event) => setWeight(event.target.value)}
              step="0.1"
              type="number"
              value={weight}
            />
            <span className="absolute right-5 font-body-lg text-body-lg text-secondary font-bold">
              kg
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">
            Registro de hoje às{' '}
            {new Date(view.now).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            (em jejum)
            {view.weight
              ? ` • atual ${formatDecimal(view.weight.currentWeightKg)} kg`
              : ''}
          </p>
        </div>
        <button
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline-sm text-body-lg font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98 transition-transform disabled:opacity-60"
          disabled={saveWeight.pending || weight === ''}
          onClick={() => void saveWeight.run()}
          type="button"
        >
          {saveWeight.pending ? 'Gravando biometria...' : 'Confirmar e Salvar'}
        </button>
      </Sheet>
    </main>
  )
}
