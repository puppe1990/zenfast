import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { HydrationCard } from '#/components/HydrationCard'
import { MetabolicStepper } from '#/components/MetabolicStepper'
import { MoodCard } from '#/components/MoodCard'
import { NextWindowCard } from '#/components/NextWindowCard'
import { PhaseCard } from '#/components/PhaseCard'
import { ProtocolPill } from '#/components/ProtocolPill'
import { RadialFastingTimer } from '#/components/RadialFastingTimer'
import { Sheet } from '#/components/Sheet'
import { useAction } from '#/components/useAction'
import { MAX_BACKDATE_HOURS } from '#/domain/fasting'
import { formatDateTimeInput } from '#/domain/format'
import { MOOD_LEVELS } from '#/domain/mood'
import type { MoodLevel } from '#/domain/types'
import {
  getDashboard,
  postAddWater,
  postEndFast,
  postSaveMood,
  postStartFast,
} from '#/server/actions'

export const Route = createFileRoute('/')({
  loader: () => getDashboard(),
  component: TimerScreen,
})

const BREAK_FOOD_SUGGESTIONS = [
  'Caldo de ossos + Ovos mexidos',
  'Salmão grelhado com salada de folhas',
  'Iogurte natural com frutas vermelhas',
]

const BACKDATE_OPTIONS = [
  { label: 'Agora', hoursAgo: 0 },
  { label: '1h atrás', hoursAgo: 1 },
  { label: '2h atrás', hoursAgo: 2 },
  { label: '4h atrás', hoursAgo: 4 },
]

