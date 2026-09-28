import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Avatar } from '#/components/Avatar'
import { useAction } from '#/components/useAction'
import { formatDecimal } from '#/domain/format'
import { getProfile, postSaveGoals, postSignOut } from '#/server/actions'

export const Route = createFileRoute('/perfil')({
  loader: () => getProfile(),
  component: ProfileScreen,
})

function ProfileScreen() {
  const view = Route.useLoaderData()
  const [name, setName] = useState(view.profile.name)
  const [waterGoalMl, setWaterGoalMl] = useState(
    String(view.profile.waterGoalMl),
  )
  const [targetWeightKg, setTargetWeightKg] = useState(
    view.profile.targetWeightKg === null
      ? ''
      : String(view.profile.targetWeightKg),
  )
  const [startWeightKg, setStartWeightKg] = useState(
    view.profile.startWeightKg === null
      ? ''
      : String(view.profile.startWeightKg),
  )

  const signOut = useAction(async () => {
    await postSignOut()
  })

  const saveGoals = useAction(async () => {
    await postSaveGoals({
      data: {
        name,
        waterGoalMl: Number(waterGoalMl),
        targetWeightKg:
          targetWeightKg === '' ? undefined : Number(targetWeightKg),
        startWeightKg: startWeightKg === '' ? undefined : Number(startWeightKg),
      },
    })
  })

  const totals = view.totals

  return (
    <main className="flex-1 flex flex-col relative w-full pt-header pb-28 bg-surface">
      <div className="flex flex-col w-full px-margin pb-space-xl gap-space-lg">
        <section className="relative overflow-hidden rounded-lg bg-surface-container-high shadow-xl p-space-md">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-space-md relative z-10">
            <Avatar
              className="w-16 h-16 text-headline-sm"
              name={view.profile.name}
            />
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold tracking-tight truncate">
                {view.profile.name}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {view.protocol
                  ? `${view.protocol.name} • ${view.protocol.method}`
                  : 'Nenhum protocolo ativo'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-space-md relative z-10">
            <div className="p-3 rounded-2xl bg-surface-container-lowest/60">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Jejuns
              </span>
              <p className="font-timer-display-mobile text-timer-display-mobile text-on-surface font-bold tabular-nums">
                {totals.sessions}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-lowest/60">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Horas
              </span>
              <p className="font-timer-display-mobile text-timer-display-mobile text-on-surface font-bold tabular-nums">
                {totals.hours}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-lowest/60">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Sequência
              </span>
              <p className="font-timer-display-mobile text-timer-display-mobile text-primary font-bold tabular-nums">
                {totals.streak}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-surface-container-low p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">
                shield_person
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Conta
              </h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full font-label-badge text-label-badge font-bold ${
                view.profile.isGuest
                  ? 'bg-surface-variant text-on-surface-variant'
                  : 'bg-secondary/15 text-secondary'
              }`}
            >
              {view.profile.isGuest ? 'Visitante' : 'Conta'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-body-md text-body-md text-on-surface font-bold">
              {view.profile.email ?? 'Sessão de visitante'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {view.profile.isGuest
                ? 'Seus dados ficam isolados neste navegador. Saia e crie uma conta para acessar de qualquer aparelho.'
                : 'Seus jejuns, água, humor e peso ficam isolados nesta conta.'}
            </span>
          </div>

          <button
            className="w-full py-3.5 rounded-full bg-surface-container-highest/60 text-on-surface font-label-badge text-label-badge font-bold flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:opacity-60"
            disabled={signOut.pending}
            onClick={() => void signOut.run()}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            {signOut.pending ? 'Saindo...' : 'Sair da conta'}
          </button>
        </section>

        <section className="rounded-lg bg-surface-container-low p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              flag
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Metas Pessoais
            </h2>
          </div>

          <div className="space-y-2">
            <label
              className="font-label-caps text-label-caps text-on-surface-variant uppercase"
              htmlFor="profile-name"
            >
              Nome
            </label>
            <input
              className="w-full bg-surface-container-lowest rounded-2xl py-3.5 px-4 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              id="profile-name"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label
                className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                htmlFor="water-goal"
              >
                Água (ml)
              </label>
              <input
                className="w-full bg-surface-container-lowest rounded-2xl py-3.5 px-4 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 tabular-nums"
                id="water-goal"
                onChange={(event) => setWaterGoalMl(event.target.value)}
                type="number"
                value={waterGoalMl}
              />
            </div>
            <div className="space-y-2">
              <label
                className="font-label-caps text-label-caps text-on-surface-variant uppercase"
                htmlFor="target-weight"
              >
                Meta de peso (kg)
              </label>
              <input
                className="w-full bg-surface-container-lowest rounded-2xl py-3.5 px-4 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 tabular-nums"
                id="target-weight"
                onChange={(event) => setTargetWeightKg(event.target.value)}
                step="0.1"
                type="number"
                value={targetWeightKg}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="font-label-caps text-label-caps text-on-surface-variant uppercase"
              htmlFor="start-weight"
            >
              Peso inicial (kg)
            </label>
            <input
              className="w-full bg-surface-container-lowest rounded-2xl py-3.5 px-4 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 tabular-nums"
              id="start-weight"
              onChange={(event) => setStartWeightKg(event.target.value)}
              step="0.1"
              type="number"
              value={startWeightKg}
            />
          </div>

          {view.weight ? (
            <div className="flex items-center justify-between rounded-2xl bg-surface-container px-4 py-3">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Peso atual registrado
              </span>
              <span className="font-timer-display-mobile text-timer-display-mobile text-secondary font-bold tabular-nums">
                {formatDecimal(view.weight.currentWeightKg)} kg
              </span>
            </div>
          ) : null}

          <button
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-container to-surface-tint text-on-primary-container font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 active:scale-98 transition-transform disabled:opacity-60"
            disabled={saveGoals.pending}
            onClick={() => void saveGoals.run()}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saveGoals.pending ? 'Salvando...' : 'Salvar Metas'}
          </button>

          {saveGoals.error ? (
            <p className="font-body-sm text-body-sm text-error">
              {saveGoals.error.message}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg bg-surface-container-low p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">
                insights
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Resumo Metabólico
              </h2>
            </div>
            <span className="font-label-caps text-label-caps text-tertiary font-bold uppercase tabular-nums">
              {totals.efficacyPercent}% eficácia
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Recorde de sequência', value: `${totals.record} dias` },
              {
                label: 'Jejum mais longo',
                value: `${formatDecimal(totals.longestFastHours)} h`,
              },
              {
                label: 'Conquistas desbloqueadas',
                value: `${view.achievements.unlocked} de ${view.achievements.total}`,
              },
            ].map((row) => (
              <div
                className="flex items-center justify-between border-b border-surface-container-high/40 pb-2 last:border-none last:pb-0"
                key={row.label}
              >
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {row.label}
                </span>
                <span className="font-timer-display-mobile text-timer-display-mobile text-on-surface text-[16px] font-bold tabular-nums">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
