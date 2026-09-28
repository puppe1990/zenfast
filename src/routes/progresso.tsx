import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { AchievementsGrid } from '#/components/AchievementsGrid'
import { HistoryList } from '#/components/HistoryList'
import { KpiGrid } from '#/components/KpiGrid'
import { Sheet } from '#/components/Sheet'
import { useAction } from '#/components/useAction'
import { WeeklyBars } from '#/components/WeeklyBars'
import { WeightCard } from '#/components/WeightCard'
import {
  formatDateTimeInput,
  formatDecimal,
  formatDurationFromHours,
  formatTime,
  parseDateTimeInput,
} from '#/domain/format'
import type { HistoryEntry } from '#/server/services/progress'
import {
  getProgress,
  postCreateHistoryEntry,
  postDeleteHistoryEntry,
  postSaveWeight,
  postUpdateHistoryEntry,
} from '#/server/actions'

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
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<HistoryEntry | null>(null)
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [breakFood, setBreakFood] = useState('')
  const [moodNote, setMoodNote] = useState('')
  const [notes, setNotes] = useState('')

  const saveWeight = useAction(async () => {
    await postSaveWeight({ data: { weightKg: Number(weight) } })
    setSheetOpen(false)
  })

  const submitHistory = useAction(async () => {
    const start = parseDateTimeInput(startInput)
    const end = parseDateTimeInput(endInput)

    if (!start || !end) {
      return
    }

    const payload = {
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
      breakFood: breakFood.trim() === '' ? undefined : breakFood.trim(),
      moodNote: moodNote.trim() === '' ? undefined : moodNote.trim(),
      notes: notes.trim() === '' ? undefined : notes.trim(),
    }

    if (editingId === null) {
      await postCreateHistoryEntry({ data: payload })
    } else {
      await postUpdateHistoryEntry({
        data: { sessionId: editingId, ...payload },
      })
    }

    setHistoryOpen(false)
  })

  const confirmDelete = useAction(async () => {
    if (!deleting) {
      return
    }

    await postDeleteHistoryEntry({ data: { sessionId: deleting.id } })
    setDeleting(null)
  })

  const openCreateHistory = () => {
    const now = new Date()

    setEditingId(null)
    setStartInput(
      formatDateTimeInput(
        new Date(now.getTime() - view.targetHours * 3_600_000),
      ),
    )
    setEndInput(formatDateTimeInput(now))
    setBreakFood('')
    setMoodNote('')
    setNotes('')
    setHistoryOpen(true)
  }

  const openEditHistory = (entry: HistoryEntry) => {
    setEditingId(entry.id)
    setStartInput(formatDateTimeInput(entry.startedAt))
    setEndInput(formatDateTimeInput(entry.endedAt))
    setBreakFood(entry.breakFood ?? '')
    setMoodNote(entry.moodNote ?? '')
    setNotes(entry.notes ?? '')
    setHistoryOpen(true)
  }

  const startPreview = parseDateTimeInput(startInput)
  const endPreview = parseDateTimeInput(endInput)
  const durationPreview =
    startPreview && endPreview && endPreview.getTime() > startPreview.getTime()
      ? formatDurationFromHours(
          (endPreview.getTime() - startPreview.getTime()) / 3_600_000,
        )
      : null

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

        <HistoryList
          entries={view.history}
          onCreate={openCreateHistory}
          onDelete={(entry) => setDeleting(entry)}
          onEdit={openEditHistory}
        />
      </div>

      <Sheet
        description={
          editingId === null
            ? 'Registre um jejum que você fez e não marcou no timer.'
            : 'Corrija os horários, a refeição ou as observações do jejum.'
        }
        onClose={() => setHistoryOpen(false)}
        open={historyOpen}
        title={editingId === null ? 'Adicionar Jejum' : 'Editar Jejum'}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label
              className="font-label-caps text-label-caps text-on-surface-variant uppercase"
              htmlFor="history-start"
            >
              Início
            </label>
            <input
              className="w-full bg-surface-container-lowest rounded-2xl py-3 px-4 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              id="history-start"
              max={formatDateTimeInput(new Date())}
              onChange={(event) => setStartInput(event.target.value)}
              type="datetime-local"
              value={startInput}
            />
          </div>
          <div className="space-y-2">
            <label
              className="font-label-caps text-label-caps text-on-surface-variant uppercase"
              htmlFor="history-end"
            >
              Término
            </label>
            <input
              className="w-full bg-surface-container-lowest rounded-2xl py-3 px-4 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              id="history-end"
              max={formatDateTimeInput(new Date())}
              onChange={(event) => setEndInput(event.target.value)}
              type="datetime-local"
              value={endInput}
            />
          </div>
        </div>
        {durationPreview ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">
            Duração do jejum: {durationPreview}
          </p>
        ) : null}
        <div className="space-y-3">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="history-break-food"
          >
            Primeira refeição
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50"
            id="history-break-food"
            onChange={(event) => setBreakFood(event.target.value)}
            placeholder="Caldo de ossos + Ovos mexidos"
            value={breakFood}
          />
        </div>
        <div className="space-y-3">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="history-mood-note"
          >
            Sensação somática
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50"
            id="history-mood-note"
            onChange={(event) => setMoodNote(event.target.value)}
            placeholder="Alta energia e clareza mental"
            value={moodNote}
          />
        </div>
        <div className="space-y-3">
          <label
            className="font-label-caps text-label-caps text-on-surface-variant uppercase"
            htmlFor="history-notes"
          >
            Observações
          </label>
          <input
            className="w-full bg-surface-container-lowest rounded-2xl py-4 px-5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            id="history-notes"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Balanço ou meta pretendida"
            value={notes}
          />
        </div>
        <button
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline-sm text-body-lg font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98 transition-transform disabled:opacity-60"
          disabled={
            submitHistory.pending || startInput === '' || endInput === ''
          }
          onClick={() => void submitHistory.run()}
          type="button"
        >
          {submitHistory.pending
            ? 'Salvando...'
            : editingId === null
              ? 'Adicionar ao Histórico'
              : 'Salvar Alterações'}
        </button>
        {submitHistory.error ? (
          <p className="font-body-sm text-body-sm text-error text-center">
            {submitHistory.error.message}
          </p>
        ) : null}
      </Sheet>

      <Sheet
        description={
          deleting
            ? `O jejum de ${deleting.dateLabel} (${deleting.durationLabel}) será removido do seu histórico.`
            : undefined
        }
        onClose={() => setDeleting(null)}
        open={deleting !== null}
        title="Excluir Jejum"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-error/10 p-4">
          <span className="material-symbols-outlined text-error text-[24px]">
            warning
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Esta ação não pode ser desfeita e afeta suas estatísticas, sequência
            e conquistas.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="flex-1 py-4 rounded-full bg-surface-container-highest/60 text-on-surface font-headline-sm text-body-lg font-bold active:scale-98 transition-transform"
            onClick={() => setDeleting(null)}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-4 rounded-full bg-error text-on-error font-headline-sm text-body-lg font-extrabold active:scale-98 transition-transform disabled:opacity-60"
            disabled={confirmDelete.pending}
            onClick={() => void confirmDelete.run()}
            type="button"
          >
            {confirmDelete.pending ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
        {confirmDelete.error ? (
          <p className="font-body-sm text-body-sm text-error text-center">
            {confirmDelete.error.message}
          </p>
        ) : null}
      </Sheet>

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