function TimerScreen() {
  const dashboard = Route.useLoaderData()
  const now = new Date(dashboard.now)
  const [endSheetOpen, setEndSheetOpen] = useState(false)
  const [startSheetOpen, setStartSheetOpen] = useState(false)
  const [moodSheetOpen, setMoodSheetOpen] = useState(false)
  const [breakFood, setBreakFood] = useState(BREAK_FOOD_SUGGESTIONS[0])
  const [startedAtInput, setStartedAtInput] = useState(() =>
    formatDateTimeInput(new Date()),
  )
  const [moodNoteInput, setMoodNoteInput] = useState('')
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(
    dashboard.mood?.level ?? 'otima',
  )
  const [moodNote, setMoodNote] = useState(dashboard.mood?.note ?? '')

  const water = useAction(async () => {
    await postAddWater({ data: { amountMl: 250 } })
  })
  const startFast = useAction(async (startedAt?: string) => {
    await postStartFast({ data: startedAt ? { startedAt } : {} })
    setStartSheetOpen(false)
  })
  const endFast = useAction(async () => {
    await postEndFast({
      data: {
        breakFood,
        moodNote: moodNoteInput.trim() === '' ? undefined : moodNoteInput,
      },
    })
    setEndSheetOpen(false)
    setMoodNoteInput('')
  })
  const saveMood = useAction(async () => {
    await postSaveMood({
      data: { level: moodLevel, note: moodNote || undefined },
    })
    setMoodSheetOpen(false)
  })

  const hasActiveFast = dashboard.activeSession !== null

  const openStartSheet = () => {
    setStartedAtInput(formatDateTimeInput(new Date()))
    setStartSheetOpen(true)
  }

  const confirmBackdatedStart = () => {
    const parsed = new Date(startedAtInput)

    if (Number.isNaN(parsed.getTime())) {
      return
    }

    void startFast.run(parsed.toISOString())
  }

  return (
    <main className="flex-1 flex flex-col relative w-full pt-header pb-28 bg-surface">
      <div className="flex flex-col w-full px-margin pb-space-xl gap-space-lg select-none">
        <ProtocolPill
          activeSession={dashboard.activeSession}
          goalHours={dashboard.goalHours}
          now={now}
          protocolName={dashboard.protocol.name}
        />

        <RadialFastingTimer
          initialProgress={dashboard.progress}
          startedAt={dashboard.activeSession?.startedAt ?? null}
          targetHours={dashboard.timerTargetHours}
        />

        <PhaseCard stage={dashboard.stage} />

        <MetabolicStepper
          cyclePercent={dashboard.cyclePercent}
          stageIndex={dashboard.stageIndex}
        />

        <div className="grid grid-cols-2 gap-space-sm">
          <HydrationCard
            consumedMl={dashboard.hydration.consumedMl}
            disabled={water.pending}
            goalMl={dashboard.hydration.goalMl}
            lastLogAt={dashboard.hydration.lastLogAt}
            now={now}
            onAdd={() => void water.run()}
            segments={dashboard.hydration.segments}
          />
          <MoodCard
            mood={dashboard.mood}
            onEdit={() => setMoodSheetOpen(true)}
          />
        </div>

        <NextWindowCard
          durationHours={dashboard.nextWindow.durationHours}
          endLabel={dashboard.nextWindow.endLabel}
          hint={dashboard.tipOfTheDay?.body ?? null}
          startLabel={dashboard.nextWindow.startLabel}
        />

        <div className="flex flex-col gap-space-sm mt-space-xs">
          {hasActiveFast ? (
            <button
              className="w-full h-14 rounded-full bg-gradient-to-r from-primary-container via-primary to-primary-fixed-dim text-on-primary-container font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all"
              onClick={() => setEndSheetOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">
                stop_circle
              </span>
              Encerrar Jejum Mais Cedo
            </button>
          ) : (
            <>
              <button
                className="w-full h-14 rounded-full bg-gradient-to-r from-primary-container via-primary to-primary-fixed-dim text-on-primary-container font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all disabled:opacity-60"
                disabled={startFast.pending}
                onClick={() => void startFast.run()}
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">
                  play_circle
                </span>
                Iniciar Jejum Agora
              </button>

              <button
                className="w-full h-11 rounded-full text-on-surface-variant hover:text-primary font-label-badge text-label-badge font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                disabled={startFast.pending}
                onClick={openStartSheet}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  history
                </span>
                Comecei em outro horário
              </button>
            </>
          )}

          <button
            className="w-full h-12 rounded-full bg-surface-container-highest/60 backdrop-blur-md text-on-surface hover:text-primary font-label-badge text-label-badge font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            disabled={water.pending}
            onClick={() => void water.run()}
            type="button"
          >
            <span className="material-symbols-outlined text-secondary-fixed-dim text-[18px]">
              water_drop
            </span>
            Registrar Água (+250ml)
          </button>
        </div>

        {startFast.error || water.error || endFast.error ? (
          <p className="font-body-sm text-body-sm text-error text-center">
            {(startFast.error ?? water.error ?? endFast.error)?.message}
          </p>
        ) : null}
      </div>

      <Sheet
        description="Registre como você quebrou o jejum para calibrar seu histórico."
        onClose={() => setEndSheetOpen(false)}
        open={endSheetOpen}
        title="Encerrar Jejum"
      >
        <div className="space-y-3">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="break-food"
          >
            Primeira refeição
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50"
            id="break-food"
            onChange={(event) => setBreakFood(event.target.value)}
            value={breakFood}
          />
          <div className="flex flex-wrap gap-2">
            {BREAK_FOOD_SUGGESTIONS.map((suggestion) => (
              <button
                className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-badge text-label-badge"
                key={suggestion}
                onClick={() => setBreakFood(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="end-mood-note"
          >
            Sensação somática (opcional)
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50"
            id="end-mood-note"
            onChange={(event) => setMoodNoteInput(event.target.value)}
            placeholder="Alta energia e clareza mental"
            value={moodNoteInput}
          />
        </div>
        <button
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline-sm text-body-lg font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98 transition-transform disabled:opacity-60"
          disabled={endFast.pending}
          onClick={() => void endFast.run()}
          type="button"
        >
          {endFast.pending ? 'Registrando...' : 'Confirmar e Encerrar'}
        </button>
      </Sheet>

      <Sheet
        description="Ajuste o horário real em que você começou a jejuar."
        onClose={() => setStartSheetOpen(false)}
        open={startSheetOpen}
        title="Iniciar Jejum"
      >
        <div className="flex flex-wrap gap-2">
          {BACKDATE_OPTIONS.map((option) => (
            <button
              className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-badge text-label-badge hover:text-primary transition-colors"
              key={option.label}
              onClick={() =>
                setStartedAtInput(
                  formatDateTimeInput(
                    new Date(Date.now() - option.hoursAgo * 3_600_000),
                  ),
                )
              }
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="start-at"
          >
            Início do jejum
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            id="start-at"
            max={formatDateTimeInput(new Date())}
            min={formatDateTimeInput(
              new Date(Date.now() - MAX_BACKDATE_HOURS * 3_600_000),
            )}
            onChange={(event) => setStartedAtInput(event.target.value)}
            type="datetime-local"
            value={startedAtInput}
          />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Você pode registrar um início de até {MAX_BACKDATE_HOURS / 24} dias
            atrás.
          </p>
        </div>
        <button
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline-sm text-body-lg font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98 transition-transform disabled:opacity-60"
          disabled={startFast.pending || startedAtInput === ''}
          onClick={confirmBackdatedStart}
          type="button"
        >
          {startFast.pending ? 'Iniciando...' : 'Iniciar Jejum'}
        </button>
        {startFast.error ? (
          <p className="font-body-sm text-body-sm text-error text-center">
            {startFast.error.message}
          </p>
        ) : null}
      </Sheet>

      <Sheet
        description="Mantenha seu algoritmo bio-metabólico calibrado."
        onClose={() => setMoodSheetOpen(false)}
        open={moodSheetOpen}
        title="Registrar Disposição"
      >
        <div className="grid grid-cols-2 gap-3">
          {MOOD_LEVELS.map((option) => (
            <button
              className={`p-3 rounded-2xl flex flex-col items-start gap-1 text-left transition-all ${
                moodLevel === option.id
                  ? 'bg-primary-container/20 ring-1 ring-primary/40'
                  : 'bg-surface-container'
              }`}
              key={option.id}
              onClick={() => setMoodLevel(option.id)}
              type="button"
            >
              <span className="text-xl leading-none">{option.emoji}</span>
              <span className="font-label-badge text-label-badge text-on-surface font-bold">
                {option.label}
              </span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="mood-note"
          >
            Observação
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            id="mood-note"
            onChange={(event) => setMoodNote(event.target.value)}
            placeholder="Foco mental aguçado"
            value={moodNote}
          />
        </div>
        <button
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline-sm text-body-lg font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98 transition-transform disabled:opacity-60"
          disabled={saveMood.pending}
          onClick={() => void saveMood.run()}
          type="button"
        >
          {saveMood.pending ? 'Salvando...' : 'Salvar Registro'}
        </button>
      </Sheet>
    </main>
  )
}
